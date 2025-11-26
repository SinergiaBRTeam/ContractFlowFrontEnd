"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const riskPanelEnabled = process.env.NEXT_PUBLIC_ENABLE_RISKS !== "false"

  const menuItems = [
    { label: "Dashboard", href: "/" },
    { label: "Contratos", href: "/contratos" },
    { label: "Cadastrar Documentos", href: "/cadastrar" },
    { label: "Agenda de Prazos", href: "/agenda" },
    ...(riskPanelEnabled ? [{ label: "Painel de Riscos", href: "/riscos" }] : []),
  ]

  return (
    <aside className="w-56 bg-primary text-primary-foreground flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-primary/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-foreground/10 rounded-lg flex items-center justify-center border border-primary-foreground/15">
            <span className="text-base font-semibold text-primary-foreground">CF</span>
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm tracking-wide uppercase">Contract</div>
            <div className="font-semibold text-sm tracking-wide uppercase">Flow</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border border-transparent ${
                    isActive
                      ? "bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground"
                      : "hover:bg-primary-foreground/10 text-primary-foreground/80"
                  }`}
                >
                  <span className="text-sm font-medium tracking-wide">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
