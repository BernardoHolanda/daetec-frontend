/* O backend manda UTC ("...Z"); o navegador converte pro fuso de quem está olhando. */

/** `"2026-08-02T18:12:00Z"` → `"02/08"` */
export function formatarDia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

/**
 * `"2026-08-10"` → `"10/08/2026"`.
 * Sem `new Date`: data pura é lida como meia-noite UTC, que em Manaus ainda é o dia anterior.
 */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-")
  return `${dia}/${mes}/${ano}`
}

/** `"2026-08-02T18:12:00Z"` → `"14:12"` */
export function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

/** `"2026-08-02T18:12:00Z"` → `"02/08 · 14:12"` */
export function formatarDiaHora(iso: string): string {
  return `${formatarDia(iso)} · ${formatarHora(iso)}`
}

/** `"2026-08-02T18:12:00Z"` → `"02/08/2026 - 14:12"` */
export function formatarDataHora(iso: string): string {
  return `${new Date(iso).toLocaleDateString("pt-BR")} - ${formatarHora(iso)}`
}
