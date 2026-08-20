<script setup lang="ts">
/**
 * Índice dos cadastros, só no celular — no desktop eles moram na lateral.
 */
import { computed } from "vue"
import { useUsuarioStore } from "../stores/usuario"
import { CADASTROS, visivelPara } from "../router/navegacao"
import IconeNav from "../components/IconeNav.vue"

const usuarioStore = useUsuarioStore()

// mesma regra da lateral: o vendedor só enxerga Clientes aqui
const itens = computed(() => CADASTROS.filter((item) => visivelPara(item, usuarioStore.isAdmin)))
</script>

<template>
  <main class="flex flex-1 flex-col gap-5 p-6">
    <h1 class="text-[22px] font-semibold tracking-tight">Cadastros</h1>

    <nav class="flex flex-col gap-2">
      <RouterLink
        v-for="item in itens"
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
