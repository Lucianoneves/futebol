export function nextCompetence(year: number, month: number, extra = 1) {
  const date = new Date(year, month - 1 + extra, 1);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function competenceLabel(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}
