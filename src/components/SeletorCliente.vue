<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { listarClientes } from "../services/clientes"
import { normalizar } from "../utils/texto"
import type { Cliente } from "../types/api"
import IconeNav from "./IconeNav.vue"

const escolhido = defineModel<Cliente | null>({ required: true })

const clientes = ref<Cliente[]>([])
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")

const encontrados = computed(() => {
  const termo = normalizar(busca.value.trim())
  if (!termo) return clientes.value
  return clientes.value.filter((cliente) => normalizar(cliente.nome).includes(termo))
})

function alternar(cliente: Cliente) {
  escolhido.value = escolhido.value?.id === cliente.id ? null : cliente
}

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    clientes.value = await listarClientes()
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

// só busca quando a tela realmente precisa: o componente só existe se "Conta" foi escolhida
onMounted(carregar)
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
    <div class="flex items-start gap-2.5">
      <IconeNav nome="aviso" class="mt-px shrink-0 text-amber-700" />
      <p class="text-sm leading-relaxed text-amber-800">
        <strong class="font-semibold">Não entra como recebido agora.</strong>
        O valor fica em aberto na conta do cliente até o fechamento.
      </p>
    </div>

    <label class="flex flex-col gap-1.5">
      <span class="text-tinta text-[13px] font-semibold">De quem é a conta?</span>
      <span class="relative block">
        <IconeNav
          nome="busca"
          class="text-tinta-fraca pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
        />
        <input
          v-model="busca"
          type="search"
          placeholder="Buscar cliente"
          class="border-linha-forte h-12 w-full rounded-lg border bg-white pr-3.5 pl-11 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
        />
      </span>
    </label>

    <p v-if="carregando" class="text-sm text-amber-800">Carregando clientes...</p>

    <div v-else-if="erro" class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-amber-800">Não foi possível carregar os clientes.</p>
      <button
        type="button"
        class="h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-800"
        @click="carregar"
      >
        Tentar de novo
      </button>
    </div>

    <p v-else-if="clientes.length === 0" class="text-sm text-amber-800">
      Nenhum cliente cadastrado ainda.
    </p>

    <p v-else-if="encontrados.length === 0" class="text-sm text-amber-800">
      Nenhum cliente com “{{ busca.trim() }}”.
    </p>

    <ul
      v-else
      class="border-linha divide-linha max-h-56 divide-y overflow-y-auto rounded-lg border bg-white"
    >
      <li v-for="cliente in encontrados" :key="cliente.id">
        <button
          type="button"
          :aria-pressed="escolhido?.id === cliente.id"
          class="flex min-h-13 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
          :class="escolhido?.id === cliente.id ? 'bg-violet-50' : 'hover:bg-fundo'"
          @click="alternar(cliente)"
        >
          <span
            class="text-[15px]"
            :class="escolhido?.id === cliente.id ? 'font-semibold' : 'font-medium'"
          >
            {{ cliente.nome }}
          </span>
          <svg
            v-if="escolhido?.id === cliente.id"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="h-5.5 w-5.5 shrink-0 rounded-full bg-violet-600 p-1 text-white"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>
