<script setup lang="ts">
import { computed } from "vue"
import { formatarBRL } from "../utils/dinheiro"
import type { ItemCarrinho } from "../types/carrinho"
import IconeNav from "./IconeNav.vue"

const props = defineProps<{
  itens: ItemCarrinho[]
}>()

defineEmits<{
  alterar: [produtoId: number, delta: number]
  limpar: []
}>()

const quantidadeTotal = computed(() => props.itens.reduce((s, i) => s + i.quantidade, 0))
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
      class="border-linha-forte flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed p-6 text-center lg:flex-1"
    >
      <div class="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-400">
        <IconeNav nome="carrinho" />
      </div>
      <p class="font-semibold">Carrinho vazio</p>
      <p class="text-tinta-suave max-w-55 text-sm">Toque em um produto para adicionar.</p>
    </div>

    <template v-else>
      <ul class="flex flex-col gap-2 lg:flex-1">
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

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="border-linha-forte text-tinta-suave h-9 w-9 rounded-lg border text-lg font-semibold"
              :aria-label="`Tirar um ${item.produto.nome}`"
              @click="$emit('alterar', item.produto.id, -1)"
            >
              −
            </button>
            <span class="min-w-6 text-center text-[17px] font-semibold tabular-nums">
              {{ item.quantidade }}
            </span>
            <button
              type="button"
              class="h-9 w-9 rounded-lg border border-violet-300 bg-violet-50 text-lg font-semibold text-violet-800"
              :aria-label="`Adicionar um ${item.produto.nome}`"
              @click="$emit('alterar', item.produto.id, 1)"
            >
              +
            </button>
          </div>

          <span class="w-20 text-right text-[17px] font-bold tabular-nums">
            {{ formatarBRL(item.subtotal) }}
          </span>
        </li>
      </ul>

      <button
        type="button"
        class="self-start px-1 text-sm font-semibold text-red-700"
        @click="$emit('limpar')"
      >
        Limpar carrinho
      </button>
    </template>
  </section>
</template>
