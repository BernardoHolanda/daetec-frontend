<script setup lang="ts">
const props = defineProps<{ clienteId: string }>()
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col gap-2 p-4 lg:p-6">
    <RouterLink :to="{ name: 'contas' }" class="text-sm font-semibold text-violet-700">
      Contas em aberto
    </RouterLink>
    <h1 class="text-[22px] font-semibold tracking-tight">Conta #{{ props.clienteId }}</h1>
    <p class="text-tinta-suave text-sm">Em construção — passo 2 da aula 48.</p>
  </main>
</template>
