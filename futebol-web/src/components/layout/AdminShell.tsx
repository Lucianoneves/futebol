"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { useDisclosure } from "@/components/ui/useDisclosure";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { isOpen, onClose, onToggle } = useDisclosure();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    } else if (ready && user?.role === "PLAYER") {
      router.replace("/eu");
    }
  }, [ready, user, router]);

  if (!ready || !user || user.role === "PLAYER") {
    return (
      <div className="loading-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <button
          type="button"
          className="menu-toggle"
          onClick={onToggle}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? "Fechar" : "Menu"}
        </button>
        <p className="brand">FUTEBOL</p>
      </header>
      <Sidebar isOpen={isOpen} onClose={onClose} />
      <main className="admin-main fade-in">{children}</main>
    </div>
  );
}
