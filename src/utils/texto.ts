/**
 * Prepara texto para busca: sem acento, sem caixa.
 * `"Água 500 ml"` → `"agua 500 ml"`, então digitar "agua" acha.
 *
 * `normalize("NFD")` separa a letra do acento (`á` → `a` + `´`);
 * o replace joga fora os acentos soltos.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}
