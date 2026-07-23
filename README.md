# daetec-frontend

Frontend do **DAETEC** — interface web do sistema de registro de vendas do
diretório acadêmico. Consome a API [`daetec-api`](https://github.com/BernardoHolanda/daetec-api).

**Stack:** Vue 3 (Composition API) · TypeScript · Vite.
_A adicionar nas próximas etapas: Vue Router, Pinia, Tailwind CSS, axios, vee-validate._

---

## Como rodar

Requer **Docker** + **VS Code** com a extensão **Dev Containers**.

1. Abra esta pasta no VS Code.
2. `Ctrl+Shift+P` → **Dev Containers: Reopen in Container** (constrói o container Node).
3. Dentro do container:
   ```bash
   npm install
   npm run dev -- --host 0.0.0.0
   ```
4. Acesse **http://localhost:5173**.

> Para o login e as chamadas de API funcionarem, o backend (`daetec-api`) precisa
> estar rodando em `http://localhost:8000` — o CORS do backend libera `localhost:5173`.

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento (Vite + HMR) |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o build de produção localmente |

## Estrutura

```
src/
  main.ts          # ponto de entrada (cria e monta o app Vue)
  App.vue          # componente raiz
  components/      # componentes reutilizáveis
  assets/          # imagens e estilos
.devcontainer/     # config do Dev Container (VS Code)
Dockerfile         # imagem Node do ambiente de dev
docker-compose.yml # orquestração do container
```
