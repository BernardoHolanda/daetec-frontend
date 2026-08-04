<script setup lang="ts">
import { ref, watch } from "vue"

const props = defineProps<{
  aberto: boolean
  titulo: string
  confirmar: string
  carregando?: boolean
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
  <dialog
    ref="dialogo"
    class="border-linha m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border bg-white p-6 backdrop:bg-tinta/40"
    @close="emit('fechar')"
    @cancel.prevent="emit('fechar')"
  >
    <h2 class="text-xl font-semibold tracking-tight">{{ titulo }}</h2>

    <div class="mt-4">
      <slot />
    </div>

    <div class="mt-6 flex justify-end gap-2">
      <button
        type="button"
        :disabled="carregando"
        class="border-linha-forte text-tinta-suave h-11 rounded-lg border px-4 font-semibold disabled:opacity-50"
        @click="emit('fechar')"
      >
        Voltar
      </button>
      <button
        type="button"
        :disabled="carregando"
        class="h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none disabled:cursor-wait disabled:bg-violet-700"
        @click="emit('confirmar')"
      >
        {{ carregando ? "Gravando..." : confirmar }}
      </button>
    </div>
  </dialog>
</template>
