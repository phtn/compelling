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
      {
        href: '/',
        icon: 'overview',
        label: 'Overview',
        title: '',
        description: '',
        value: '00',
        tags: []
      },
      {
        href: '/canvas',
        icon: 'canvas',
        label: 'Canvas',
        title: 'Multiplayer Canvas',
        description:
          'Superior reactivity and fine-grained state sync. Only re-renders changed pixels, not entire canvas. WebSocket delta sync, presence cursors, 60fps strokes.',
        value: '01',
        tags: ['useState/Effect', 'ResizeObserver']
      },
      {
        href: '/form',
        icon: 'forms',
        label: 'Form',
        title: 'Adaptive Form with Validation Streams',
        description:
          'Composable async flows and cancellation. Debounced 300ms, cancelOnUpdate, race handling. No manual subscriptions.',
        value: '02',
        tags: ['AbortController', 'optimistic UI']
      },
      {
        href: '/grid',
        icon: 'grid',
        label: 'Grid',
        title: 'Virtualized Masonry Grid',
        description:
          'Zero-config performance. Built-in virtualization + masonry, ResizeObserver remeasure, 10k+ items, overscan, dynamic heights.',
        value: '03',
        tags: ['virtualized']
      },
      {
        href: '/shell',
        icon: 'new-folder',
        label: 'Shell',
        title: 'Isomorphic Shell with Progressive Hydration',
        description:
          'Seamless SSR without hydration mismatches. Same component server + client. suspend/resume, hydration when idle/visible/interaction.',
        value: '04',
        tags: ['Hydration', 'Suspense']
      },
      {
        href: '/timeline',
        icon: 'timeline',
        label: 'Timeline',
        title: 'Timeline — Time as Dimension',
        description:
          'Every signal gets .timeline(). Scrub, fork, diff. Structural sharing, branch from any point.',
        value: '05',
        tags: ['structural sharing']
      },
      {
        href: '/worker',
        icon: 'folder',
        label: 'Worker',
        title: 'Worker — Zero-Cost Threading',
        description:
          'SharedArrayBuffer auto-proxy, 120fps physics without blocking. Gravity slider updates worker instantly.',
        value: '06',
        tags: ['SharedArrayBuffer', 'Atomics']
      },
      {
        href: '/motion',
        icon: 'mechanics',
        label: 'Motion',
        title: 'Motion — Animation Orchestrator',
        description:
          'Interruptible springs, velocity preserved, mode:"interrupt". No Framer 40kb.',
        value: '07',
        tags: ['spring', 'onPan']
      },
      {
        href: '/streaming',
        icon: 'play',
        label: 'Streaming',
        title: 'Streaming — Edge at CDN',
        description:
          'Streams progressively from edge — yield skeleton then each card. Keyed cache at CDN.',
        value: '08',
        tags: ['streaming']
      },
      {
        href: '/table',
        icon: 'mechanics',
        label: 'Table',
        title: 'Tanstack Table + Nuqs + shadcn filters',
        description: 'Data table with Tanstack Table and Nuqs filters.',
        value: '09',
        tags: ['table']
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
      {
        href: 'https://tsrx.dev',
        icon: 'mechanics',
        label: 'tsrx',
        title: '',
        description: '',
        value: '↗',
        tags: ['']
      }
    ]
  }
]
