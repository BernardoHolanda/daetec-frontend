<script setup lang="ts">
/**
 * Texto que vira campo ao clicar: parece rótulo, aceita digitação.
 *
 * Guarda um rascunho e só avisa o pai no Enter ou ao sair — aplicar a cada tecla faria
 * "12" passar por "1". Esc desfaz.
 */
import { nextTick, ref, watch } from "vue"

const props = defineProps<{ valor: string; rotulo: string }>()
const emit = defineEmits<{ confirmar: [texto: string] }>()

const rascunho = ref(props.valor)

watch(
  () => props.valor,
  (novo) => (rascunho.value = novo),
)

async function confirmar() {
  emit("confirmar", rascunho.value)
  // se o pai recusar o texto, `valor` não muda e o watch não dispara — então o campo
  // volta sozinho ao que era, em vez de ficar exibindo algo que não foi aceito
  await nextTick()
  rascunho.value = props.valor
}

function cancelar(evento: KeyboardEvent) {
  rascunho.value = props.valor
  ;(evento.target as HTMLInputElement).blur()
}
</script>

<template>
  <!-- sem borda até o hover/foco: parece texto, mas o cursor e o realce dizem que dá pra
       digitar. inputmode numeric abre o teclado de números no celular -->
  <input
    v-model="rascunho"
    type="text"
    inputmode="numeric"
    :aria-label="rotulo"
    class="hover:border-linha-forte rounded-lg border border-transparent bg-transparent px-1 py-0.5 font-semibold tabular-nums focus:border-violet-300 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
    @focus="($event.target as HTMLInputElement).select()"
    @keydown.enter="($event.target as HTMLInputElement).blur()"
    @keydown.esc="cancelar"
    @blur="confirmar"
  />
</template>
