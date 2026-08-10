<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { obterRelatorio } from "../services/relatorio"
import { formatarBRL, formatarValor, paraCentavos } from "../utils/dinheiro"
import { FORMAS, ROTULO_PAGAMENTO } from "../utils/pagamento"
import type { FormaPagamento, Relatorio, VendedorRelatorio } from "../types/api"
import ErroAoCarregar from "../components/ErroAoCarregar.vue"
import EstadoVazio from "../components/EstadoVazio.vue"
import IconeNav from "../components/IconeNav.vue"
import SeletorDia from "../components/SeletorDia.vue"
import VendasDoDia from "../components/VendasDoDia.vue"

// classes literais: o Tailwind lê o código como texto, `bg-${forma}` não geraria nada
const CORES: Record<FormaPagamento, { icone: string; barra: string }> = {
  pix: { icone: "text-pix", barra: "bg-pix" },
  debito: { icone: "text-debito", barra: "bg-debito" },
  credito: { icone: "text-credito", barra: "bg-credito" },
  dinheiro: { icone: "text-dinheiro", barra: "bg-dinheiro" },
}

const relatorio = ref<Relatorio | null>(null)
const carregando = ref(true)
const erro = ref(false)

const dia = ref("")
// quem decide o "hoje" é o backend (fuso de Manaus), não o relógio de quem abriu a tela
const hoje = ref("")
const ehHoje = computed(() => dia.value === hoje.value)

const vendedores = computed<VendedorRelatorio[]>(() => relatorio.value?.vendedores ?? [])

function somar(campo: (vendedor: VendedorRelatorio) => string): number {
  return vendedores.value.reduce((total, vendedor) => total + paraCentavos(campo(vendedor)), 0)
}

const recebido = computed(() => somar((v) => v.recebido_total))
const emConta = computed(() => somar((v) => v.conta_em_aberto))
const vendido = computed(() => recebido.value + emConta.value)

const porForma = computed(() =>
  FORMAS.map((forma) => {
    // ?? "0": a forma sem venda no dia não vem no objeto
    const valor = somar((v) => v.recebido_por_forma[forma] ?? "0")
    return {
      forma,
      valor,
      // guarda contra 0/0 = NaN em dia sem nada recebido
      participacao: recebido.value === 0 ? 0 : (valor / recebido.value) * 100,
    }
  }),
)

const linhas = computed(() =>
  vendedores.value
    .map((v) => ({
      id: v.vendedor_id,
      nome: v.nome,
      // a forma viaja junto do valor: a célula não depende de casar índice com o cabeçalho
      formas: FORMAS.map((forma) => ({
        forma,
        valor: paraCentavos(v.recebido_por_forma[forma] ?? "0"),
      })),
      recebido: paraCentavos(v.recebido_total),
      conta: paraCentavos(v.conta_em_aberto),
      devedores: v.devedores
        .map((d) => ({ ...d, valor: paraCentavos(d.valor) }))
        .sort((a, b) => b.valor - a.valor),
    }))
    // em dia passado a conta não é mostrada, então quem não recebeu nada não tem linha
    .filter((linha) => linha.recebido > 0 || (ehHoje.value && linha.conta > 0))
    // nome desempata pra a ordem não dançar entre recargas quando dois empatam
    .sort((a, b) => b.recebido - a.recebido || a.nome.localeCompare(b.nome, "pt-BR")),
)

const comConta = computed(() => linhas.value.filter((linha) => linha.conta > 0))

// uma fonte só pras colunas; sem a de conta, a tabela do dia passado tem 6
const COLUNAS = computed(() =>
  ehHoje.value
    ? "grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.9fr_1fr_1.05fr]"
    : "grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.9fr_1fr]",
)

type LinhaVendedor = (typeof linhas.value)[number]

function rotuloConta(linha: LinhaVendedor): string {
  if (linha.conta === 0) return "Sem conta aberta"
  const n = linha.devedores.length
  return `Conta (${n} ${n === 1 ? "cliente" : "clientes"})`
}

