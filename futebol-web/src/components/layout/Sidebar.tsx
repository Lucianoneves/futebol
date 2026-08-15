"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
} from "@/components/ui/Drawer";

const links = [
  { href: "/players", label: "Jogadores" },
  { href: "/payments", label: "Pagamentos" },
  { href: "/expenses", label: "Despesas" },
  { href: "/fees", label: "Taxas" },
  { href: "/reports", label: "Relatórios" },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="sidebar sidebar-static">
        <SidebarInner onNavigate={undefined} />
      </aside>

      <Drawer isOpen={isOpen} onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <SidebarInner onNavigate={onClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      <DrawerHeader>
        <p className="brand">FERRO VELHO</p>
        <p className="brand-sub">Gestão do time</p>
      </DrawerHeader>

      <DrawerBody>
        {links.map((link) => {
          const active = (pathname ?? "").startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${active ? "active" : ""}`}
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          );
        })}
      </DrawerBody>

      <DrawerFooter>
        <p className="user-name">{user?.name}</p>
        <p className="user-role">{isAdmin ? "Administrador" : "Usuário"}</p>
        <button type="button" className="btn-ghost" onClick={logout}>
          Sair
        </button>
      </DrawerFooter>
    </>
  );
}
