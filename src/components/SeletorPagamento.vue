<script setup lang="ts">
import IconeNav from "./IconeNav.vue"
import type { OpcaoPagamento } from "../types/api"

interface Opcao {
  valor: OpcaoPagamento
  rotulo: string
  cor: string
  ativo: string
}

const OPCOES: Opcao[] = [
  { valor: "pix", rotulo: "Pix", cor: "text-pix", ativo: "border-2 border-pix bg-teal-50" },
  {
    valor: "debito",
    rotulo: "Débito",
    cor: "text-debito",
    ativo: "border-2 border-debito bg-blue-50",
  },
  {
    valor: "credito",
    rotulo: "Crédito",
    cor: "text-credito",
    ativo: "border-2 border-credito bg-violet-50",
  },
  {
    valor: "dinheiro",
    rotulo: "Dinheiro",
    cor: "text-dinheiro",
    ativo: "border-2 border-dinheiro bg-green-50",
  },
  {
    valor: "conta",
    rotulo: "Conta",
    cor: "text-conta",
    ativo: "border-2 border-conta bg-amber-50",
  },
]

const escolhida = defineModel<OpcaoPagamento | null>({ required: true })

defineProps<{ desabilitado?: boolean }>()
</script>

<template>
  <fieldset
    :disabled="desabilitado"
    class="flex flex-col gap-2.5 disabled:opacity-50 disabled:grayscale"
  >
    <legend class="text-tinta-fraca mb-2.5 text-[11px] font-semibold tracking-widest uppercase">
      Forma de pagamento
    </legend>

    <div role="radiogroup" aria-label="Forma de pagamento" class="grid grid-cols-5 gap-2">
      <button
        v-for="opcao in OPCOES"
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
          {{ opcao.rotulo }}
        </span>
      </button>
    </div>
  </fieldset>
</template>
