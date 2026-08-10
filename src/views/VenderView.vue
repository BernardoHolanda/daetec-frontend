<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { listarProdutos } from "../services/produtos"
import { registrarVenda } from "../services/vendas"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { normalizar } from "../utils/texto"
import { ehFormaAVista } from "../utils/pagamento"
import type { Cliente, OpcaoPagamento, Produto, VendaCreate } from "../types/api"
import type { ItemCarrinho } from "../types/carrinho"
import CampoBusca from "../components/CampoBusca.vue"
import ErroAoCarregar from "../components/ErroAoCarregar.vue"
import EstadoVazio from "../components/EstadoVazio.vue"
import PainelCarrinho from "../components/PainelCarrinho.vue"
import SeletorPagamento from "../components/SeletorPagamento.vue"
import SeletorCliente from "../components/SeletorCliente.vue"
import ModalConfirmacao from "../components/ModalConfirmacao.vue"
import IconeNav from "../components/IconeNav.vue"

const ROTULO_PAGAMENTO: Record<OpcaoPagamento, string> = {
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
  dinheiro: "Dinheiro",
  conta: "Conta",
}

const produtos = ref<Produto[]>([])
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")

const carrinho = ref(new Map<number, number>())

const hoje = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
})

const produtosFiltrados = computed(() => {
  const termo = normalizar(busca.value.trim())
  if (!termo) return produtos.value
  return produtos.value.filter((p) => normalizar(p.nome).includes(termo))
})

const itens = computed<ItemCarrinho[]>(() =>
  [...carrinho.value.entries()].flatMap(([produtoId, quantidade]) => {
    const produto = produtos.value.find((p) => p.id === produtoId)
    if (!produto) return []
    const unitario = paraCentavos(produto.preco)
    return [{ produto, quantidade, unitario, subtotal: unitario * quantidade }]
  }),
)

const total = computed(() => itens.value.reduce((soma, item) => soma + item.subtotal, 0))

const forma = ref<OpcaoPagamento | null>(null)
const modalAberto = ref(false)
const enviando = ref(false)
const erroEnvio = ref("")
const sucesso = ref<{ total: string; forma: string } | null>(null)

const SEGUNDOS_DO_AVISO = 5
let timerSucesso: ReturnType<typeof setTimeout> | undefined

function mostrarSucesso(venda: { total: string; forma: string }) {
  clearTimeout(timerSucesso)
  sucesso.value = venda
  timerSucesso = setTimeout(() => (sucesso.value = null), SEGUNDOS_DO_AVISO * 1000)
}

const cliente = ref<Cliente | null>(null)

const naConta = computed(() => forma.value === "conta")

const primeiroNome = computed(() => cliente.value?.nome.split(" ")[0] ?? "")

const podeRegistrar = computed(() => {
  if (itens.value.length === 0 || forma.value === null) return false
  return naConta.value ? cliente.value !== null : true
})

const rotuloBotao = computed(() =>
  naConta.value && cliente.value
    ? `Registrar na conta de ${primeiroNome.value}`
    : "Registrar venda",
)

const resumoPagamento = computed(() => {
  if (naConta.value) return `Conta de ${primeiroNome.value} · não entra como recebido`
  return forma.value ? `${ROTULO_PAGAMENTO[forma.value]} · entra como recebido` : ""
})

function noCarrinho(produtoId: number): number {
  return carrinho.value.get(produtoId) ?? 0
}

/** Estoque `null` é produto não controlado; com número, o carrinho não passa do que existe. */
function podeAdicionar(produto: Produto): boolean {
  return produto.estoque === null || noCarrinho(produto.id) < produto.estoque
}

/** Quanto ainda cabe no carrinho — o que sobra na prateleira menos o que já está nele. */
function restante(produto: Produto): number {
  return produto.estoque === null ? Infinity : produto.estoque - noCarrinho(produto.id)
}

function adicionar(produto: Produto) {
  if (!podeAdicionar(produto)) return
  sucesso.value = null
  carrinho.value.set(produto.id, (carrinho.value.get(produto.id) ?? 0) + 1)
}

function aoTeclar(evento: KeyboardEvent) {
  if (modalAberto.value) return

  if (evento.key === "Enter" && podeRegistrar.value) {
    modalAberto.value = true
    return
  }

  const digitando = (evento.target as HTMLElement | null)?.tagName === "INPUT"
  if (evento.key === "Escape" && !digitando && itens.value.length > 0) {
    limpar()
  }
}

onMounted(() => window.addEventListener("keydown", aoTeclar))
onBeforeUnmount(() => {
  window.removeEventListener("keydown", aoTeclar)
  clearTimeout(timerSucesso)
})

