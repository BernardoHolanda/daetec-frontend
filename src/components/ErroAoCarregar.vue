<script setup lang="ts">
defineProps<{ titulo: string }>()

const emit = defineEmits<{ tentar: [] }>()
</script>

<template>
  <div class="border-linha flex flex-col items-start gap-3 rounded-xl border bg-white p-6">
    <div>
      <p class="font-semibold">{{ titulo }}</p>
      <p class="text-tinta-suave mt-1 text-sm">Verifique a conexão e tente de novo.</p>
    </div>
    <button
      type="button"
      class="h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
      @click="emit('tentar')"
    >
      Tentar novamente
    </button>
  </div>
</template>
