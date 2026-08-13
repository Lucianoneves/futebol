import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year");
  const month = request.nextUrl.searchParams.get("month");
  const token = request.nextUrl.searchParams.get("token") || "";

  const response = await fetch(
    `${API_URL}/public/reports/monthly?year=${year}&month=${month}&token=${encodeURIComponent(token)}`
  );
  const data = await response.json().catch(() => ({}));

  return NextResponse.json(data, { status: response.status });
}

function consultOnly() {
  return NextResponse.json(
    { error: "Este relatório é somente consulta. Só o administrador altera o sistema." },
    { status: 405 }
  );
}

export const POST = consultOnly;
export const PUT = consultOnly;
export const PATCH = consultOnly;
export const DELETE = consultOnly;
