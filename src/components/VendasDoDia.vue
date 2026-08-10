<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { cancelarVenda, listarVendasDoDia } from "../services/vendas"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { formatarHora } from "../utils/data"
import { ROTULO_PAGAMENTO } from "../utils/pagamento"
import { mensagemDoErro } from "../utils/erro"
import type { Venda } from "../types/api"
import ErroAoCarregar from "./ErroAoCarregar.vue"
import EstadoVazio from "./EstadoVazio.vue"
import ModalConfirmacao from "./ModalConfirmacao.vue"

const props = defineProps<{ dia: string }>()
// o pai precisa refazer os totais: cancelar muda o relatório inteiro
const emit = defineEmits<{ cancelada: [] }>()

const vendas = ref<Venda[]>([])
const carregando = ref(true)
const erro = ref(false)

const paraCancelar = ref<Venda | null>(null)
const cancelando = ref(false)
const erroAoCancelar = ref("")

const ativas = computed(() => vendas.value.filter((v) => v.cancelada_em === null).length)

function totalDa(venda: Venda): number {
  return venda.itens.reduce(
    (soma, item) => soma + paraCentavos(item.preco_unitario) * item.quantidade,
    0,
  )
}

function itensDa(venda: Venda): string {
  return venda.itens.map((item) => `${item.quantidade} × ${item.produto.nome}`).join(", ")
}

function formaDa(venda: Venda): string {
  return venda.forma_pagamento ? ROTULO_PAGAMENTO[venda.forma_pagamento] : "Conta (em aberto)"
}

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    vendas.value = await listarVendasDoDia(props.dia)
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

async function confirmarCancelamento() {
  if (paraCancelar.value === null) return
  cancelando.value = true
  erroAoCancelar.value = ""
  try {
    await cancelarVenda(paraCancelar.value.id)
    paraCancelar.value = null
    await carregar()
    emit("cancelada")
  } catch (e) {
    erroAoCancelar.value = mensagemDoErro(e, "Não foi possível cancelar. Tente de novo.")
  } finally {
    cancelando.value = false
  }
}

// immediate cobre a montagem; o watch cobre a troca de dia no seletor do relatório
watch(() => props.dia, carregar, { immediate: true })
</script>

<template>
  <section class="flex flex-col gap-2.5 lg:gap-3">
    <div>
      <h2 class="font-semibold lg:text-[17px]">Vendas do dia</h2>
      <p v-if="!carregando && !erro" class="text-tinta-suave mt-1 text-sm">
        {{ ativas }} {{ ativas === 1 ? "venda válida" : "vendas válidas" }}
        <template v-if="vendas.length > ativas">
          · {{ vendas.length - ativas }} cancelada{{ vendas.length - ativas === 1 ? "" : "s" }}
        </template>
      </p>
    </div>

    <ul v-if="carregando" aria-hidden="true" class="flex flex-col gap-2">
      <li
        v-for="n in 3"
        :key="n"
        class="border-linha flex h-16 animate-pulse items-center rounded-xl border bg-white p-3.5"
      >
        <span class="bg-linha h-5 w-52 rounded"></span>
      </li>
    </ul>

    <ErroAoCarregar
      v-else-if="erro"
      titulo="Não foi possível carregar as vendas"
      @tentar="carregar"
    />

    <EstadoVazio v-else-if="vendas.length === 0" titulo="Nenhuma venda nesse dia">
      Nada foi registrado nessa data.
    </EstadoVazio>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="venda in vendas"
        :key="venda.id"
        class="border-linha flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border bg-white p-3.5"
        :class="venda.cancelada_em && 'opacity-60'"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium" :class="venda.cancelada_em && 'line-through'">
            {{ itensDa(venda) }}
          </p>
          <p class="text-tinta-suave text-[13px] tabular-nums">
            {{ formatarHora(venda.data_hora) }} · {{ formaDa(venda) }}
          </p>
        </div>

        <span
          class="font-bold tabular-nums"
          :class="venda.cancelada_em ? 'line-through' : 'lg:text-[19px]'"
        >
          {{ formatarBRL(totalDa(venda)) }}
        </span>

        <span
          v-if="venda.cancelada_em"
          class="text-tinta-fraca border-linha shrink-0 rounded-md border px-2 py-1 text-[13px] font-semibold"
        >
          Cancelada
        </span>
        <button
          v-else
          type="button"
          class="h-9 shrink-0 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:outline-none"
          @click="((paraCancelar = venda), (erroAoCancelar = ''))"
        >
          Cancelar
        </button>
      </li>
    </ul>

    <ModalConfirmacao
      :aberto="paraCancelar !== null"
      titulo="Cancelar venda"
      confirmar="Cancelar venda"
      perigo
      :carregando="cancelando"
      @fechar="paraCancelar = null"
      @confirmar="confirmarCancelamento"
    >
      <p class="leading-snug">
        Cancelar <b>{{ paraCancelar ? itensDa(paraCancelar) : "" }}</b> de
        {{ paraCancelar ? formatarBRL(totalDa(paraCancelar)) : "" }}?
      </p>
      <p class="text-tinta-suave mt-2 text-sm leading-snug">
        A venda sai de todos os totais do relatório e a mercadoria volta pro estoque. Ela continua
        aparecendo aqui, tachada.
      </p>

      <p
        v-if="erroAoCancelar"
        role="alert"
        class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
      >
        {{ erroAoCancelar }}
      </p>
    </ModalConfirmacao>
  </section>
</template>
