"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/players", label: "Jogadores" },
  { href: "/payments", label: "Pagamentos" },
  { href: "/expenses", label: "Despesas" },
  { href: "/fees", label: "Taxas" },
  { href: "/reports", label: "Relatórios" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <p className="brand">FUTEBOL</p>
        <p className="brand-sub">Gestão do time</p>
      </div>

      <nav className="nav">
        {links.map((link) => {
          const active = (pathname ?? "").startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="user-name">{user?.name}</p>
        <p className="user-role">{isAdmin ? "Administrador" : "Usuário"}</p>
        <button type="button" className="btn-ghost" onClick={logout}>
          Sair
        </button>
      </div>
    </aside>
  );
}
