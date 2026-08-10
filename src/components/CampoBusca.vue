<script setup lang="ts">
import IconeNav from "./IconeNav.vue"

// rotulo serve de placeholder e de nome acessível — são a mesma frase em todas as telas
defineProps<{ rotulo: string }>()

const termo = defineModel<string>({ required: true })
</script>

<template>
  <label class="relative block">
    <span class="sr-only">{{ rotulo }}</span>
    <IconeNav
      nome="busca"
      class="text-tinta-fraca pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
    />
    <input
      v-model="termo"
      type="search"
      :placeholder="rotulo"
      class="border-linha-forte h-12 w-full rounded-lg border bg-white pr-3.5 pl-11 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
    />
  </label>
</template>
