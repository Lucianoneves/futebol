import { PlayerShell } from "@/components/layout/PlayerShell";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlayerShell>{children}</PlayerShell>;
}
