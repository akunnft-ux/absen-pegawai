"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  Shield,
  Settings,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/useAuth"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pegawai", href: "/employees", icon: Users, adminOnly: true },
  { label: "Kegiatan", href: "/activities", icon: CalendarCheck, adminOnly: true },
  { label: "Jadwal", href: "/schedules", icon: CalendarDays },
  { label: "Absensi", href: "/attendance", icon: ClipboardCheck },
  { label: "Rekapitulasi", href: "/reports", icon: BarChart3 },
  { label: "Users", href: "/users", icon: Shield, adminOnly: true },
  { label: "Settings", href: "/settings", icon: Settings },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const role = profile?.role ?? "petugas"

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || role === "grand_admin"
  )

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {filteredItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span>AbsenKu</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <SidebarNav onNavigate={onClose} />
        </ScrollArea>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
