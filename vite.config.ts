import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // dentro do container o padrão (localhost) só aceita conexão de dentro dele;
  // host: true escuta em todas as interfaces pra porta encaminhada funcionar
  server: { host: true },
})
