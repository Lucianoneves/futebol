import type { Metadata } from "next";
import { monthName } from "@/lib/format";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ year: string; month: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}): Promise<Metadata> {
  const { year, month } = await params;
  const monthNumber = Number(month);
  const label = Number.isInteger(monthNumber)
    ? `${monthName(monthNumber)}/${year}`
    : `${month}/${year}`;

  return {
    title: `Relatório ${label}`,
    description: "Consulta: quem pagou e quem deve no mês. Somente o administrador altera o sistema.",
    robots: { index: false, follow: false },
  };
}

export default function PublicReportLayout({ children }: LayoutProps) {
  return children;
}
