import type { IconName } from '@/lib/icons/types'

export type NavItem = {
  href: string
  icon: IconName
  label: string
  description: string
  title: string
  value: string | number
  tags: string[]
}

export type NavGroup = {
  title: string
  items: NavItem[]
}
export const navGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      { href: '/', icon: 'overview', label: 'Overview', title: '', description: '', value: '0', tags: [] },
      {
        href: '/canvas',
        icon: 'canvas',
        label: 'Canvas',
        title: 'Real-Time Collaborative Canvas',
        description:
          'Superior reactivity and fine-grained state sync. Only re-renders changed pixels, not entire canvas. WebSocket delta sync, presence cursors, 60fps strokes.',
        value: '01',
        tags: ['useState', 'useEffect', 'delta sync', 'ResizeObserver']
      },
      {
        href: '/form',
        icon: 'forms',
        label: 'Form',
        title: 'Adaptive Form with Validation Streams',
        description:
          'Composable async flows and cancellation. Debounced 300ms, cancelOnUpdate, race handling. No manual subscriptions.',
        value: '02',
        tags: ['derive + cancel', 'AbortController', 'optimistic UI']
      },
      {
        href: '/grid',
        icon: 'grid',
        label: 'Grid',
        title: 'Virtualized Masonry Grid',
        description:
          'Zero-config performance. Built-in virtualization + masonry, ResizeObserver remeasure, 10k+ items, overscan, dynamic heights.',
        value: '03',
        tags: ['virtualize', 'ResizeObserver', 'columns']
      },
      {
        href: '/shell',
        icon: 'new-folder',
        label: 'Shell',
        title: 'Isomorphic Shell with Progressive Hydration',
        description:
          'Seamless SSR without hydration mismatches. Same component server + client. suspend/resume, hydration when idle/visible/interaction.',
        value: '04',
        tags: ['Hydrate', 'Suspense', 'lazy']
      },
      {
        href: '/timeline',
        icon: 'timeline',
        label: 'Timeline',
        title: 'Timeline — Time as Dimension',
        description: 'Every signal gets .timeline(). Scrub, fork, diff. Structural sharing, branch from any point.',
        value: '05',
        tags: ['timeline', 'fork', 'structural sharing']
      },
      {
        href: '/worker',
        icon: 'folder',
        label: 'Worker',
        title: 'Worker — Zero-Cost Threading',
        description:
          'SharedArrayBuffer auto-proxy, 120fps physics without blocking. Gravity slider updates worker instantly.',
        value: '06',
        tags: ['SharedArrayBuffer', 'Atomics', '~0ms']
      },
      {
        href: '/motion',
        icon: 'mechanics',
        label: 'Motion',
        title: 'Motion — Animation Orchestrator',
        description: 'Interruptible springs, velocity preserved, mode:"interrupt". No Framer 40kb.',
        value: '07',
        tags: ['spring', 'interrupt', 'onPan']
      },
      {
        href: '/streaming',
        icon: 'play',
        label: 'Streaming',
        title: 'Streaming — Edge at CDN',
        description: 'Streams progressively from edge — yield skeleton then each card. Keyed cache at CDN.',
        value: '08',
        tags: ['streaming', 'edge', 'cache']
      },
      {
        href: '/tgpu',
        icon: 'mechanics',
        label: 'TypeGPU',
        title: 'TypeGPU — WebGPU',
        description: 'WebGPU rendering with zero-cost threading.',
        value: '09',
        tags: ['WebGPU']
      }
    ]
  },
  {
    title: 'Resources',
    items: [
      {
        href: 'https://beast-docs.vercel.app',
        icon: 'mechanics',
        label: 'beast-tsrx',
        title: '',
        description: '',
        value: '↗',
        tags: ['']
      },
      {
        href: 'https://octanejs.dev',
        icon: 'mechanics',
        label: 'octane',
        title: '',
        description: '',
        value: '↗',
        tags: ['']
      },
      { href: 'https://tsrx.dev', icon: 'mechanics', label: 'tsrx', title: '', description: '', value: '↗', tags: [''] }
    ]
  }
]
