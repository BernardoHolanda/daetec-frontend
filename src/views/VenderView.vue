<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { listarProdutos } from "../services/produtos"
import { registrarVenda } from "../services/vendas"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { normalizar } from "../utils/texto"
import type { FormaPagamento, OpcaoPagamento, Produto } from "../types/api"
import type { ItemCarrinho } from "../types/carrinho"
import PainelCarrinho from "../components/PainelCarrinho.vue"
import SeletorPagamento from "../components/SeletorPagamento.vue"
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

const contaPendente = computed(() => forma.value === "conta")

const podeRegistrar = computed(
  () => itens.value.length > 0 && forma.value !== null && !contaPendente.value,
)

function noCarrinho(produtoId: number): number {
  return carrinho.value.get(produtoId) ?? 0
}

function adicionar(produto: Produto) {
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
onBeforeUnmount(() => window.removeEventListener("keydown", aoTeclar))

async function confirmar() {
  if (!podeRegistrar.value) return
  enviando.value = true
  erroEnvio.value = ""
  try {
    await registrarVenda({
      forma_pagamento: forma.value as FormaPagamento,
      itens: itens.value.map((item) => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
      })),
    })
    sucesso.value = {
      total: formatarBRL(total.value),
      forma: ROTULO_PAGAMENTO[forma.value as OpcaoPagamento],
    }
    limpar()
    modalAberto.value = false
  } catch {
    erroEnvio.value = "Não foi possível registrar a venda. Tente de novo."
  } finally {
    enviando.value = false
  }
}

function alterar(produtoId: number, delta: number) {
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

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    produtos.value = await listarProdutos()
  } catch {
    erro.value = true
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

        <label class="relative block lg:w-105">
          <span class="sr-only">Buscar produto</span>
          <IconeNav
            nome="busca"
            class="text-tinta-fraca pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          />
          <input
            v-model="busca"
            type="search"
            placeholder="Buscar produto"
            class="border-linha-forte h-12 w-full rounded-lg border bg-white pr-3.5 pl-11 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
          />
        </label>
      </div>

      <ul
        v-if="carregando"
        aria-hidden="true"
        class="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3"
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

      <div
        v-else-if="erro"
        class="border-linha flex flex-col items-start gap-3 rounded-xl border bg-white p-6"
      >
        <div>
          <p class="font-semibold">Não foi possível carregar os produtos</p>
          <p class="text-tinta-suave mt-1 text-sm">Verifique a conexão e tente de novo.</p>
        </div>
        <button
          type="button"
          class="h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
          @click="carregar"
        >
          Tentar novamente
        </button>
      </div>

      <div
        v-else-if="produtos.length === 0"
        class="border-linha-forte flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center"
      >
        <p class="font-semibold">Nenhum produto cadastrado</p>
        <p class="text-tinta-suave text-sm">
          Um administrador precisa cadastrar produtos antes da primeira venda.
        </p>
      </div>

      <p v-else-if="produtosFiltrados.length === 0" class="text-tinta-suave py-10 text-center">
        Nenhum produto com “{{ busca }}”.
      </p>

      <ul v-else class="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
        <li v-for="produto in produtosFiltrados" :key="produto.id">
          <button
            type="button"
            class="flex min-h-22 w-full flex-col justify-between gap-2 rounded-xl border-2 p-3 text-left focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none lg:min-h-24 lg:p-3.5"
            :class="
              noCarrinho(produto.id)
                ? 'border-violet-600 bg-violet-50'
                : 'border-linha bg-white hover:border-violet-300'
            "
            @click="adicionar(produto)"
          >
            <span
              class="flex items-start justify-between gap-2 text-[15px] leading-snug font-medium lg:text-base"
            >
              {{ produto.nome }}
              <span
                v-if="noCarrinho(produto.id)"
                class="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-violet-600 px-1.5 text-[13px] font-bold text-white tabular-nums"
              >
                {{ noCarrinho(produto.id) }}
              </span>
            </span>
            <span
              class="text-[19px] font-bold tabular-nums lg:text-xl"
              :class="noCarrinho(produto.id) > 0 && 'text-violet-800'"
            >
              {{ formatarBRL(paraCentavos(produto.preco)) }}
            </span>
          </button>
        </li>

        <li
          v-if="busca.trim()"
          class="border-linha text-tinta-fraca col-span-2 flex min-h-22 items-center justify-center rounded-xl border-2 border-dashed p-3 text-center text-sm lg:min-h-24"
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

      <PainelCarrinho :itens="itens" class="lg:flex-1" @alterar="alterar" @limpar="limpar" />

      <SeletorPagamento v-model="forma" :desabilitado="itens.length === 0" />

      <div class="border-linha flex items-baseline justify-between border-t pt-3">
        <span class="text-tinta-suave text-[15px] font-semibold">Total</span>
        <span class="text-[34px] font-bold tracking-tight tabular-nums">
          {{ formatarBRL(total) }}
        </span>
      </div>

      <p
        v-if="contaPendente"
        class="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
      >
        Venda na conta ainda não está pronta — falta escolher o cliente.
      </p>

      <p v-if="erroEnvio" role="alert" class="text-sm font-medium text-red-700">
        {{ erroEnvio }}
      </p>

      <button
        type="button"
        :disabled="!podeRegistrar"
        class="h-13 rounded-lg bg-violet-600 text-[17px] font-semibold text-white hover:bg-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none disabled:bg-violet-200"
        @click="modalAberto = true"
      >
        Registrar venda
      </button>

      <p class="text-tinta-fraca -mt-2 text-center text-[13px]">
        Enter registra · Esc limpa o carrinho
      </p>
    </aside>

    <ModalConfirmacao
      :aberto="modalAberto"
      titulo="Confirmar a venda?"
      confirmar="Registrar venda"
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
        <span class="text-tinta-suave text-sm font-medium">
          {{ forma ? ROTULO_PAGAMENTO[forma] : "" }}
        </span>
        <span class="text-3xl font-bold tabular-nums">{{ formatarBRL(total) }}</span>
      </div>
    </ModalConfirmacao>
  </div>
</template>
