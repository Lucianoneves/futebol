export type WhatsAppPlayerType = "MONTHLY" | "CASUAL";

export type ParsedWhatsAppPlayer = {
  name: string;
  type: WhatsAppPlayerType;
  amount: number | null;
  paid: boolean;
  notes: string | null;
  raw: string;
};

export function normalizePlayerName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanName(name: string) {
  return name.replace(/[.\s]+$/g, "").replace(/\s+/g, " ").trim();
}

function isGuestSection(line: string) {
  return /convidad|por jogo|avuls|casual/i.test(line);
}

function isMonthlySection(line: string) {
  return /mensalist|mensal(?!idade)/i.test(line);
}

function isSectionHeader(line: string) {
  return (
    isGuestSection(line) ||
    isMonthlySection(line) ||
    /^(lista|ferro velho|relacao|relação|pagamento)/i.test(line)
  );
}

function parsePlayerLine(
  line: string,
  type: WhatsAppPlayerType
): ParsedWhatsAppPlayer | null {
  const paid = /[✅✔✓]/.test(line);
  let work = line
    .replace(/[✅✔✓]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  work = work.replace(/^\d+[\.)]\s+/, "").replace(/^\d+\s+/, "");

  if (!work || isSectionHeader(work.toLowerCase())) {
    return null;
  }

  const withAmount = work.match(
    /^(.*?)\s+(\d+(?:[.,]\d+)?)(?:\s+(.+))?$/
  );

  if (withAmount) {
    const amount = Number(withAmount[2].replace(",", "."));
    const name = cleanName(withAmount[1]);
    const notes = withAmount[3]?.trim() || null;

    if (name && amount >= 5 && amount <= 500) {
      return {
        name,
        type,
        amount,
        paid: true,
        notes,
        raw: line,
      };
    }
  }

  const name = cleanName(work);
  if (!name || /^\d+$/.test(name)) {
    return null;
  }

  return {
    name,
    type,
    amount: null,
    paid,
    notes: null,
    raw: line,
  };
}

export function parseWhatsAppPlayerList(text: string): ParsedWhatsAppPlayer[] {
  let currentType: WhatsAppPlayerType = "MONTHLY";
  const rows: ParsedWhatsAppPlayer[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    if (isSectionHeader(lower)) {
      if (isGuestSection(lower)) currentType = "CASUAL";
      if (isMonthlySection(lower)) currentType = "MONTHLY";
      continue;
    }

    const parsed = parsePlayerLine(line, currentType);
    if (!parsed) continue;

    const key = normalizePlayerName(parsed.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rows.push(parsed);
  }

  return rows;
}
