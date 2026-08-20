<script setup lang="ts">
import { computed } from "vue"
import { centavosDigitados, formatarBRL } from "../utils/dinheiro"
import type { ItemCarrinho } from "../types/carrinho"
import CampoInline from "./CampoInline.vue"
import IconeNav from "./IconeNav.vue"

const props = defineProps<{
  itens: ItemCarrinho[]
}>()

const emit = defineEmits<{
  alterar: [produtoId: number, delta: number]
  definir: [produtoId: number, quantidade: number]
}>()

const quantidadeTotal = computed(() => props.itens.reduce((s, i) => s + i.quantidade, 0))

/** O item já carrega o produto inteiro, então o estoque vem junto — sem prop nova. */
function cabeMais(item: ItemCarrinho): boolean {
  return item.produto.estoque === null || item.quantidade < item.produto.estoque
}

function digitouQuantidade(item: ItemCarrinho, texto: string) {
  const digitos = texto.replace(/\D/g, "")
  if (digitos === "") return
  emit("definir", item.produto.id, Number(digitos))
}

function digitouValor(item: ItemCarrinho, texto: string) {
  const centavos = centavosDigitados(texto)
  if (centavos === null) return
  // arredonda pra baixo: com R$ 2,00 na mão, 3 unidades a R$ 1,80 servem e 4 a R$ 2,10
  // não — cobrar mais do que a pessoa pediu seria pior que devolver troco
  emit("definir", item.produto.id, Math.floor(centavos / item.unitario))
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h2 class="text-[17px] font-semibold">Carrinho</h2>
      <span class="text-tinta-fraca text-xs font-semibold tracking-widest tabular-nums">
        {{ quantidadeTotal }} {{ quantidadeTotal === 1 ? "ITEM" : "ITENS" }}
      </span>
    </div>

    <div
      v-if="itens.length === 0"
      class="border-linha-forte flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed p-6 text-center lg:min-h-0 lg:flex-1"
    >
      <div class="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-400">
        <IconeNav nome="carrinho" />
      </div>
      <p class="font-semibold">Carrinho vazio</p>
      <p class="text-tinta-suave max-w-55 text-sm">Toque em um produto para adicionar.</p>
    </div>

    <!-- é só esta lista que rola: o cabeçalho fica parado.
         pr-1 afasta os cartões da barra de rolagem -->
    <ul v-else class="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
      <li
        v-for="item in itens"
        :key="item.produto.id"
        class="border-linha flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold">{{ item.produto.nome }}</p>
          <p class="text-tinta-suave text-[13px] tabular-nums">
            {{ formatarBRL(item.unitario) }} cada
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="border-linha-forte text-tinta-suave h-9 w-9 rounded-lg border text-lg font-semibold"
            :aria-label="`Tirar um ${item.produto.nome}`"
            @click="$emit('alterar', item.produto.id, -1)"
          >
            −
          </button>
          <CampoInline
            :valor="String(item.quantidade)"
            :rotulo="`Quantidade de ${item.produto.nome}`"
            class="w-11 text-center text-[17px]"
            @confirmar="(texto) => digitouQuantidade(item, texto)"
          />
          <button
            type="button"
            :disabled="!cabeMais(item)"
            :title="cabeMais(item) ? undefined : 'Não há mais em estoque'"
            class="h-9 w-9 rounded-lg border border-violet-300 bg-violet-50 text-lg font-semibold text-violet-800 disabled:cursor-not-allowed disabled:opacity-40"
            :aria-label="`Adicionar um ${item.produto.nome}`"
            @click="$emit('alterar', item.produto.id, 1)"
          >
            +
          </button>
        </div>

        <CampoInline
          :valor="formatarBRL(item.subtotal)"
          :rotulo="`Valor de ${item.produto.nome}`"
          class="w-24 shrink-0 text-right text-[17px] font-bold"
          @confirmar="(texto) => digitouValor(item, texto)"
        />
      </li>
    </ul>
  </section>
</template>
