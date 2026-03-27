"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/profile_ai_chat", label: "プロフィールAI" },
  { href: "/matching_ai_chat", label: "マッチングAI" },
  { href: "/setting", label: "設定" },
  { href: "/dm", label: "DM" },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-4 border-b px-6 py-3">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm font-medium transition-colors hover:text-foreground ${
            pathname === href ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
