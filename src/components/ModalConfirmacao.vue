<script setup lang="ts">
import { ref, watch } from "vue"

const props = defineProps<{
  aberto: boolean
  titulo: string
  confirmar: string
  carregando?: boolean
  desabilitado?: boolean
  // ação destrutiva: o botão de confirmar vira vermelho
  perigo?: boolean
}>()

const emit = defineEmits<{ fechar: []; confirmar: [] }>()

const dialogo = ref<HTMLDialogElement | null>(null)

watch(
  () => props.aberto,
  (aberto) => {
    if (aberto) dialogo.value?.showModal()
    else dialogo.value?.close()
  },
)
</script>

<template>
  <!-- folha colada embaixo no celular, caixa centrada no desktop: mt-auto empurra
       o dialog pro fim da viewport, e o m-auto do lg volta a centrar -->
  <dialog
    ref="dialogo"
    class="border-linha backdrop:bg-tinta/40 m-0 mt-auto w-full max-w-none rounded-t-2xl border bg-white p-4 pb-6 lg:m-auto lg:w-[min(28rem,calc(100%-2rem))] lg:rounded-2xl lg:p-6"
    @close="emit('fechar')"
    @cancel.prevent="emit('fechar')"
  >
    <div class="bg-linha-forte mx-auto mb-3.5 h-1.5 w-11 rounded-full lg:hidden"></div>

    <h2 class="text-[19px] font-semibold tracking-tight lg:text-xl">{{ titulo }}</h2>

    <div class="mt-4">
      <slot />
    </div>

    <div class="mt-5 flex gap-2 lg:mt-6">
      <button
        type="button"
        :disabled="carregando"
        class="bg-linha text-tinta h-13 w-28 shrink-0 rounded-lg font-semibold disabled:opacity-50 lg:w-33"
        @click="emit('fechar')"
      >
        Voltar
      </button>
      <button
        type="button"
        :disabled="carregando || desabilitado"
        class="h-13 flex-1 rounded-lg text-[17px] font-semibold text-white focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          perigo
            ? 'bg-red-700 hover:bg-red-800 focus-visible:ring-red-300'
            : 'bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-300'
        "
        @click="emit('confirmar')"
      >
        {{ carregando ? "Gravando..." : confirmar }}
      </button>
    </div>
  </dialog>
</template>
