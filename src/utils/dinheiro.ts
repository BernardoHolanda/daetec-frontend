/**
 * Dinheiro é tratado em CENTAVOS (número inteiro) do começo ao fim.
 *
 * Motivo: float binário não representa 0,10 exatamente — `0.1 + 0.2` dá
 * 0.30000000000000004. Num app de caixa esse erro se acumula e o total do dia
 * fecha errado. Por isso o backend manda `Decimal` como string ("6.00"): pra
 * você converter, e não pra usar direto numa conta.
 */

/** `"6.00"` (como o backend manda) → `600` */
export function paraCentavos(valor: string): number {
  return Math.round(Number(valor) * 100)
}

/** `1650` → `"R$ 16,50"` */
export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
