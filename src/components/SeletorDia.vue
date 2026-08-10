<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { formatarData } from "../utils/data"
import IconeNav from "./IconeNav.vue"

const props = defineProps<{ dia: string; max: string }>()
const emit = defineEmits<{ selecionar: [string] }>()

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const ANOS_POR_PAGINA = 12

type Modo = "dias" | "meses" | "anos"

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

const aberto = ref(false)
const modo = ref<Modo>("dias")
const mesVisivel = ref(paraData(props.dia))

watch(aberto, (estaAberto) => {
  if (estaAberto) {
    modo.value = "dias"
    mesVisivel.value = paraData(props.dia)
  }
})

const limite = computed(() => paraData(props.max))
const anoVisivel = computed(() => mesVisivel.value.getFullYear())

const escolhido = computed(() => {
  const data = paraData(props.dia)
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

function escolher(iso: string) {
  aberto.value = false
  if (iso !== props.dia) emit("selecionar", iso)
}

function aoTeclar(evento: KeyboardEvent) {
  if (evento.key === "Escape") aberto.value = false
}

onMounted(() => window.addEventListener("keydown", aoTeclar))
onBeforeUnmount(() => window.removeEventListener("keydown", aoTeclar))
</script>

<template>
  <div class="relative shrink-0">
    <button
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="aberto"
      class="border-linha-forte flex h-12 w-full items-center gap-2.5 rounded-lg border bg-white px-3.5 font-semibold tabular-nums focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none lg:h-11 lg:w-auto"
      @click="aberto = !aberto"
    >
      <IconeNav nome="calendario" class="text-violet-600" />
      {{ formatarData(dia) }}
      <span v-if="dia === max" class="text-tinta-fraca font-medium">(hoje)</span>
    </button>

    <template v-if="aberto">
      <div class="fixed inset-0 z-20" @click="aberto = false"></div>

      <div
        role="dialog"
        aria-label="Escolher o dia"
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

          <div class="grid grid-cols-7 gap-0.5">
            <template v-for="celula in celulas" :key="celula.chave">
              <span v-if="!celula.iso"></span>
              <button
                v-else
                type="button"
                :disabled="celula.iso > max"
                :aria-pressed="celula.iso === dia"
                class="grid h-9 place-items-center rounded-lg text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-30"
                :class="
                  celula.iso === dia
                    ? 'bg-violet-600 font-semibold text-white'
                    : celula.iso === max
                      ? 'font-semibold text-violet-800 hover:bg-violet-50'
                      : 'hover:bg-fundo'
                "
                @click="escolher(celula.iso)"
              >
                {{ celula.numero }}
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
          @click="escolher(max)"
        >
          Hoje
        </button>
      </div>
    </template>
  </div>
</template>
