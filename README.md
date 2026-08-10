# daetec-frontend

Frontend do **DAETEC** — interface web do sistema de registro de vendas do
diretório acadêmico. Consome a API [`daetec-api`](https://github.com/BernardoHolanda/daetec-api).

**Stack:** Vue 3 (Composition API) · TypeScript · Vite · Vue Router · Pinia ·
Tailwind CSS v4 · axios · vee-validate.

---

## Como rodar

Requer **Docker** + **VS Code** com a extensão **Dev Containers**.

1. Abra esta pasta no VS Code.
2. `Ctrl+Shift+P` → **Dev Containers: Reopen in Container** (constrói o container
   Node; o `postCreateCommand` já roda `npm install` sozinho).
3. Dentro do container:
   ```bash
   npm run dev
   ```
4. Acesse **http://localhost:5173**.

> Para o login e as chamadas de API funcionarem, o backend (`daetec-api`) precisa
> estar rodando em `http://localhost:8000` — o CORS do backend libera `localhost:5173`.
> A URL da API fica em `.env` (`VITE_API_BASE_URL`).

## Funcionalidades

**Login e sessão** — formulário validado com vee-validate, `POST /login`, JWT guardado
no Pinia (persistido no `localStorage`) e anexado a toda requisição por um interceptor
do axios. Guarda de rota assíncrona carrega o `/usuarios/me` antes de decidir o destino.

**Papéis** — o **admin** faz tudo; o **comum** vende, consulta e cadastra cliente.
Esconder rota é conveniência: quem barra de verdade é o backend (403).

| Tela                 | Rota          | Quem vê | O que faz                                                                                                                                                                     |
| -------------------- | ------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Registrar venda**  | `/vender`     | todos   | Grade de produtos com busca sem acento, carrinho, forma de pagamento e venda **na conta** (fiado). O carrinho é limitado pelo estoque disponível e sobrevive à troca de tela. |
| **Contas em aberto** | `/contas`     | todos   | Devedores com busca e três ordenações.                                                                                                                                        |
| **Detalhe da conta** | `/contas/:id` | todos   | Histórico de consumo e **fechamento** da conta com recibo na tela.                                                                                                            |
| **Relatório do dia** | `/relatorio`  | admin   | Totais, quebra por forma de pagamento e por vendedor, devedores, e as vendas do dia (com cancelamento). Seletor de dia próprio, com navegação dias → meses → anos.            |
| **Produtos**         | `/produtos`   | admin   | CRUD + definição do **estoque** (opcional).                                                                                                                                   |
| **Clientes**         | `/clientes`   | todos   | Cadastrar é de todos (fiar exige criar na hora); editar e remover, só admin.                                                                                                  |
| **Vendedores**       | `/vendedores` | admin   | CRUD dos donos da mercadoria.                                                                                                                                                 |
| **Estoque**          | `/estoque`    | todos   | Só leitura: _Sem controle_ / _Esgotado_ / _N unidades_.                                                                                                                       |

**Estoque** — `null` significa produto **não controlado** (vende à vontade) e `0`
significa **esgotado**. Vender dá baixa; cancelar devolve. Como o carrinho já trava no
que existe, não há tela de erro de estoque: o caminho pro erro não é clicável.

**Dinheiro** — sempre em **centavos, inteiro**, do parse à exibição (`utils/dinheiro.ts`).
Somar float quebra o caixa.

**Responsivo de verdade** — um só HTML que se transforma (cartão no celular, linha de
tabela no desktop), não duas versões com uma escondida.

## Scripts

| Comando           | O quê                                      |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | servidor de desenvolvimento (Vite + HMR)   |
| `npm run build`   | build de produção em `dist/`               |
| `npm run preview` | serve o build de produção localmente       |
| `npm run lint`    | checa o código com ESLint (bugs/qualidade) |
| `npm run format`  | formata tudo com Prettier                  |

## Qualidade de código

Duas ferramentas, cada uma no seu papel:

- **ESLint** (`npm run lint`) — o **fiscal**: caça problema de lógica (variável não
  usada, `v-for` sem key, etc.). Reporta; `npm run lint -- --fix` conserta o que dá.
- **Prettier** (`npm run format`) — o **formatador**: cuida só da aparência (aspas,
  espaços, largura de linha). Config em `.prettierrc.json`.

O `@vue/eslint-config-prettier` desliga as regras de estilo do ESLint,
deixando aparência 100% com o Prettier. No Dev Container o **format-on-save** já vem
ligado (extensão do Prettier + settings no `devcontainer.json`).

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
.env                 # VITE_API_BASE_URL (vai no bundle — nunca ponha segredo aqui)
.devcontainer/       # config do Dev Container (VS Code)
```
