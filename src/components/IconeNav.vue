<script setup lang="ts">
defineProps<{ nome: string }>()
</script>

<template>
  <!-- stroke="currentColor": o ícone herda a cor do texto, então o estado
       ativo/inativo é resolvido só com classe de cor no elemento pai -->
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="h-5 w-5 shrink-0"
    aria-hidden="true"
  >
    <template v-if="nome === 'vender'">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M12 8v8M8 12h8" />
    </template>
    <template v-else-if="nome === 'contas'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </template>
    <template v-else-if="nome === 'produtos'">
      <path d="M4 7l8-4 8 4v10l-8 4-8-4z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </template>
    <template v-else-if="nome === 'clientes'">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0112 0M17 11a3 3 0 100-6M18 20a5.5 5.5 0 00-2-4.3" />
    </template>
    <template v-else-if="nome === 'relatorio'">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 15v-3M12 15v-6M16 15v-4" />
    </template>
    <template v-else-if="nome === 'perfil'">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0114 0" />
    </template>
    <template v-else-if="nome === 'sair'">
      <path d="M14 4H7a2 2 0 00-2 2v12a2 2 0 002 2h7M17 8l4 4-4 4M21 12H10" />
    </template>
  </svg>
</template>
