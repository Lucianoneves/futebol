"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

type DrawerContextValue = {
  isOpen: boolean;
  onClose: () => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("Drawer precisa estar dentro de <Drawer>");
  }
  return context;
}

export function Drawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <DrawerContext.Provider value={{ isOpen, onClose }}>
      <div className="drawer drawer-left">{children}</div>
    </DrawerContext.Provider>
  );
}

export function DrawerOverlay() {
  const { onClose } = useDrawerContext();
  return <div className="drawer-overlay" onClick={onClose} />;
}

export function DrawerContent({ children }: { children: ReactNode }) {
  return <aside className="sidebar drawer-content">{children}</aside>;
}

export function DrawerCloseButton() {
  const { onClose } = useDrawerContext();
  return (
    <button
      type="button"
      className="drawer-close"
      onClick={onClose}
      aria-label="Fechar menu"
    >
      ×
    </button>
  );
}

export function DrawerHeader({ children }: { children: ReactNode }) {
  return <div className="brand-block">{children}</div>;
}

export function DrawerBody({ children }: { children: ReactNode }) {
  return <nav className="nav">{children}</nav>;
}

export function DrawerFooter({ children }: { children: ReactNode }) {
  return <div className="sidebar-footer">{children}</div>;
}
