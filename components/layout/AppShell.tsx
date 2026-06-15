"use client"

import { useState, useCallback } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export function AppShell({ children, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      <div className="flex flex-1 flex-col">
        <Header onMenuClick={handleMenuClick} title={title} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
