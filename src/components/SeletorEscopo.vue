<script setup lang="ts">
/**
 * Escopo de datas: duas pontas ligadas por uma linha, cada uma abrindo o calendário.
 *
 * Arrastar uma ponta além da outra puxa a outra junto, virando dia único, em vez de
 * recusar o clique. `max` trava o futuro.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { formatarData } from "../utils/data"
import IconeNav from "./IconeNav.vue"

const props = defineProps<{ inicio: string; fim: string; max: string }>()
const emit = defineEmits<{ selecionar: [inicio: string, fim: string] }>()

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const ANOS_POR_PAGINA = 12

type Modo = "dias" | "meses" | "anos"
type Ponta = "inicio" | "fim"

/** ISO → Date no fuso local. `new Date("2026-08-10")` seria meia-noite UTC, ou seja, dia 9 aqui. */
function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function paraISO(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${data.getFullYear()}-${mes}-${dia}`
}

// qual ponta está sendo editada; null = calendário fechado
const editando = ref<Ponta | null>(null)
const modo = ref<Modo>("dias")
const mesVisivel = ref(paraData(props.fim))

const emEdicao = computed(() => (editando.value === "inicio" ? props.inicio : props.fim))

watch(editando, (ponta) => {
  if (ponta) {
    modo.value = "dias"
    // abre no mês da ponta clicada: procurar o início lá de dezembro seria trabalho à toa
    mesVisivel.value = paraData(ponta === "inicio" ? props.inicio : props.fim)
  }
})

const limite = computed(() => paraData(props.max))
const anoVisivel = computed(() => mesVisivel.value.getFullYear())

const escolhido = computed(() => {
  const data = paraData(emEdicao.value)
  return { ano: data.getFullYear(), mes: data.getMonth() }
})

// blocos alinhados a múltiplos de 12: as setas paginam sem deslocar o intervalo
const inicioBloco = computed(() => Math.floor(anoVisivel.value / ANOS_POR_PAGINA) * ANOS_POR_PAGINA)

const rotulo = computed(() => {
  if (modo.value === "anos") return `${inicioBloco.value} – ${inicioBloco.value + 11}`
  if (modo.value === "meses") return String(anoVisivel.value)
  const texto = mesVisivel.value.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
})

const celulas = computed(() => {
  const ano = anoVisivel.value
  const mes = mesVisivel.value.getMonth()
  const total = new Date(ano, mes + 1, 0).getDate()
  const vazias = new Date(ano, mes, 1).getDay()

  return [
    ...Array.from({ length: vazias }, (_, i) => ({ chave: `vazio-${i}`, iso: "", numero: 0 })),
    ...Array.from({ length: total }, (_, i) => {
      const iso = paraISO(new Date(ano, mes, i + 1))
      return { chave: iso, iso, numero: i + 1 }
    }),
  ]
})

const mesesDoAno = computed(() =>
  MESES.map((nome, indice) => ({
    nome,
    indice,
    futuro: paraISO(new Date(anoVisivel.value, indice, 1)) > props.max,
  })),
)

const anosDaPagina = computed(() =>
  Array.from({ length: ANOS_POR_PAGINA }, (_, i) => {
    const ano = inicioBloco.value + i
    return { ano, futuro: ano > limite.value.getFullYear() }
  }),
)

const podeAvancar = computed(() => {
  if (modo.value === "anos")
    return inicioBloco.value + ANOS_POR_PAGINA <= limite.value.getFullYear()
  if (modo.value === "meses") return anoVisivel.value < limite.value.getFullYear()
  return paraISO(new Date(anoVisivel.value, mesVisivel.value.getMonth() + 1, 1)) <= props.max
})

const diaUnico = computed(() => props.inicio === props.fim)

/** Dias entre as pontas, contando as duas: 10→10 é 1 dia, não 0. */
const quantosDias = computed(() => {
  const ms = paraData(props.fim).getTime() - paraData(props.inicio).getTime()
  return Math.round(ms / 86_400_000) + 1
})

function avancar(passo: number) {
  const atual = mesVisivel.value
  if (modo.value === "dias") {
    mesVisivel.value = new Date(atual.getFullYear(), atual.getMonth() + passo, 1)
  } else {
    const anos = modo.value === "anos" ? passo * ANOS_POR_PAGINA : passo
    mesVisivel.value = new Date(atual.getFullYear() + anos, atual.getMonth(), 1)
  }
}

function subirNivel() {
  modo.value = modo.value === "dias" ? "meses" : "anos"
}

function escolherMes(indice: number) {
  mesVisivel.value = new Date(anoVisivel.value, indice, 1)
  modo.value = "dias"
}

function escolherAno(ano: number) {
  mesVisivel.value = new Date(ano, mesVisivel.value.getMonth(), 1)
  modo.value = "meses"
}

function alternar(ponta: Ponta) {
  editando.value = editando.value === ponta ? null : ponta
}

function aplicar(novoInicio: string, novoFim: string) {
  editando.value = null
  if (novoInicio !== props.inicio || novoFim !== props.fim) emit("selecionar", novoInicio, novoFim)
}

function escolher(iso: string) {
  // a outra ponta cede quando seria ultrapassada: arrastar o início pra frente do fim
  // vira dia único, em vez de recusar o clique sem explicar por quê
  if (editando.value === "inicio") aplicar(iso, iso > props.fim ? iso : props.fim)
  else aplicar(iso < props.inicio ? iso : props.inicio, iso)
}

function aoTeclar(evento: KeyboardEvent) {
  if (evento.key === "Escape") editando.value = null
}

onMounted(() => window.addEventListener("keydown", aoTeclar))
onBeforeUnmount(() => window.removeEventListener("keydown", aoTeclar))
</script>

<template>
  <div class="relative shrink-0">
    <!-- caixa de campo: a borda e o fundo branco dizem que ali se clica -->
    <div class="border-linha-forte rounded-lg border bg-white px-3.5 pt-2 pb-2.5 lg:w-83">
      <div class="mb-1.5 flex items-baseline justify-between gap-2">
        <p class="text-tinta-fraca text-[10px] font-semibold tracking-widest uppercase">
          Escolher escopo
        </p>
        <p v-if="!diaUnico" class="text-tinta-fraca text-[11px] tabular-nums">
          {{ quantosDias }} dias
        </p>
      </div>

      <!-- justify-between em vez de flex-1: cada ponta encolhe até o próprio conteúdo,
           então o vazio do meio (e a linha) não faz parte de alvo de clique nenhum -->
      <div class="relative flex items-start justify-between gap-2">
        <!-- a linha atravessa de ponta a ponta por trás; as bolinhas são opacas e tapam
             as duas extremidades, então ela nasce encostada nas duas.
             top-1.75: metade da bolinha (18px) menos metade do traço (4px) -->
        <span aria-hidden="true" class="absolute top-1.75 right-0 left-0 h-1 bg-violet-600"></span>

        <div class="relative flex min-w-0 flex-col items-start gap-1">
          <!-- aria-hidden + tabindex -1: atalho de mouse repetido. Quem navega por teclado
               ou leitor chega pelo botão da data, que faz a mesma coisa e tem nome -->
          <button
            type="button"
            tabindex="-1"
            aria-hidden="true"
            class="grid h-4.5 w-4.5 place-items-center rounded-full border-2 border-violet-600"
            :class="editando === 'inicio' ? 'bg-white' : 'bg-violet-600'"
            @click="alternar('inicio')"
          >
            <!-- miolo só na ponta em edição: vira alvo de rádio marcado -->
            <span
              v-if="editando === 'inicio'"
              class="h-1.5 w-1.5 rounded-full bg-violet-600"
            ></span>
          </button>

          <button
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="editando === 'inicio'"
            aria-label="Escolher o início do escopo"
            class="hover:bg-fundo -ml-1 truncate rounded-md px-1 py-0.5 text-sm font-semibold tabular-nums focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
            :class="editando === 'inicio' && 'bg-violet-50 text-violet-800'"
            @click="alternar('inicio')"
          >
            {{ formatarData(inicio) }}
          </button>
        </div>

        <div class="relative flex min-w-0 flex-col items-end gap-1">
          <button
            type="button"
            tabindex="-1"
            aria-hidden="true"
            class="grid h-4.5 w-4.5 place-items-center rounded-full border-2 border-violet-600"
            :class="editando === 'fim' ? 'bg-white' : 'bg-violet-600'"
            @click="alternar('fim')"
          >
            <span v-if="editando === 'fim'" class="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
          </button>

          <button
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="editando === 'fim'"
            aria-label="Escolher o fim do escopo"
            class="hover:bg-fundo -mr-1 truncate rounded-md px-1 py-0.5 text-sm font-semibold tabular-nums focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
            :class="editando === 'fim' && 'bg-violet-50 text-violet-800'"
            @click="alternar('fim')"
          >
            {{ formatarData(fim) }}
            <span v-if="fim === max" class="text-tinta-fraca font-medium">(hoje)</span>
          </button>
        </div>
      </div>
    </div>

    <template v-if="editando">
      <div class="fixed inset-0 z-20" @click="editando = null"></div>

      <div
        role="dialog"
        :aria-label="editando === 'inicio' ? 'Escolher o início' : 'Escolher o fim'"
        class="border-linha absolute top-full right-0 z-30 mt-2 w-76 rounded-xl border bg-white p-3 shadow-lg"
      >
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            :aria-label="modo === 'dias' ? 'Mês anterior' : 'Anterior'"
            class="text-tinta-suave hover:bg-fundo grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            @click="avancar(-1)"
          >
            <IconeNav nome="voltar" />
          </button>

          <button
            v-if="modo !== 'anos'"
            type="button"
            class="hover:bg-fundo min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 font-semibold"
            :aria-label="modo === 'dias' ? 'Escolher o mês' : 'Escolher o ano'"
            @click="subirNivel"
          >
            {{ rotulo }}
          </button>
          <span v-else class="min-w-0 flex-1 truncate px-2 text-center font-semibold">
            {{ rotulo }}
          </span>

          <button
            type="button"
            :aria-label="modo === 'dias' ? 'Próximo mês' : 'Próximo'"
            :disabled="!podeAvancar"
            class="text-tinta-suave hover:bg-fundo grid h-9 w-9 shrink-0 place-items-center rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
            @click="avancar(1)"
          >
            <IconeNav nome="avancar" />
          </button>
        </div>

        <template v-if="modo === 'dias'">
          <div
            class="text-tinta-fraca mt-2 grid grid-cols-7 text-center text-[11px] font-semibold uppercase"
          >
            <span v-for="(letra, i) in SEMANA" :key="i" class="py-1">{{ letra }}</span>
          </div>

          <div class="grid grid-cols-7 gap-y-0.5">
            <template v-for="celula in celulas" :key="celula.chave">
              <span v-if="!celula.iso"></span>
              <button
                v-else
                type="button"
                :disabled="celula.iso > max"
                :aria-pressed="celula.iso === emEdicao"
                class="grid h-9 place-items-center text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-30"
                :class="[
                  // o miolo pinta o fundo inteiro da célula pra faixa sair contínua;
                  // as pontas arredondam só do lado de fora
                  celula.iso > inicio && celula.iso < fim && 'bg-violet-50',
                  celula.iso === inicio && !diaUnico && 'rounded-l-lg bg-violet-50',
                  celula.iso === fim && !diaUnico && 'rounded-r-lg bg-violet-50',
                ]"
                @click="escolher(celula.iso)"
              >
                <span
                  class="grid h-9 w-9 place-items-center rounded-lg"
                  :class="
                    celula.iso === inicio || celula.iso === fim
                      ? 'bg-violet-600 font-semibold text-white'
                      : celula.iso === max
                        ? 'font-semibold text-violet-800 hover:bg-violet-100'
                        : 'hover:bg-fundo'
                  "
                >
                  {{ celula.numero }}
                </span>
              </button>
            </template>
          </div>
        </template>

        <div v-else-if="modo === 'meses'" class="mt-2 grid grid-cols-3 gap-1">
          <button
            v-for="mes in mesesDoAno"
            :key="mes.indice"
            type="button"
            :disabled="mes.futuro"
            class="h-11 rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-30"
            :class="
              anoVisivel === escolhido.ano && mes.indice === escolhido.mes
                ? 'bg-violet-600 font-semibold text-white'
                : 'hover:bg-fundo'
            "
            @click="escolherMes(mes.indice)"
          >
            {{ mes.nome }}
          </button>
        </div>

        <div v-else class="mt-2 grid grid-cols-3 gap-1">
          <button
            v-for="item in anosDaPagina"
            :key="item.ano"
            type="button"
            :disabled="item.futuro"
            class="h-11 rounded-lg text-sm font-medium tabular-nums disabled:cursor-not-allowed disabled:opacity-30"
            :class="
              item.ano === escolhido.ano
                ? 'bg-violet-600 font-semibold text-white'
                : 'hover:bg-fundo'
            "
            @click="escolherAno(item.ano)"
          >
            {{ item.ano }}
          </button>
        </div>

        <button
          type="button"
          class="border-linha text-tinta-suave hover:bg-fundo mt-2 h-10 w-full rounded-lg border text-sm font-semibold"
          @click="aplicar(max, max)"
        >
          Hoje
        </button>
      </div>
    </template>
  </div>
</template>
