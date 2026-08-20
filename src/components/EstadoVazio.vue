<script setup lang="ts">
/**
 * Estado vazio: caixa pontilhada com título e uma explicação no slot.
 */
import IconeNav from "./IconeNav.vue"

// icone é opcional: nem toda tela vazia merece um desenho no meio
defineProps<{ titulo: string; icone?: string }>()
</script>

<template>
  <div
    class="border-linha-forte flex flex-col items-center gap-2.5 rounded-xl border border-dashed p-8 text-center"
  >
    <div
      v-if="icone"
      class="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-400"
    >
      <IconeNav :nome="icone" />
    </div>

    <p class="font-semibold">{{ titulo }}</p>
    <p class="text-tinta-suave max-w-70 text-sm"><slot /></p>

    <slot name="acao" />
  </div>
</template>
