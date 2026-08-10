<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { listarProdutos } from "../services/produtos"
import { normalizar } from "../utils/texto"
import type { Produto } from "../types/api"
import CampoBusca from "../components/CampoBusca.vue"
import ErroAoCarregar from "../components/ErroAoCarregar.vue"
import EstadoVazio from "../components/EstadoVazio.vue"

const COLUNAS = "lg:grid-cols-[1fr_220px_180px]"

const produtos = ref<Produto[]>([])
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")

const visiveis = computed(() => {
  const termo = normalizar(busca.value.trim())
  const achados = termo
    ? produtos.value.filter((p) => normalizar(p.nome).includes(termo))
    : produtos.value
  return [...achados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
})

const esgotados = computed(() => produtos.value.filter((p) => p.estoque === 0).length)

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    produtos.value = await listarProdutos()
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
      <div>
        <h1 class="text-[22px] font-semibold tracking-tight">Estoque</h1>
        <p v-if="!carregando && !erro" class="text-tinta-suave mt-1 text-sm">
          {{ produtos.length }} {{ produtos.length === 1 ? "produto" : "produtos" }}
          <template v-if="esgotados > 0">
            ·
            <span class="font-semibold text-amber-800">
              {{ esgotados }} {{ esgotados === 1 ? "esgotado" : "esgotados" }}
            </span>
          </template>
        </p>
      </div>

      <CampoBusca v-model="busca" rotulo="Buscar produto" class="lg:w-80" />
    </div>

    <ul v-if="carregando" aria-hidden="true" class="flex flex-col gap-2">
      <li
        v-for="n in 5"
        :key="n"
        class="border-linha flex h-16 animate-pulse items-center justify-between rounded-xl border bg-white p-3.5"
      >
        <span class="bg-linha h-5 w-40 rounded"></span>
        <span class="bg-linha h-5 w-20 rounded"></span>
      </li>
    </ul>

    <ErroAoCarregar
      v-else-if="erro"
      titulo="Não foi possível carregar o estoque"
      @tentar="carregar"
    />

    <EstadoVazio
      v-else-if="produtos.length === 0"
      icone="estoque"
      titulo="Nenhum produto cadastrado"
    >
      O estoque acompanha o que está em Produtos — cadastre um item por lá primeiro.
    </EstadoVazio>

    <p v-else-if="visiveis.length === 0" class="text-tinta-suave py-10 text-center">
      Nenhum produto com “{{ busca.trim() }}”.
    </p>

    <template v-else>
      <div
        class="border-linha text-tinta-fraca bg-fundo hidden rounded-t-xl border border-b-0 px-5 py-3 text-[11px] font-semibold tracking-widest uppercase lg:grid lg:gap-3"
        :class="COLUNAS"
      >
        <span>Produto</span>
        <span>Dono</span>
        <span class="text-right">Em estoque</span>
      </div>

      <ul
        class="lg:border-linha flex flex-col gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-b-xl lg:border lg:bg-white"
      >
        <li
          v-for="produto in visiveis"
          :key="produto.id"
          class="border-linha lg:border-linha flex min-h-16 items-center justify-between gap-3 rounded-xl border bg-white p-3.5 lg:grid lg:gap-3 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-3 lg:last:border-b-0"
          :class="COLUNAS"
        >
          <div class="flex min-w-0 flex-col lg:contents">
            <span class="min-w-0 truncate font-semibold">{{ produto.nome }}</span>
            <span class="text-tinta-suave min-w-0 truncate text-[13px] lg:text-[15px]">
              {{ produto.vendedor.nome }}
            </span>
          </div>

          <!-- mesmos três estados da tela de Produtos: sem controle, esgotado, contagem -->
          <span
            v-if="produto.estoque === null"
            class="text-tinta-fraca shrink-0 text-[13px] lg:text-right lg:text-sm"
          >
            Sem controle
          </span>
          <span
            v-else-if="produto.estoque === 0"
            class="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[13px] font-semibold text-amber-800 lg:justify-self-end"
          >
            Esgotado
          </span>
          <span v-else class="shrink-0 font-semibold tabular-nums lg:text-right">
            {{ produto.estoque }}
            <span class="text-tinta-fraca font-normal">
              {{ produto.estoque === 1 ? "unidade" : "unidades" }}
            </span>
          </span>
        </li>
      </ul>
    </template>
  </main>
</template>
