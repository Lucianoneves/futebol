"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const links = [
  { href: "/eu", label: "Eu" },
  { href: "/eu/despesas", label: "Despesas" },
  { href: "/eu/peladas", label: "Peladas" },
];

export function PlayerShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    } else if (ready && user && user.role !== "PLAYER") {
      router.replace("/players");
    }
  }, [ready, user, router]);

  if (!ready || !user || user.role !== "PLAYER") {
    return (
      <div className="loading-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="player-shell">
      <header className="player-top">
        <div>
          <p className="brand">FUTEBOL</p>
          <p className="player-top-name">{user.name}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          Sair
        </button>
      </header>
      <main className="player-main fade-in">{children}</main>
      <nav className="player-nav">
        {links.map((link) => {
          const active =
            link.href === "/eu"
              ? pathname === "/eu"
              : (pathname ?? "").startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`player-nav-link ${active ? "active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
