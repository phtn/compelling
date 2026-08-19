/*
 * Based on: https://threejs.org/examples/?q=tsl#webgpu_tsl_compute_attractors_particles
 */

import { randf } from '@typegpu/noise'
import * as t3 from '@typegpu/three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { color, mul, uniform } from 'three/tsl'
import * as THREE from 'three/webgpu'
import { d, std } from 'typegpu'
import { ctrl } from './controls'

// Canvas will be injected by the host component. Fallback for standalone usage.
const canvas = (typeof document !== 'undefined'
  ? (document.querySelector('canvas') as HTMLCanvasElement | null)
  : null) as HTMLCanvasElement | null

const scene = new THREE.Scene()

// camera

const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 100)
camera.position.set(3, 5, 8)

// ambient light

const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
scene.add(ambientLight)

// directional light

const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5)
directionalLight.position.set(4, 2, 0)
scene.add(directionalLight)

// renderer — created lazily so the module can be imported without a canvas
let renderer: THREE.WebGPURenderer | null = null
let orbitControls: OrbitControls | null = null
let observer: ResizeObserver | null = null
let initialized = false

async function ensureRenderer(targetCanvas: HTMLCanvasElement) {
  if (renderer) return renderer
  renderer = new THREE.WebGPURenderer({ antialias: true, canvas: targetCanvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  void renderer.setAnimationLoop(animate)
  renderer.setClearColor('#000000')
  await renderer.init()
  orbitControls = new OrbitControls(camera, renderer.domElement)
  orbitControls.enableDamping = true
  orbitControls.minDistance = 0.1
  orbitControls.maxDistance = 50
  // attach transform controls helpers that were created earlier when possible
  // (they are created after renderer is ready in initAttractors)
  return renderer
}

// If a canvas existed at import time (legacy behavior), init immediately.
if (canvas) {
  void ensureRenderer(canvas).then(() => initAttractors())
}

// attractors

const attractorsPositions = t3.uniformArray(
  [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, -0.5), new THREE.Vector3(0, 0.5, 1)],
  d.vec4f
)
const attractorsRotationAxes = t3.uniformArray(
  [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, -0.5).normalize()],
  d.vec4f
)
const attractorsLength = t3.uniform(attractorsPositions.node.array.length, d.u32)
const helpersRingGeometry = new THREE.RingGeometry(1, 1.02, 32, 1, 0, Math.PI * 1.5)
const helpersArrowGeometry = new THREE.ConeGeometry(0.1, 0.4, 12, 1, false)
const helpersMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })

const attractorsHelpers: { controls: TransformControls; arrow: THREE.Group }[] = []

function initAttractors() {
  if (initialized) return
  if (!renderer || !orbitControls) return
  initialized = true
  for (let i = 0; i < attractorsPositions.node.array.length; i++) {
    const position = attractorsPositions.node.array[i] as THREE.Vector3
    const orientation = attractorsRotationAxes.node.array[i] as THREE.Vector3
    const reference = new THREE.Object3D()
    reference.position.copy(position)
    reference.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), orientation)
    scene.add(reference)

    const arrowHelper = new THREE.Group()
    arrowHelper.scale.setScalar(0.325)
    reference.add(arrowHelper)

    const ring = new THREE.Mesh(helpersRingGeometry, helpersMaterial)
    ring.rotation.x = -Math.PI * 0.5
    arrowHelper.add(ring)

    const arrow = new THREE.Mesh(helpersArrowGeometry, helpersMaterial)
    arrow.position.x = 1
    arrow.position.z = 0.2
    arrow.rotation.x = Math.PI * 0.5
    arrowHelper.add(arrow)

    const attractorControls = new TransformControls(camera, renderer!.domElement)

    attractorControls.mode = 'translate'
    attractorControls.size = 0.5
    attractorControls.attach(reference)
    attractorControls.enabled = true
    scene.add(attractorControls.getHelper())

    attractorControls.addEventListener('dragging-changed', (event) => {
      if (orbitControls) orbitControls.enabled = !event.value
    })

    attractorControls.addEventListener('change', () => {
      position.copy(reference.position)
      orientation.copy(new THREE.Vector3(0, 1, 0).applyQuaternion(reference.quaternion))
    })

    attractorsHelpers.push({ controls: attractorControls, arrow: arrowHelper })
  }
}

// particles

const count = 2 ** 18
const material = new THREE.SpriteNodeMaterial({
  blending: THREE.AdditiveBlending,
  depthWrite: false
})

