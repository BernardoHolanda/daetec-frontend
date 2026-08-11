# daetec-frontend

[![CI](https://github.com/BernardoHolanda/daetec-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/BernardoHolanda/daetec-frontend/actions/workflows/ci.yml)

Frontend do **DAETEC** — interface web do sistema de registro de vendas do
diretório acadêmico. Consome a API [`daetec-api`](https://github.com/BernardoHolanda/daetec-api).

**Stack:** Vue 3 (Composition API) · TypeScript · Vite · Vue Router · Pinia ·
Tailwind CSS v4 · axios · vee-validate.

**Em produção:** [daetec.pages.dev](https://daetec.pages.dev) (Cloudflare Pages),
consumindo a API no Google Cloud Run.

---

## Como rodar

**Com Dev Container** (recomendado — ambiente idêntico ao de todo mundo):

1. Abra esta pasta no VS Code (requer **Docker** e a extensão **Dev Containers**).
2. `Ctrl+Shift+P` → **Dev Containers: Reopen in Container**. O `postCreateCommand`
   roda `npm install` sozinho.
3. `npm run dev` e acesse **http://localhost:5173**.

**Sem Dev Container**, com **Node 22** instalado na máquina:

```bash
npm ci        # instala exatamente a lockfile
npm run dev
```

> Para o login e as chamadas funcionarem, o backend (`daetec-api`) precisa estar rodando
> em `http://localhost:8000` — o `CORS_ORIGINS` dele libera `localhost:5173`.

## Variáveis de ambiente

| Arquivo | Quando é usado | Conteúdo |
|---|---|---|
| `.env` | `npm run dev` | `VITE_API_BASE_URL=http://localhost:8000` |
| `.env.production` | `npm run build` | a URL da API no Cloud Run |

O Vite carrega o `.env` e **sobrepõe** com o `.env.production` quando o modo é produção —
que é o que o `build` faz. Assim o desenvolvimento continua apontando pro localhost sem
ninguém precisar lembrar de trocar nada antes de publicar.

**Os dois arquivos estão no git de propósito.** Toda variável com prefixo `VITE_` é
**embutida no bundle** durante o build e fica legível por qualquer pessoa que abrir o
DevTools. Não existe segredo do lado do navegador: se um valor não pode ser público, ele
não pode estar aqui — tem que ficar no backend. O que estas variáveis guardam é apenas o
endereço da API, que já é público por definição.

## Funcionalidades

**Login e sessão** — formulário validado com vee-validate, `POST /login`, JWT guardado
no Pinia (persistido no `localStorage`) e anexado a toda requisição por um interceptor
do axios. Guarda de rota assíncrona carrega o `/usuarios/me` antes de decidir o destino.

**Papéis** — o **admin** faz tudo; o **comum** vende, consulta e cadastra cliente.
Esconder rota é conveniência: quem barra de verdade é o backend (403).

| Tela | Rota | Quem vê | O que faz |
|---|---|---|---|
| **Registrar venda** | `/vender` | todos | Grade de produtos com busca sem acento, carrinho, forma de pagamento e venda **na conta** (fiado). O carrinho é limitado pelo estoque e sobrevive à troca de tela. |
| **Contas em aberto** | `/contas` | todos | Devedores com busca e três ordenações. |
| **Detalhe da conta** | `/contas/:id` | todos | Histórico de consumo e **fechamento** da conta com recibo na tela. |
| **Relatório do dia** | `/relatorio` | admin | Totais, quebra por forma de pagamento e por vendedor, devedores, e as vendas do dia (com cancelamento). Seletor de dia próprio, com navegação dias → meses → anos. |
| **Produtos** | `/produtos` | admin | CRUD + definição do **estoque** (opcional). |
| **Clientes** | `/clientes` | todos | Cadastrar é de todos (fiar exige criar na hora); editar e remover, só admin. |
| **Vendedores** | `/vendedores` | admin | CRUD dos donos da mercadoria. |
| **Estoque** | `/estoque` | todos | Só leitura: *Sem controle* / *Esgotado* / *N unidades*. |

**Estoque** — `null` significa produto **não controlado** (vende à vontade) e `0`
significa **esgotado**. Vender dá baixa; cancelar devolve. Como o carrinho já trava no
que existe, não há tela de erro de estoque: o caminho pro erro não é clicável.

**Dinheiro** — sempre em **centavos, inteiro**, do parse à exibição (`utils/dinheiro.ts`).
Somar float quebra o caixa.

**Responsivo de verdade** — um só HTML que se transforma (cartão no celular, linha de
tabela no desktop), não duas versões com uma escondida.

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento (Vite + HMR) |
| `npm run build` | type-check (`vue-tsc`) + build de produção em `dist/` |
| `npm run preview` | serve o build de produção localmente |
| `npm run lint` | checa o código com ESLint (bugs/qualidade) |
| `npm run format` | formata tudo com Prettier |

## Qualidade de código

Duas ferramentas, cada uma no seu papel:

- **ESLint** (`npm run lint`) — o **fiscal**: caça problema de lógica (variável não
  usada, `v-for` sem key, etc.). Reporta; `npm run lint -- --fix` conserta o que dá.
- **Prettier** (`npm run format`) — o **formatador**: cuida só da aparência (aspas,
  espaços, largura de linha). Config em `.prettierrc.json`.

O `@vue/eslint-config-prettier` desliga as regras de estilo do ESLint, deixando aparência
100% com o Prettier. No Dev Container o **format-on-save** já vem ligado.

**No CI** (`.github/workflows/ci.yml`), a cada push: `npm ci`, ESLint, `prettier --check`
e `npm run build` (que inclui o type-check). O `--check` só reporta — no CI não há ninguém
para aceitar um `--write`.

## Build e deploy

O deploy é automático: **Cloudflare Pages** observa o repositório e publica a cada push na
branch principal.

| Configuração no painel | Valor |
|---|---|
| Comando de build | `npm run build` |
| Diretório de saída | `dist` |
| `NODE_VERSION` | `22` — a mesma do CI e do Dev Container |

Manter a versão do Node igual nos três lugares evita o clássico "passa no CI e falha no
deploy": o Cloudflare usa uma versão padrão própria se ninguém disser qual usar.

O build gera **~590 KB** em `dist/`, dos quais o navegador baixa por volta de 270 KB antes
da compressão do Cloudflare. As fontes usam `unicode-range`, então o navegador só busca o
subconjunto que a página realmente usa — os arquivos cirílico e grego ficam parados no
servidor sem custar nada a quem acessa.

**Rota profunda em site estático:** um SPA serve `index.html` para qualquer caminho, senão
abrir `daetec.pages.dev/contas` direto dá 404 — o servidor procura um arquivo que não
existe. O Cloudflare Pages já trata isso nativamente. Se um dia migrar para GitHub Pages,
será preciso copiar o `index.html` para `404.html` e ajustar o `base` no `vite.config.ts`,
porque lá a URL do projeto é `usuario.github.io/repo/`.

## Estrutura

```
src/
  main.ts            # ponto de entrada (registra Pinia + Router)
  App.vue            # raiz (<RouterView/>)
  router/
    index.ts         # rotas + guarda de autenticação
    navegacao.ts     # itens do menu como DADO (rótulo, ícone, papel)
  stores/            # auth (token), usuario (papel), carrinho (venda em andamento)
  services/          # uma função por endpoint; api.ts tem o interceptor do JWT
  views/             # telas com rota
  components/        # AppLayout + peças reaproveitadas (CampoBusca, ModalConfirmacao…)
  utils/             # dinheiro (centavos), data, texto (busca sem acento), erro
  types/api.ts       # o contrato do backend em TypeScript
  style.css          # @import do Tailwind + tokens do design em @theme
.env                 # VITE_API_BASE_URL do desenvolvimento
.env.production      # VITE_API_BASE_URL da produção
.github/workflows/   # ci.yml (lint, formatação, type-check, build)
.devcontainer/       # config do Dev Container (VS Code)
```
