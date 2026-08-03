/** Espelha os schemas do backend (`app/schemas/`). */

export type Papel = "admin" | "comum"

export interface Usuario {
  id: number
  username: string
  email: string
  papel: Papel
}