const attractorMass = t3.uniform(1e7, d.f32)
const particleGlobalMass = t3.uniform(1e4, d.f32)
const spinningStrength = t3.uniform(2.75, d.f32)
const maxSpeed = t3.uniform(8, d.f32)
const gravityConstant = 6.67e-11
const velocityDamping = t3.uniform(0.1, d.f32)
const scale = uniform(0.008)
const boundHalfExtent = t3.uniform(8, d.f32)
const colorA = t3.uniform(color('#5900ff'), d.vec3f)
const colorB = t3.uniform(color('#ffa575'), d.vec3f)

const positionBuffer = t3.instancedArray(count, d.vec3f)
const velocityBuffer = t3.instancedArray(count, d.vec3f)

// typegpu accessors

const seed = Math.random()

const velocityBufferAttributeTA = t3.fromTSL(velocityBuffer.node.toAttribute(), d.vec3f)

// init compute

const sphericalToVec3 = (phi: number, theta: number) => {
  'use gpu'
  const sinPhiRadius = std.sin(phi)

  return d.vec3f(std.mul(sinPhiRadius, std.sin(theta)), std.cos(phi), std.mul(sinPhiRadius, std.cos(theta)))
}

const initCompute = t3.toTSL(() => {
  'use gpu'
  const instanceIndex = t3.instanceIndex.$
  randf.seed(instanceIndex / count + seed)

  const basePosition = std.mul(std.sub(randf.inUnitCube(), d.vec3f(0.5)), d.vec3f(5, 0.2, 5))
  positionBuffer.$[instanceIndex] = d.vec3f(basePosition)

  const phi = std.mul(randf.sample(), 2 * Math.PI)
  const theta = std.mul(randf.sample(), 2)
  const baseVelocity = std.mul(sphericalToVec3(phi, theta), 0.05)
  velocityBuffer.$[instanceIndex] = d.vec3f(baseVelocity)
})

const reset = () => {
  if (!renderer) return Promise.resolve()
  return renderer.compute((initCompute as any).compute(count))
}
if (renderer) void reset()

// update compute

const getParticleMassMultiplier = () => {
  'use gpu'
  randf.seed(t3.instanceIndex.$ / count + seed)
  // in the original example, the values are remapped to [-1/3, 1] instead of [1/4, 1]
  const base = 0.25 + std.div(std.mul(randf.sample(), 3), 4)
  return base
}

const getParticleMass = () => {
  'use gpu'
  return std.mul(getParticleMassMultiplier(), particleGlobalMass.$)
}

const update = t3.toTSL(() => {
  'use gpu'
  const delta = 1 / 60
  let position = d.vec3f(positionBuffer.$[t3.instanceIndex.$])
  let velocity = d.vec3f(velocityBuffer.$[t3.instanceIndex.$])

  // force
  let force = d.vec3f()

  for (let i = d.u32(0); i < attractorsLength.$; i++) {
    const attractorPosition = attractorsPositions.$[i]!.xyz
    const attractorRotationAxis = attractorsRotationAxes.$[i]!.xyz

    const toAttractor = std.sub(attractorPosition, position)
    const distance = std.length(toAttractor)
    const direction = std.normalize(toAttractor)

    // gravity
    const gravityStrength = std.div(
      std.mul(std.mul(attractorMass.$, getParticleMass()), gravityConstant),
      std.mul(distance, distance)
    )
    const gravityForce = std.mul(direction, gravityStrength)
    force = std.add(force, gravityForce)

    // spinning
    const spinningForce = std.mul(std.mul(attractorRotationAxis, gravityStrength), spinningStrength.$)
    const spinningVelocity = std.cross(spinningForce, toAttractor)
    force = std.add(force, spinningVelocity)
  }

  // velocity
  velocity = std.add(velocity, std.mul(force, delta))
  const speed = std.length(velocity)
  if (speed > maxSpeed.$) {
    velocity = std.mul(std.normalize(velocity), maxSpeed.$)
  }
  velocity = std.mul(velocity, std.sub(1, velocityDamping.$))

  // position
  position = std.add(position, std.mul(velocity, delta))

  // box loop
  const halfHalfExtent = std.div(boundHalfExtent.$, 2)
  position = std.sub(std.mod(std.add(position, halfHalfExtent), boundHalfExtent.$), halfHalfExtent)

  positionBuffer.$[t3.instanceIndex.$] = d.vec3f(position)
  velocityBuffer.$[t3.instanceIndex.$] = d.vec3f(velocity)
})

const updateCompute = (update as any).compute(count).setName('Update Particles')

// nodes

// positionNode expects an attribute node; cast to satisfy SpriteNodeMaterial's typed setter
(material as any).positionNode = positionBuffer.node.toAttribute()

