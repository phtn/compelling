import type { IconName } from '@/lib/icons/types'

export type NavItem = {
  href: string
  icon: IconName
  label: string
  value: string | number
}

export type NavGroup = {
  title: string
  items: NavItem[]
}
export const navGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      { href: '/', icon: 'overview', label: 'Overview', value: '0' },
      { href: '/canvas', icon: 'users', label: 'Canvas', value: '01' },
      { href: '/form', icon: 'eraser', label: 'Form', value: '02' },
      { href: '/grid', icon: 'undo', label: 'Grid', value: '03' },
      { href: '/shell', icon: 'new-folder', label: 'Shell', value: '04' },
      { href: '/timeline', icon: 'folder', label: 'Timeline', value: '05' },
      { href: '/worker', icon: 'folder', label: 'Worker', value: '06' },
      { href: '/motion', icon: 'mechanics', label: 'Motion', value: '07' },
      { href: '/streaming', icon: 'clock', label: 'Streaming', value: '08' }
    ]
  },
  {
    title: 'Resources',
    items: [
      { href: 'https://beast-docs.vercel.app', icon: 'mechanics', label: 'beast-tsrx', value: '↗' },
      { href: 'https://octanejs.dev', icon: 'mechanics', label: 'octane', value: '↗' },
      { href: 'https://tsrx.dev', icon: 'mechanics', label: 'tsrx', value: '↗' }
    ]
  }
]
