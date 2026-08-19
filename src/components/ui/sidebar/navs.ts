import type { IconName } from '@/lib/icons/types'

export type NavItem = {
  href: string
  icon: IconName
  label: string
  title: string
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
      { href: '/', icon: 'overview', label: 'Overview', title: '', value: '0' },
      { href: '/canvas', icon: 'canvas', label: 'Canvas', title: '01 — Real-Time Collaborative Canvas', value: '01' },
      { href: '/form', icon: 'forms', label: 'Form', title: '', value: '02' },
      { href: '/grid', icon: 'grid', label: 'Grid', title: '', value: '03' },
      { href: '/shell', icon: 'new-folder', label: 'Shell', title: '', value: '04' },
      { href: '/timeline', icon: 'timeline', label: 'Timeline', title: '', value: '05' },
      { href: '/worker', icon: 'folder', label: 'Worker', title: '', value: '06' },
      { href: '/motion', icon: 'mechanics', label: 'Motion', title: '', value: '07' },
      { href: '/streaming', icon: 'play', label: 'Streaming', title: '', value: '08' },
      { href: '/tgpu', icon: 'mechanics', label: 'TypeGPU', title: '', value: '09' }
    ]
  },
  {
    title: 'Resources',
    items: [
      { href: 'https://beast-docs.vercel.app', icon: 'mechanics', label: 'beast-tsrx', title: '', value: '↗' },
      { href: 'https://octanejs.dev', icon: 'mechanics', label: 'octane', title: '', value: '↗' },
      { href: 'https://tsrx.dev', icon: 'mechanics', label: 'tsrx', title: '', value: '↗' }
    ]
  }
]