(material as any).colorNode = t3.toTSL(() => {
  'use gpu'
  const velocity = velocityBufferAttributeTA.$
  const speed = std.length(velocity)
  const colorMix = std.smoothstep(0, 0.5, std.div(speed, maxSpeed.$))
  const finalColor = std.mix(colorA.$, colorB.$, colorMix)

  return d.vec4f(finalColor, 1)
}) as unknown as any

(material as any).scaleNode = mul(t3.toTSL(getParticleMassMultiplier) as unknown as any, scale) as unknown as any

// mesh

const geometry = new THREE.PlaneGeometry(1, 1)
const mesh = new THREE.InstancedMesh(geometry, material, count)
scene.add(mesh)

const onResize: ResizeObserverCallback = (entries) => {
  const size = entries[0]?.devicePixelContentBoxSize[0]
  if (size && renderer) {
    const targetCanvas = renderer.domElement as HTMLCanvasElement
    targetCanvas.width = size.inlineSize
    targetCanvas.height = size.blockSize
    renderer.setSize(size.inlineSize, size.blockSize, false)
    camera.aspect = size.inlineSize / size.blockSize
    camera.updateProjectionMatrix()
  }
}

function observeCanvas(target: HTMLCanvasElement) {
  if (observer) observer.disconnect()
  observer = new ResizeObserver(onResize)
  observer.observe(target)
}

if (canvas && renderer) observeCanvas(canvas as HTMLCanvasElement)

async function animate() {
  if (!renderer) return
  if (orbitControls) orbitControls.update()
  void renderer.compute(updateCompute)
  renderer.render(scene, camera)
}

// #region Example controls and cleanup

export const controls = ctrl({
  'Controls Mode': {
    initial: 'translate',
    options: ['translate', 'rotate', 'none'],
    onSelectChange: (value) => {
      for (const { controls } of attractorsHelpers) {
        if (value === 'none') {
          controls.getHelper().visible = false
          controls.enabled = false
        } else {
          controls.getHelper().visible = true
          controls.enabled = true
          controls.setMode(value as 'translate' | 'rotate' | 'scale')
        }
      }
    }
  },
  'Arrow visible': {
    initial: true,
    onToggleChange: (value) => {
      for (const { arrow } of attractorsHelpers) {
        arrow.visible = value
      }
    }
  },
  'Attractor Mass Exponent': {
    initial: 7,
    min: 0,
    max: 10,
    step: 1,
    onSliderChange: (newValue) => {
      attractorMass.node.value = Number(`1e${newValue}`)
    }
  },
  'Particle Global Mass Exponent': {
    initial: 4,
    min: 0,
    max: 10,
    step: 1,
    onSliderChange: (newValue) => {
      particleGlobalMass.node.value = Number(`1e${newValue}`)
    }
  },
  'Max Speed': {
    initial: 8,
    min: 0,
    max: 10,
    step: 0.01,
    onSliderChange: (newValue) => {
      maxSpeed.node.value = newValue
    }
  },
  'Velocity Damping': {
    initial: 0.1,
    min: 0,
    max: 0.1,
    step: 0.001,
    onSliderChange: (newValue) => {
      velocityDamping.node.value = newValue
    }
  },
  'Spinning Strength': {
    initial: 2.75,
    min: 0,
    max: 10,
    step: 0.01,
    onSliderChange: (newValue) => {
      spinningStrength.node.value = newValue
    }
  },
  Scale: {
    initial: 0.008,
    min: 0,
    max: 0.1,
    step: 0.001,
    onSliderChange: (newValue) => {
      scale.value = newValue
    }
  },
  'Bound Half Extent': {
    initial: 8,
    min: 0,
    max: 20,
    step: 0.01,
    onSliderChange: (newValue) => {
      boundHalfExtent.node.value = newValue
    }
  },
  'Color A': {
    initial: d.vec3f(colorA.node.value.r, colorA.node.value.g, colorA.node.value.b),
    onColorChange: (newValue) => {
      colorA.node.value.setRGB(newValue[0]!, newValue[1]!, newValue[2]!)
    }
  },
  'Color B': {
    initial: d.vec3f(colorB.node.value.r, colorB.node.value.g, colorB.node.value.b),
    onColorChange: (newValue) => {
      colorB.node.value.setRGB(newValue[0]!, newValue[1]!, newValue[2]!)
    }
  },
  'Reset Particles': {
    onButtonClick: reset
  }
})

export function onCleanup() {
  if (observer) observer.disconnect()
  if (renderer) renderer.dispose()
  renderer = null
  orbitControls = null
}

// Helper for Frame-based mounting (used by tgpu.btsx)
export async function mountAttractor(targetCanvas: HTMLCanvasElement) {
  await ensureRenderer(targetCanvas)
  observeCanvas(targetCanvas)
  initAttractors()
  await reset()
  return onCleanup
}

export { scene, camera, renderer }


// #endregion
