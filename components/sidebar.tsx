"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { label: "Dashboard", icon: "📊", href: "/" },
    { label: "Contratos", icon: "📄", href: "/contratos" },
    { label: "Cadastrar Docs", icon: "📋", href: "/cadastrar" },
    { label: "Agenda de Prazos", icon: "📅", href: "/agenda" },
    { label: "Painel de Riscos", icon: "⚠️", href: "/riscos" },
  ]

  return (
    <aside className="w-48 bg-primary text-primary-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
            <span className="text-primary font-bold">✓</span>
          </div>
          <div>
            <div className="font-bold text-sm">contract</div>
            <div className="font-bold text-sm">flow</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-primary-foreground/20 font-semibold" : "hover:bg-primary-foreground/10"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
