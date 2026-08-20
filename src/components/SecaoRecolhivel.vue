<script setup lang="ts">
import IconeNav from "./IconeNav.vue"

defineProps<{ titulo: string; subtitulo?: string }>()

// defineModel com default: quem não passa v-model ganha a seção aberta
const aberto = defineModel<boolean>({ default: true })
</script>

<template>
  <section class="flex flex-col gap-2.5 lg:gap-3">
    <div class="flex items-center justify-between gap-3">
      <button
        type="button"
        :aria-expanded="aberto"
        class="hover:bg-fundo -mx-1.5 flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
        @click="aberto = !aberto"
      >
        <!-- a mesma seta girando: fechado aponta pro lado, aberto aponta pra baixo,
             então o ícone diz pra onde o conteúdo vai, não o que ele é -->
        <IconeNav
          nome="recolher"
          class="text-tinta-suave transition-transform"
          :class="!aberto && '-rotate-90'"
        />
        <span class="min-w-0">
          <span class="block truncate font-semibold lg:text-[17px]">{{ titulo }}</span>
          <span v-if="subtitulo" class="text-tinta-suave block truncate text-sm">
            {{ subtitulo }}
          </span>
        </span>
      </button>

      <!-- some junto com o conteúdo: controle de lista fechada não tem o que controlar -->
      <slot v-if="aberto" name="acao" />
    </div>

    <slot v-if="aberto" />
  </section>
</template>
