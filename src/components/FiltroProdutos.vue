<script setup lang="ts">
import type { Vendedor } from "../types/api"
import type { Disponibilidade } from "../utils/produtos"

const OPCOES: { valor: Disponibilidade; rotulo: string }[] = [
  { valor: "em-estoque", rotulo: "Em estoque" },
  { valor: "esgotado", rotulo: "Esgotado" },
  { valor: "todos", rotulo: "Todos os produtos" },
]

defineProps<{ vendedores: Vendedor[] }>()

const disponibilidade = defineModel<Disponibilidade>("disponibilidade", { required: true })
const vendedorId = defineModel<number | null>("vendedorId", { required: true })
</script>

<template>
  <div class="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
    <!-- aria-pressed e não role="radio": são botões de alternar um filtro, e o leitor de
         tela anuncia "pressionado" sem exigir a navegação por setas que um radiogroup pede -->
    <div role="group" aria-label="Disponibilidade" class="flex flex-wrap gap-2">
      <button
        v-for="opcao in OPCOES"
        :key="opcao.valor"
        type="button"
        :aria-pressed="disponibilidade === opcao.valor"
        class="min-h-9 rounded-full border px-3.5 text-[13px] font-semibold focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
        :class="
          disponibilidade === opcao.valor
            ? 'border-violet-600 bg-violet-50 text-violet-800'
            : 'border-linha text-tinta-suave bg-white hover:border-violet-300'
        "
        @click="disponibilidade = opcao.valor"
      >
        {{ opcao.rotulo }}
      </button>
    </div>

    <!-- :value="null" e não value="": com o v-model do Vue o valor é o do binding, então
         a opção "todos" devolve null de verdade em vez da string vazia -->
    <select
      v-model="vendedorId"
      aria-label="Filtrar por vendedor"
      class="border-linha text-tinta min-h-9 rounded-lg border bg-white px-3 text-[13px] font-semibold focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none lg:w-56"
    >
      <option :value="null">Todos os vendedores</option>
      <option v-for="vendedor in vendedores" :key="vendedor.id" :value="vendedor.id">
        {{ vendedor.nome }}
      </option>
    </select>
  </div>
</template>
