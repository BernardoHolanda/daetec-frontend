<script setup lang="ts">
import { CADASTROS } from "../router/navegacao"
import IconeNav from "../components/IconeNav.vue"
</script>

<template>
  <main class="flex flex-1 flex-col gap-5 p-6">
    <h1 class="text-[22px] font-semibold tracking-tight">Cadastros</h1>

    <nav class="flex flex-col gap-2">
      <RouterLink
        v-for="item in CADASTROS"
        :key="item.nome"
        :to="{ name: item.nome }"
        class="border-linha flex min-h-14 items-center gap-3 rounded-xl border bg-white px-4 font-medium"
      >
        <IconeNav :nome="item.nome" />
        {{ item.rotulo }}
      </RouterLink>
    </nav>
  </main>
</template>
