/** Tira acento e caixa pra comparar busca: `"Água"` e `"agua"` viram a mesma coisa. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}