async function confirmar() {
  if (!podeRegistrar.value) return
  enviando.value = true
  erroEnvio.value = ""
  const dados: VendaCreate = {
    itens: itens.value.map((item) => ({
      produto_id: item.produto.id,
      quantidade: item.quantidade,
    })),
  }
  // na conta o backend infere: sem forma_pagamento e com cliente, a venda nasce em aberto
  if (naConta.value && cliente.value) dados.cliente_id = cliente.value.id
  else if (forma.value && ehFormaAVista(forma.value)) dados.forma_pagamento = forma.value

  const resumo =
    naConta.value || !forma.value ? `Conta de ${primeiroNome.value}` : ROTULO_PAGAMENTO[forma.value]

  try {
    await registrarVenda(dados)
    mostrarSucesso({ total: formatarBRL(total.value), forma: resumo })
    limpar()
    modalAberto.value = false
    // a grade precisa refletir a baixa da venda que acabou de sair
    await carregar(true)
  } catch {
    erroEnvio.value = "Não foi possível registrar a venda. Tente de novo."
  } finally {
    enviando.value = false
  }
}

function alterar(produtoId: number, delta: number) {
  const produto = produtos.value.find((p) => p.id === produtoId)
  // o "+" do painel é outra porta pro mesmo carrinho: a trava vale aqui também
  if (delta > 0 && produto && !podeAdicionar(produto)) return

  const nova = (carrinho.value.get(produtoId) ?? 0) + delta
  if (nova <= 0) carrinho.value.delete(produtoId)
  else carrinho.value.set(produtoId, nova)
}

function limpar() {
  carrinho.value.clear()
}

watch(
  () => itens.value.length,
  (quantos) => {
    if (quantos === 0) forma.value = null
  },
)

watch(forma, (escolhida) => {
  if (escolhida !== "conta") cliente.value = null
})

