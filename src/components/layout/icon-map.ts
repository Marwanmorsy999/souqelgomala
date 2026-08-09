import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  Tag,
  Truck,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'

/**
 * Maps sidebar config icon names (strings) to lucide components.
 * Add new icons here when registering a new sidebar module — never
 * import icon components into the config (keeps it data-only).
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  ClipboardList,
  Package,
  FolderTree,
  Tag,
  Users,
  Truck,
  UserRound,
  MapPin,
  Building2,
  UserCog,
  BarChart3,
  Settings,
}

export function getNavIcon(name: string): LucideIcon {
  return NAV_ICONS[name] ?? LayoutDashboard
}

