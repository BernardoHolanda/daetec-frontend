<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { listarProdutos } from "../services/produtos"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { normalizar } from "../utils/texto"
import type { Produto } from "../types/api"
import type { ItemCarrinho } from "../types/carrinho"
import PainelCarrinho from "../components/PainelCarrinho.vue"
import IconeNav from "../components/IconeNav.vue"

const produtos = ref<Produto[]>([])
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")

/** produto_id → quantidade. Map em vez de array: busca e atualização em O(1),
 *  e o mesmo produto nunca entra duas vezes. */
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

function adicionar(produto: Produto) {
  carrinho.value.set(produto.id, (carrinho.value.get(produto.id) ?? 0) + 1)
}

function alterar(produtoId: number, delta: number) {
  const nova = (carrinho.value.get(produtoId) ?? 0) + delta
  if (nova <= 0) carrinho.value.delete(produtoId)
  else carrinho.value.set(produtoId, nova)
}

function limpar() {
  carrinho.value.clear()
}

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
            class="border-linha flex min-h-22 w-full flex-col justify-between gap-2 rounded-xl border bg-white p-3 text-left hover:border-violet-300 focus-visible:border-violet-600 focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none lg:min-h-24 lg:p-3.5"
            @click="adicionar(produto)"
          >
            <span class="text-[15px] leading-snug font-medium lg:text-base">
              {{ produto.nome }}
            </span>
            <span class="text-[19px] font-bold tabular-nums lg:text-xl">
              {{ formatarBRL(paraCentavos(produto.preco)) }}
            </span>
          </button>
        </li>
      </ul>
    </main>

    <aside
      class="border-linha bg-white p-4 lg:flex lg:w-103 lg:shrink-0 lg:flex-col lg:border-l lg:p-6"
    >
      <PainelCarrinho :itens="itens" :total="total" @alterar="alterar" @limpar="limpar" />
    </aside>
  </div>
</template>
