<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { listarContas } from "../services/contas"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { formatarDiaHora } from "../utils/data"
import { normalizar } from "../utils/texto"
import type { ContaAberta } from "../types/api"
import CampoBusca from "../components/CampoBusca.vue"
import ErroAoCarregar from "../components/ErroAoCarregar.vue"
import EstadoVazio from "../components/EstadoVazio.vue"

type Ordem = "valor" | "antigo" | "nome"

const ORDENS: { chave: Ordem; rotulo: string }[] = [
  { chave: "valor", rotulo: "Maior valor" },
  { chave: "antigo", rotulo: "Mais antigo" },
  { chave: "nome", rotulo: "Nome" },
]

// data em ISO ordena alfabeticamente na mesma ordem do relógio
const COMPARADORES: Record<Ordem, (a: ContaAberta, b: ContaAberta) => number> = {
  valor: (a, b) => paraCentavos(b.total) - paraCentavos(a.total),
  antigo: (a, b) => a.primeiro_consumo.localeCompare(b.primeiro_consumo),
  nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
}

// uma fonte só pras colunas: cabeçalho e linha não podem divergir
const COLUNAS = "lg:grid-cols-[1.6fr_1fr_1fr_200px_130px]"

const contas = ref<ContaAberta[]>([])
const total = ref(0)
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")
const ordem = ref<Ordem>("valor")

const visiveis = computed(() => {
  const termo = normalizar(busca.value.trim())
  const filtradas = termo
    ? contas.value.filter((conta) => normalizar(conta.nome).includes(termo))
    : contas.value
  // sort() reordena no lugar: copiar antes, senão mexeria na lista original
  return [...filtradas].sort(COMPARADORES[ordem.value])
})

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    const resposta = await listarContas()
    contas.value = resposta.contas
    total.value = paraCentavos(resposta.total)
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
      <div>
        <h1 class="text-[22px] font-semibold tracking-tight">Contas em aberto</h1>
        <p class="text-tinta-suave mt-1 text-sm">
          {{ contas.length }}
          {{ contas.length === 1 ? "cliente com consumo" : "clientes com consumo" }} não pago
        </p>
      </div>

      <div
        class="flex items-baseline justify-between gap-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 lg:flex-col lg:items-end lg:gap-1"
      >
        <div>
          <p class="text-[11px] font-semibold tracking-widest text-amber-800 uppercase">
            Total geral em aberto
          </p>
          <p class="text-[13px] text-amber-700">contas ainda não fechadas</p>
        </div>
        <p class="text-[28px] font-bold tracking-tight text-amber-800 tabular-nums lg:text-[40px]">
          {{ formatarBRL(total) }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <CampoBusca v-model="busca" rotulo="Buscar cliente" class="lg:w-90" />

      <div class="flex items-center gap-1.5">
        <span class="text-tinta-suave hidden text-sm lg:inline">Ordenar:</span>
        <button
          v-for="opcao in ORDENS"
          :key="opcao.chave"
          type="button"
          :aria-pressed="ordem === opcao.chave"
          class="rounded-full px-3.5 py-2 text-sm focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
          :class="
            ordem === opcao.chave
              ? 'bg-tinta font-semibold text-white'
              : 'border-linha text-tinta-suave border bg-white font-medium'
          "
          @click="ordem = opcao.chave"
        >
          {{ opcao.rotulo }}
        </button>
      </div>
    </div>

    <ul v-if="carregando" aria-hidden="true" class="flex flex-col gap-2">
      <li
        v-for="n in 4"
        :key="n"
        class="border-linha flex min-h-19 animate-pulse items-center justify-between rounded-xl border bg-white p-3.5"
      >
        <span class="bg-linha h-5 w-40 rounded"></span>
        <span class="bg-linha h-6 w-24 rounded"></span>
      </li>
    </ul>

    <ErroAoCarregar
      v-else-if="erro"
      titulo="Não foi possível carregar as contas"
      @tentar="carregar"
    />

    <EstadoVazio v-else-if="contas.length === 0" titulo="Nenhuma conta em aberto">
      Toda venda na conta já foi paga.
    </EstadoVazio>

    <p v-else-if="visiveis.length === 0" class="text-tinta-suave py-10 text-center">
      Nenhum cliente com “{{ busca.trim() }}”.
    </p>

    <template v-else>
      <div
        class="border-linha text-tinta-fraca bg-fundo hidden rounded-t-xl border border-b-0 px-5 py-3 text-[11px] font-semibold tracking-widest uppercase lg:grid lg:gap-3"
        :class="COLUNAS"
      >
        <span>Cliente</span>
        <span>Último consumo</span>
        <span>Consumos</span>
        <span class="text-right">Em aberto</span>
        <span class="text-right">Ação</span>
      </div>

      <ul
        class="lg:border-linha flex flex-col gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-b-xl lg:border lg:bg-white"
      >
        <li
          v-for="conta in visiveis"
          :key="conta.cliente_id"
          class="border-linha lg:border-linha flex min-h-19 flex-col justify-center gap-2 rounded-xl border bg-white p-3.5 lg:grid lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-4"
          :class="COLUNAS"
        >
          <div class="flex items-baseline justify-between gap-3 lg:contents">
            <span class="min-w-0 truncate font-semibold">{{ conta.nome }}</span>
            <!-- order 4 e 5: no desktop o valor e o botão são as duas últimas colunas -->
            <span
              class="text-[22px] font-bold text-amber-800 tabular-nums lg:order-4 lg:text-right lg:text-2xl"
            >
              {{ formatarBRL(paraCentavos(conta.total)) }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-3 lg:contents">
            <div class="text-tinta-suave flex min-w-0 gap-1 text-[13px] lg:contents lg:text-[15px]">
              <span class="tabular-nums">{{ formatarDiaHora(conta.ultimo_consumo) }}</span>
              <span aria-hidden="true" class="lg:hidden">·</span>
              <span class="truncate">
                {{ conta.consumos }} {{ conta.consumos === 1 ? "consumo" : "consumos" }}
              </span>
            </div>

            <RouterLink
              :to="{ name: 'conta', params: { clienteId: conta.cliente_id } }"
              class="grid h-11 shrink-0 place-items-center rounded-lg border border-violet-300 px-3.5 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none lg:order-5 lg:h-10 lg:justify-self-end"
            >
              Ver conta
            </RouterLink>
          </div>
        </li>
      </ul>
    </template>
  </main>
</template>