function formatarPercentual(valor: number): string {
  const numero = valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${numero}%`
}

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    const dados = await obterRelatorio(dia.value || undefined)
    relatorio.value = dados
    // a primeira carga vem sem dia: é a resposta que ensina qual é o hoje do backend
    if (!dia.value) {
      hoje.value = dados.data
      dia.value = dados.data
    }
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

function escolherDia(novo: string) {
  dia.value = novo
  carregar()
}

onMounted(carregar)
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
      <div>
        <h1 class="text-[22px] font-semibold tracking-tight">Relatório do dia</h1>
        <p v-if="relatorio" class="text-tinta-suave mt-1 text-sm">
          {{ linhas.length }}
          {{ linhas.length === 1 ? "vendedor" : "vendedores" }} com movimento
        </p>
      </div>

      <SeletorDia v-if="hoje" :dia="dia" :max="hoje" @selecionar="escolherDia" />
    </div>

    <p
      v-if="hoje && !ehHoje"
      class="border-linha bg-fundo text-tinta-suave rounded-lg border px-3.5 py-2.5 text-[13px] leading-snug"
    >
      Dia fechado: só o que foi <b class="text-tinta">recebido</b> nessa data.
    </p>

    <div v-if="carregando" aria-hidden="true" class="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
      <div
        v-for="n in 3"
        :key="n"
        class="border-linha h-24 animate-pulse rounded-xl border bg-white first:col-span-2 lg:h-30 lg:first:col-span-1"
      ></div>
    </div>

    <ErroAoCarregar
      v-else-if="erro"
      titulo="Não foi possível carregar o relatório"
      @tentar="carregar"
    />

    <EstadoVazio v-else-if="linhas.length === 0" titulo="Nenhum movimento nesse dia">
      {{ ehHoje ? "Nada recebido e nenhuma conta em aberto." : "Nada foi recebido nessa data." }}
    </EstadoVazio>

    <template v-else>
      <!-- no celular o recebido vem primeiro e ocupa a linha toda; no desktop as três
           colunas ficam lado a lado e o vendido volta pra frente -->
      <div
        class="grid grid-cols-2 gap-2.5 lg:gap-4"
        :class="ehHoje ? 'lg:grid-cols-3' : 'lg:grid-cols-1'"
      >
        <div
          class="col-span-2 flex flex-col justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 p-3.5 lg:order-2 lg:col-span-1 lg:p-5"
        >
          <p
            class="text-[10px] font-semibold tracking-widest text-green-700 uppercase lg:text-[11px]"
          >
            Total recebido
          </p>
          <p class="text-[40px] leading-none font-bold tracking-tight text-green-700 tabular-nums">
            {{ formatarBRL(recebido) }}
          </p>
          <p class="hidden text-[13px] font-medium text-green-700 lg:block">
            dinheiro que entrou no dia
          </p>
        </div>

        <!-- os dois cartões abaixo são saldo de agora, não do dia escolhido -->
        <template v-if="ehHoje">
          <div
            class="border-linha flex flex-col justify-center gap-1.5 rounded-xl border bg-white p-3.5 lg:order-1 lg:p-5"
          >
            <p
              class="text-tinta-fraca text-[10px] font-semibold tracking-widest uppercase lg:text-[11px]"
            >
              Total vendido
            </p>
            <p class="text-2xl leading-none font-bold tracking-tight tabular-nums lg:text-[40px]">
              {{ formatarBRL(vendido) }}
            </p>
            <p class="text-tinta-suave hidden text-[13px] lg:block">recebido + em conta</p>
          </div>

          <div
            class="flex flex-col justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 lg:order-3 lg:p-5"
          >
            <p
              class="text-[10px] font-semibold tracking-widest text-amber-800 uppercase lg:text-[11px]"
            >
              Em conta (aberto)
            </p>
            <p
              class="text-2xl leading-none font-bold tracking-tight text-amber-800 tabular-nums lg:text-[40px]"
            >
              {{ formatarBRL(emConta) }}
            </p>
            <p class="hidden text-[13px] font-semibold text-amber-700 lg:block">
              não entra no recebido
            </p>
          </div>
        </template>
      </div>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section
          class="border-linha flex flex-col gap-4 rounded-xl border bg-white p-3.5 lg:w-105 lg:shrink-0 lg:p-5"
        >
          <div>
            <h2 class="font-semibold lg:text-[17px]">Quebra por forma de pagamento</h2>
            <p class="text-tinta-fraca mt-1 hidden text-[13px] lg:block">
              Participação sobre o recebido ({{ formatarBRL(recebido) }})
            </p>
          </div>

          <p v-if="recebido === 0" class="text-tinta-suave text-sm">Nada recebido nesse dia.</p>

          <ul v-else class="flex flex-col gap-3 lg:gap-3.5">
            <li v-for="item in porForma" :key="item.forma" class="flex flex-col gap-1.5">
              <div class="flex items-baseline justify-between gap-3">
                <span class="flex items-center gap-2 font-semibold">
                  <IconeNav :nome="item.forma" :class="CORES[item.forma].icone" />
                  {{ ROTULO_PAGAMENTO[item.forma] }}
                </span>
                <span class="flex items-baseline gap-2.5">
                  <span class="font-bold tabular-nums lg:text-[19px]">
                    {{ formatarBRL(item.valor) }}
                  </span>
                  <span class="text-tinta-suave text-xs tabular-nums lg:text-[13px]">
                    {{ formatarPercentual(item.participacao) }}
                  </span>
                </span>
              </div>

              <div class="bg-linha h-1.5 overflow-hidden rounded-full lg:h-2">
                <!-- largura é dado, não estilo fixo: só style aceita valor calculado -->
                <div
                  class="h-full rounded-full"
                  :class="CORES[item.forma].barra"
                  :style="{ width: `${item.participacao}%` }"
                ></div>
              </div>
            </li>
          </ul>

          <div
            v-if="ehHoje"
            class="flex flex-col gap-1.5 border-t border-dashed border-amber-200 pt-3.5"
          >
            <div class="flex items-baseline justify-between gap-3">
              <span class="flex items-center gap-2 font-semibold text-amber-800">
                <IconeNav nome="conta" class="text-conta" />
                Conta
              </span>
              <span class="font-bold text-amber-800 tabular-nums lg:text-[19px]">
                {{ formatarBRL(emConta) }}
              </span>
            </div>
          </div>
        </section>

        <section
          class="lg:border-linha flex min-w-0 flex-col gap-2.5 lg:flex-1 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:bg-white"
        >
          <h2 class="font-semibold lg:px-5 lg:pt-4 lg:pb-3 lg:text-[17px]">Quebra por vendedor</h2>

          <div class="hidden lg:block">
            <div
              class="text-tinta-fraca bg-fundo border-linha grid gap-2 border-y px-5 py-2.5 text-[10px] font-semibold tracking-wider uppercase"
              :class="COLUNAS"
            >
              <span>Vendedor</span>
              <span v-for="forma in FORMAS" :key="forma" class="text-right">
                {{ ROTULO_PAGAMENTO[forma] }}
              </span>
              <span class="text-right text-green-700">Recebido</span>
              <span v-if="ehHoje" class="text-right text-amber-800">Conta (aberto)</span>
            </div>

            <div
              v-for="linha in linhas"
              :key="linha.id"
              class="border-linha grid items-center gap-2 border-b px-5 py-3 tabular-nums"
              :class="COLUNAS"
            >
              <span class="truncate font-semibold">{{ linha.nome }}</span>
              <span
                v-for="item in linha.formas"
                :key="item.forma"
                class="text-right"
                :class="item.valor === 0 && 'text-tinta-fraca'"
              >
                {{ item.valor === 0 ? "—" : formatarValor(item.valor) }}
              </span>
              <span class="text-right font-bold text-green-700">
                {{ formatarBRL(linha.recebido) }}
              </span>
              <span
                v-if="ehHoje"
                class="text-right font-bold"
                :class="
                  linha.conta === 0
                    ? 'text-tinta-fraca'
                    : 'rounded-md bg-amber-50 px-2 py-1.5 text-amber-800'
                "
              >
                {{ linha.conta === 0 ? "—" : formatarBRL(linha.conta) }}
              </span>
            </div>

            <div class="bg-fundo grid gap-2 px-5 py-3 font-bold tabular-nums" :class="COLUNAS">
              <span>Total</span>
              <span
                v-for="item in porForma"
                :key="item.forma"
                class="text-right"
                :class="item.valor === 0 && 'text-tinta-fraca'"
              >
                {{ item.valor === 0 ? "—" : formatarValor(item.valor) }}
              </span>
              <span class="text-right text-green-700">{{ formatarBRL(recebido) }}</span>
              <span v-if="ehHoje" class="text-right text-amber-800">
                {{ formatarBRL(emConta) }}
              </span>
            </div>
          </div>

          <ul class="flex flex-col gap-2.5 lg:hidden">
            <li
              v-for="linha in linhas"
              :key="linha.id"
              class="border-linha flex flex-col gap-2.5 rounded-xl border bg-white p-3.5"
            >
              <p class="text-tinta-fraca text-[11px] font-semibold tracking-widest uppercase">
                {{ linha.nome }}
              </p>

              <div class="grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm tabular-nums">
                <div
                  v-for="item in linha.formas"
                  :key="item.forma"
                  class="flex justify-between gap-2"
                >
                  <span class="text-tinta-suave">{{ ROTULO_PAGAMENTO[item.forma] }}</span>
                  <span class="font-semibold" :class="item.valor === 0 && 'text-tinta-fraca'">
                    {{ item.valor === 0 ? "—" : formatarValor(item.valor) }}
                  </span>
                </div>
              </div>

              <div class="border-linha flex items-baseline justify-between gap-3 border-t pt-2.5">
                <span class="text-sm font-semibold text-green-700">Recebido</span>
                <span class="text-xl font-bold text-green-700 tabular-nums">
                  {{ formatarBRL(linha.recebido) }}
                </span>
              </div>

              <div
                v-if="ehHoje"
                class="flex items-baseline justify-between gap-3 rounded-lg border px-2.5 py-2"
                :class="
                  linha.conta === 0 ? 'border-linha bg-fundo' : 'border-amber-200 bg-amber-50'
                "
              >
                <span
                  class="text-sm font-semibold"
                  :class="linha.conta === 0 ? 'text-tinta-fraca' : 'text-amber-800'"
                >
                  {{ rotuloConta(linha) }}
                </span>
                <span
                  class="text-xl font-bold tabular-nums"
                  :class="linha.conta === 0 ? 'text-tinta-fraca' : 'text-amber-800'"
                >
                  {{ linha.conta === 0 ? "—" : formatarBRL(linha.conta) }}
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="ehHoje && comConta.length > 0" class="flex flex-col gap-2.5 lg:gap-3">
        <h2 class="font-semibold lg:text-[17px]">Contas abertas por vendedor</h2>

        <ul class="grid gap-2.5 lg:grid-cols-2 lg:gap-3">
          <li
            v-for="linha in comConta"
            :key="linha.id"
            class="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5"
          >
            <div class="flex items-baseline justify-between gap-3 text-amber-800">
              <span class="min-w-0 truncate font-semibold">{{ linha.nome }}</span>
              <span class="text-[19px] font-bold tabular-nums">
                {{ formatarBRL(linha.conta) }}
              </span>
            </div>

            <div
              v-for="devedor in linha.devedores"
              :key="devedor.cliente_id"
              class="flex justify-between gap-3 text-sm text-amber-800 tabular-nums"
            >
              <span class="min-w-0 truncate">{{ devedor.nome }}</span>
              <span class="font-semibold">{{ formatarBRL(devedor.valor) }}</span>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <!-- fora do v-else de propósito: cancelar a última venda do dia zera os totais, e a
         lista precisa continuar na tela pra você ver o que acabou de desfazer -->
    <VendasDoDia v-if="hoje && !carregando && !erro" :dia="dia" @cancelada="carregar" />
  </main>
</template>
