"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="loading-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main fade-in">{children}</main>
    </div>
  );
}
