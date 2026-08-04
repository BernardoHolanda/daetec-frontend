/* O backend manda UTC ("...Z"); o navegador converte pro fuso de quem está olhando. */

/** `"2026-08-02T18:12:00Z"` → `"02/08"` */
export function formatarDia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

/** `"2026-08-02T18:12:00Z"` → `"02/08 · 14:12"` */
export function formatarDiaHora(iso: string): string {
  const hora = new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return `${formatarDia(iso)} · ${hora}`
}
