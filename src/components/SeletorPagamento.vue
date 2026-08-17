<script setup lang="ts">
import { computed } from "vue"
import IconeNav from "./IconeNav.vue"
import { ROTULO_PAGAMENTO, ehFormaAVista } from "../utils/pagamento"
import type { OpcaoPagamento } from "../types/api"

interface Opcao {
  valor: OpcaoPagamento
  cor: string
  ativo: string
}

const OPCOES: Opcao[] = [
  { valor: "pix", cor: "text-pix", ativo: "border-2 border-pix bg-teal-50" },
  { valor: "debito", cor: "text-debito", ativo: "border-2 border-debito bg-blue-50" },
  { valor: "credito", cor: "text-credito", ativo: "border-2 border-credito bg-violet-50" },
  { valor: "dinheiro", cor: "text-dinheiro", ativo: "border-2 border-dinheiro bg-green-50" },
  { valor: "conta", cor: "text-conta", ativo: "border-2 border-conta bg-amber-50" },
]

const escolhida = defineModel<OpcaoPagamento | null>({ required: true })

// soAVista: no fechamento de conta "Conta" não é opção — a dívida já existe
const props = defineProps<{ desabilitado?: boolean; soAVista?: boolean }>()

const opcoes = computed(() =>
  props.soAVista ? OPCOES.filter((opcao) => ehFormaAVista(opcao.valor)) : OPCOES,
)

const colunas = computed(() => (props.soAVista ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-5"))
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <!-- cabeçalho fora do fieldset: disabled nele alcança todo filho, e a ação do slot
         não tem por que ser desligada junto com a escolha do pagamento.
         Virou <p> em vez de <legend>: quem nomeia o grupo é o aria-label do radiogroup -->
    <div class="mb-2.5 flex items-center justify-between gap-3">
      <p class="text-tinta-fraca text-[11px] font-semibold tracking-widest uppercase">
        Forma de pagamento
      </p>
      <slot name="acao" />
    </div>

    <fieldset :disabled="desabilitado" class="disabled:opacity-50 disabled:grayscale">
      <div role="radiogroup" aria-label="Forma de pagamento" class="grid gap-2" :class="colunas">
        <button
          v-for="opcao in opcoes"
          :key="opcao.valor"
          type="button"
          role="radio"
          :aria-checked="escolhida === opcao.valor"
          class="flex min-h-19 flex-col items-center justify-center gap-1.5 rounded-xl focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
          :class="[
            opcao.cor,
            escolhida === opcao.valor ? opcao.ativo : 'border-linha border bg-white',
          ]"
          @click="escolhida = opcao.valor"
        >
          <IconeNav :nome="opcao.valor" />
          <span class="text-xs font-semibold" :class="escolhida !== opcao.valor && 'text-tinta'">
            {{ ROTULO_PAGAMENTO[opcao.valor] }}
          </span>
        </button>
      </div>
    </fieldset>
  </div>
</template>