async function carregar(silencioso = false) {
  // silencioso: recarga pós-venda não troca a grade por esqueleto nem some com o aviso
  if (!silencioso) carregando.value = true
  erro.value = false
  try {
    produtos.value = await listarProdutos()
  } catch {
    // a venda já foi gravada; não vale trocar a tela por um erro que não é dela
    if (!silencioso) erro.value = true
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <div class="flex flex-1 flex-col lg:flex-row">
    <main class="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div>
          <h1 class="text-[22px] font-semibold tracking-tight">Registrar venda</h1>
          <p class="text-tinta-suave mt-1 text-sm first-letter:uppercase">{{ hoje }}</p>
        </div>

        <CampoBusca v-model="busca" rotulo="Buscar produto" class="lg:w-105" />
      </div>

      <ul
        v-if="carregando"
        aria-hidden="true"
        class="grid grid-cols-2 gap-2.5 lg:gap-3 xl:grid-cols-3 2xl:grid-cols-4"
      >
        <li
          v-for="n in 8"
          :key="n"
          class="border-linha flex min-h-22 animate-pulse flex-col justify-between rounded-xl border bg-white p-3 lg:min-h-24 lg:p-3.5"
        >
          <span class="bg-linha h-4 w-3/4 rounded"></span>
          <span class="bg-linha h-6 w-1/2 rounded"></span>
        </li>
      </ul>

      <ErroAoCarregar
        v-else-if="erro"
        titulo="Não foi possível carregar os produtos"
        @tentar="carregar"
      />

      <EstadoVazio v-else-if="produtos.length === 0" titulo="Nenhum produto cadastrado">
        Um administrador precisa cadastrar produtos antes da primeira venda.
      </EstadoVazio>

      <p v-else-if="produtosFiltrados.length === 0" class="text-tinta-suave py-10 text-center">
        Nenhum produto com “{{ busca }}”.
      </p>

      <!-- auto-rows-fr iguala a altura de todas as linhas pela mais alta: cartão de nome
           curto fica do mesmo tamanho do de nome longo. Colunas só aumentam quando
           sobra largura — o carrinho ocupa 412px fixos e sufoca a grade até o 2xl -->
      <ul
        v-else
        class="grid auto-rows-fr grid-cols-2 gap-2.5 lg:gap-3 xl:grid-cols-3 2xl:grid-cols-4"
      >
        <li v-for="produto in produtosFiltrados" :key="produto.id" class="min-w-0">
          <button
            type="button"
            :disabled="!podeAdicionar(produto)"
            class="flex h-full min-h-22 w-full min-w-0 flex-col justify-between gap-2 rounded-xl border-2 p-3 text-left focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none disabled:cursor-not-allowed lg:min-h-24 lg:p-3.5"
            :class="
              noCarrinho(produto.id)
                ? 'border-violet-600 bg-violet-50'
                : podeAdicionar(produto)
                  ? 'border-linha bg-white hover:border-violet-300'
                  : 'border-linha bg-white opacity-55'
            "
            @click="adicionar(produto)"
          >
            <span
              class="flex w-full items-start justify-between gap-2 text-[15px] leading-snug font-medium lg:text-base"
            >
              <!-- span próprio: texto solto dentro de flex vira item com min-width:auto e
                   não encolhe. line-clamp-2 corta no terceiro nome comprido em vez de
                   deixar o cartão crescer; o title mostra o nome inteiro -->
              <span :title="produto.nome" class="line-clamp-2 min-w-0 wrap-break-word">
                {{ produto.nome }}
              </span>
              <span
                v-if="noCarrinho(produto.id)"
                class="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-violet-600 px-1.5 text-[13px] font-bold text-white tabular-nums"
              >
                {{ noCarrinho(produto.id) }}
              </span>
            </span>
            <span class="flex w-full flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <!-- nowrap: "R$ 6,00" tem espaço no meio e quebrava depois do R$ -->
              <span
                class="text-[19px] font-bold whitespace-nowrap tabular-nums lg:text-xl"
                :class="noCarrinho(produto.id) > 0 && 'text-violet-800'"
              >
                {{ formatarBRL(paraCentavos(produto.preco)) }}
              </span>

              <!-- produto sem controle de estoque não mostra nada: não há o que contar -->
              <span
                v-if="produto.estoque !== null"
                class="shrink-0 text-[13px] font-semibold whitespace-nowrap tabular-nums"
                :class="podeAdicionar(produto) ? 'text-tinta-fraca' : 'text-amber-700'"
              >
                {{ produto.estoque === 0 ? "Esgotado" : `${restante(produto)} rest.` }}
              </span>
            </span>
          </button>
        </li>

        <li
          v-if="busca.trim()"
          class="border-linha text-tinta-fraca col-span-full flex min-h-22 items-center justify-center rounded-xl border-2 border-dashed p-3 text-center text-sm lg:min-h-24"
        >
          {{ produtosFiltrados.length }} de {{ produtos.length }}
          {{ produtos.length === 1 ? "produto corresponde" : "produtos correspondem" }} a “{{
            busca.trim()
          }}”
        </li>
      </ul>
    </main>

    <aside
      class="border-linha flex flex-col gap-5 bg-white p-4 lg:w-103 lg:shrink-0 lg:border-l lg:p-6"
    >
      <Transition
        enter-active-class="transition duration-200"
        leave-active-class="transition duration-500"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="sucesso"
          role="status"
          class="flex items-center gap-3 rounded-xl bg-green-900 px-4 py-3.5 text-white"
        >
          <IconeNav nome="check" class="text-green-300" />
          <div>
            <p class="text-[15px] leading-tight font-semibold">Venda registrada</p>
            <p class="text-[13px] text-green-200 tabular-nums">
              {{ sucesso.total }} · {{ sucesso.forma }}
            </p>
          </div>
        </div>
      </Transition>

      <PainelCarrinho :itens="itens" class="lg:flex-1" @alterar="alterar" @limpar="limpar" />

      <SeletorPagamento v-model="forma" :desabilitado="itens.length === 0" />

      <SeletorCliente v-if="naConta" v-model="cliente" />

      <div class="border-linha flex items-baseline justify-between border-t pt-3">
        <span class="text-tinta-suave text-[15px] font-semibold">
          {{ naConta ? "Vai para a conta" : "Total" }}
        </span>
        <span
          class="text-[34px] font-bold tracking-tight tabular-nums"
          :class="naConta && 'text-amber-800'"
        >
          {{ formatarBRL(total) }}
        </span>
      </div>

      <p v-if="erroEnvio" role="alert" class="text-sm font-medium text-red-700">
        {{ erroEnvio }}
      </p>

      <button
        type="button"
        :disabled="!podeRegistrar"
        class="h-13 rounded-lg bg-violet-600 px-4 text-[17px] font-semibold text-white hover:bg-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none disabled:bg-violet-200"
        @click="modalAberto = true"
      >
        {{ rotuloBotao }}
      </button>

      <p class="text-tinta-fraca -mt-2 text-center text-[13px]">
        Enter registra · Esc limpa o carrinho
      </p>
    </aside>

    <ModalConfirmacao
      :aberto="modalAberto"
      titulo="Confirmar a venda?"
      :confirmar="rotuloBotao"
      :carregando="enviando"
      @fechar="modalAberto = false"
      @confirmar="confirmar"
    >
      <ul class="flex flex-col gap-1.5">
        <li v-for="item in itens" :key="item.produto.id" class="flex justify-between gap-4 text-sm">
          <span class="min-w-0 truncate">{{ item.quantidade }} × {{ item.produto.nome }}</span>
          <span class="tabular-nums">{{ formatarBRL(item.subtotal) }}</span>
        </li>
      </ul>

      <div class="border-linha mt-4 flex items-baseline justify-between border-t pt-4">
        <span class="text-sm font-medium" :class="naConta ? 'text-amber-800' : 'text-tinta-suave'">
          {{ resumoPagamento }}
        </span>
        <span class="text-3xl font-bold tabular-nums" :class="naConta && 'text-amber-800'">
          {{ formatarBRL(total) }}
        </span>
      </div>
    </ModalConfirmacao>
  </div>
</template>
