/* O token de login mora no localStorage: sobrevive a recarregar a página e a fechar a aba. */

// a chave existe uma vez só — a store grava e o axios lê, e ler de uma gaveta diferente
// da que foi gravada daria 401 logo depois de um login que pareceu dar certo
const CHAVE = "daetec_token"

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE)
}

export function guardarToken(token: string): void {
  localStorage.setItem(CHAVE, token)
}

export function esquecerToken(): void {
  localStorage.removeItem(CHAVE)
}
