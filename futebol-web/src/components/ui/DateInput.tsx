"use client";

import { useEffect, useState } from "react";
import { formatDateBr, maskBrDate, parseBrDate } from "@/lib/format";

type DateInputProps = {
  value: string;
  onChange: (isoDay: string) => void;
  required?: boolean;
  id?: string;
};

export function DateInput({ value, onChange, required, id }: DateInputProps) {
  const [text, setText] = useState(() => (value ? formatDateBr(value) : ""));

  useEffect(() => {
    setText(value ? formatDateBr(value) : "");
  }, [value]);

  function commitText(next: string) {
    const masked = maskBrDate(next);
    setText(masked);
    const iso = parseBrDate(masked);
    if (iso) onChange(iso);
  }

  function handleBlur() {
    const iso = parseBrDate(text);
    if (iso) {
      onChange(iso);
      setText(formatDateBr(iso));
      return;
    }
    setText(value ? formatDateBr(value) : "");
  }

  return (
    <div className="date-input">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={text}
        required={required}
        onChange={(event) => commitText(event.target.value)}
        onBlur={handleBlur}
      />
      <span className="date-input-calendar" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M3 10h18M8 3v4M16 3v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input
        className="date-input-picker"
        type="date"
        lang="pt-BR"
        tabIndex={-1}
        aria-label="Abrir calendário"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
