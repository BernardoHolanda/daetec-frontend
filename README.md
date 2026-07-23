# daetec-frontend

Frontend do **DAETEC** — interface web do sistema de registro de vendas do
diretório acadêmico. Consome a API [`daetec-api`](https://github.com/BernardoHolanda/daetec-api).

**Stack:** Vue 3 (Composition API) · TypeScript · Vite · Vue Router · Pinia ·
Tailwind CSS · axios · vee-validate.

---

## Como rodar

Requer **Docker** + **VS Code** com a extensão **Dev Containers**.

1. Abra esta pasta no VS Code.
2. `Ctrl+Shift+P` → **Dev Containers: Reopen in Container** (constrói o container
   Node; o `postCreateCommand` já roda `npm install` sozinho).
3. Dentro do container:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
4. Acesse **http://localhost:5173**.

> Para o login e as chamadas de API funcionarem, o backend (`daetec-api`) precisa
> estar rodando em `http://localhost:8000` — o CORS do backend libera `localhost:5173`.
> A URL da API fica em `.env` (`VITE_API_BASE_URL`).

## Funcionalidades

- **Login** (`/login`) — valida o formulário com vee-validate, autentica no
  `POST /login` do backend, guarda o **JWT** no Pinia (persistido no `localStorage`)
  e redireciona pra `/home`.
- **Rota protegida** (`/home`) — uma guarda de navegação manda pro login quem não
  está autenticado (e tira da tela de login quem já está).

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento (Vite + HMR) |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o build de produção localmente |

## Estrutura

```
src/
  main.ts            # ponto de entrada (registra Pinia + Router)
  App.vue            # raiz (<RouterView/>)
  router/index.ts    # rotas + guarda de autenticação
  stores/auth.ts     # estado de auth (token, isAuthenticated, login/logout)
  services/api.ts    # instância axios + interceptor que anexa o JWT
  views/             # telas com rota (LoginView, HomeView)
  style.css          # @import do Tailwind
.env                 # VITE_API_BASE_URL (URL do backend)
.devcontainer/       # config do Dev Container (VS Code)
Dockerfile           # imagem Node do ambiente de dev
docker-compose.yml   # orquestração do container
```
