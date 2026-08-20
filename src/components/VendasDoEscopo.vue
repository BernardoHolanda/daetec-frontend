<script setup lang="ts">
/**
 * Lista as vendas do escopo, com cancelamento, paginação e rolagem própria.
 *
 * Filtra por data de registro, não de pagamento: um fiado acertado depois aparece no dia
 * em que foi lançado, e não no dia em que virou dinheiro no relatório.
 */
import { computed, ref, watch } from "vue"
import { cancelarVenda, listarVendasDoEscopo } from "../services/vendas"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { formatarDataHora } from "../utils/data"
import { ROTULO_PAGAMENTO } from "../utils/pagamento"
import { mensagemDoErro } from "../utils/erro"
import type { Venda } from "../types/api"
import ErroAoCarregar from "./ErroAoCarregar.vue"
import EstadoVazio from "./EstadoVazio.vue"
import ModalConfirmacao from "./ModalConfirmacao.vue"
import SecaoRecolhivel from "./SecaoRecolhivel.vue"

const TAMANHOS = [10, 20, 30] as const
type PorPagina = (typeof TAMANHOS)[number] | "todas"

const props = defineProps<{ inicio: string; fim: string }>()
// o pai precisa refazer os totais: cancelar muda o relatório inteiro
const emit = defineEmits<{ cancelada: [] }>()

const diaUnico = computed(() => props.inicio === props.fim)

const vendas = ref<Venda[]>([])
const carregando = ref(true)
const erro = ref(false)

// nasce fechada: no escopo largo a lista é longa e empurra o resumo pra fora da tela
const visivel = ref(false)
const porPagina = ref<PorPagina>(10)
const pagina = ref(1)

const paraCancelar = ref<Venda | null>(null)
const cancelando = ref(false)
const erroAoCancelar = ref("")

const ativas = computed(() => vendas.value.filter((v) => v.cancelada_em === null).length)

const totalPaginas = computed(() =>
  porPagina.value === "todas" ? 1 : Math.max(1, Math.ceil(vendas.value.length / porPagina.value)),
)

const visiveis = computed(() => {
  if (porPagina.value === "todas") return vendas.value
  const primeira = (pagina.value - 1) * porPagina.value
  return vendas.value.slice(primeira, primeira + porPagina.value)
})

// 10 é o menor tamanho de página: ele sempre cabe inteiro. Rolagem só a partir de
// quem pediu pra ver mais que o mínimo
const rolavel = computed(() => porPagina.value !== TAMANHOS[0])

const resumo = computed(() => {
  const canceladas = vendas.value.length - ativas.value
  const base = `${ativas.value} ${ativas.value === 1 ? "venda válida" : "vendas válidas"}`
  return canceladas === 0 ? base : `${base} · ${canceladas} cancelada${canceladas === 1 ? "" : "s"}`
})

// trocar o tamanho da página ou recarregar a lista invalida a página atual:
// ficar na 7 quando agora só existem 2 mostraria vazio sem explicar por quê
watch([porPagina, vendas], () => (pagina.value = 1))

const lista = ref<HTMLElement | null>(null)

// página nova começa do topo: sem isso você troca de página e cai no meio da lista,
// na mesma altura de rolagem em que estava
watch(pagina, () => lista.value?.scrollTo({ top: 0 }))

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
    vendas.value = await listarVendasDoEscopo(props.inicio, props.fim)
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

// immediate cobre a montagem; o watch cobre a troca de escopo no seletor do relatório
watch(() => [props.inicio, props.fim], carregar, { immediate: true })
</script>

<template>
  <SecaoRecolhivel
    v-model="visivel"
    titulo="Vendas"
    :subtitulo="carregando || erro ? undefined : resumo"
  >
    <!-- só faz sentido escolher o tamanho quando existe mais que a menor página -->
    <template v-if="!carregando && !erro && vendas.length > TAMANHOS[0]" #acao>
      <select
        v-model="porPagina"
        aria-label="Vendas por página"
        class="border-linha text-tinta min-h-9 shrink-0 rounded-lg border bg-white px-3 text-[13px] font-semibold focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
      >
        <option v-for="tamanho in TAMANHOS" :key="tamanho" :value="tamanho">
          {{ tamanho }} por página
        </option>
        <option value="todas">Todas ({{ vendas.length }})</option>
      </select>
    </template>

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

    <EstadoVazio
      v-else-if="vendas.length === 0"
      :titulo="diaUnico ? 'Nenhuma venda nesse dia' : 'Nenhuma venda no período'"
    >
      {{ diaUnico ? "Nada foi registrado nessa data." : "Nada foi registrado nesse intervalo." }}
    </EstadoVazio>

    <!-- rolagem própria, como o painel do carrinho: a página inteira não desce junto.
         pr-1 afasta os cartões da barra de rolagem -->
    <ul
      v-else
      ref="lista"
      class="flex flex-col gap-2"
      :class="rolavel && 'max-h-160 overflow-y-auto pr-1'"
    >
      <li
        v-for="venda in visiveis"
        :key="venda.id"
        class="border-linha flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border bg-white p-3.5"
        :class="venda.cancelada_em && 'opacity-60'"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium" :class="venda.cancelada_em && 'line-through'">
            {{ itensDa(venda) }}
          </p>
          <p class="text-tinta-suave text-[13px] tabular-nums">
            {{ formatarDataHora(venda.data_hora) }} · {{ formaDa(venda) }}
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

    <div v-if="totalPaginas > 1" class="flex items-center justify-between gap-3">
      <button
        type="button"
        :disabled="pagina === 1"
        class="border-linha text-tinta-suave hover:bg-fundo h-9 rounded-lg border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        @click="pagina--"
      >
        Anterior
      </button>

      <!-- select em vez de botões numerados: não precisa de reticências quando o
           intervalo é largo e vira uma página só -->
      <div class="text-tinta-suave flex items-center gap-2 text-sm">
        <span>Página</span>
        <select
          v-model="pagina"
          aria-label="Ir para a página"
          class="border-linha text-tinta min-h-9 rounded-lg border bg-white px-2.5 text-[13px] font-semibold tabular-nums focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
        >
          <option v-for="n in totalPaginas" :key="n" :value="n">{{ n }}</option>
        </select>
        <span class="tabular-nums">de {{ totalPaginas }}</span>
      </div>

      <button
        type="button"
        :disabled="pagina === totalPaginas"
        class="border-linha text-tinta-suave hover:bg-fundo h-9 rounded-lg border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        @click="pagina++"
      >
        Próxima
      </button>
    </div>
  </SecaoRecolhivel>

  <!-- fora da seção recolhível: modal não é conteúdo de lista, e recolher com ele
       aberto o desmontaria no meio da confirmação -->
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
</template>
