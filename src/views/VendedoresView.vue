<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import {
  atualizarVendedor,
  criarVendedor,
  deletarVendedor,
  listarVendedores,
} from "../services/vendedores"
import { normalizar } from "../utils/texto"
import { mensagemDoErro } from "../utils/erro"
import type { Vendedor } from "../types/api"
import CampoBusca from "../components/CampoBusca.vue"
import ErroAoCarregar from "../components/ErroAoCarregar.vue"
import EstadoVazio from "../components/EstadoVazio.vue"
import ModalConfirmacao from "../components/ModalConfirmacao.vue"

const vendedores = ref<Vendedor[]>([])
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")

const modalAberto = ref(false)
// null = criando; um vendedor = editando aquele
const emEdicao = ref<Vendedor | null>(null)
const nome = ref("")
const salvando = ref(false)
const erroAoSalvar = ref("")

const paraRemover = ref<Vendedor | null>(null)
const removendo = ref(false)
const erroAoRemover = ref("")

const visiveis = computed(() => {
  const termo = normalizar(busca.value.trim())
  const achados = termo
    ? vendedores.value.filter((v) => normalizar(v.nome).includes(termo))
    : vendedores.value
  return [...achados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
})

const nomeValido = computed(() => nome.value.trim().length > 0)

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    vendedores.value = await listarVendedores()
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

function abrir(vendedor: Vendedor | null) {
  emEdicao.value = vendedor
  nome.value = vendedor?.nome ?? ""
  erroAoSalvar.value = ""
  modalAberto.value = true
}

async function salvar() {
  if (!nomeValido.value) return
  const texto = nome.value.trim()
  salvando.value = true
  erroAoSalvar.value = ""
  try {
    if (emEdicao.value) await atualizarVendedor(emEdicao.value.id, texto)
    else await criarVendedor(texto)
    modalAberto.value = false
    await carregar()
  } catch (e) {
    // o backend já explica o 409 ("Já existe um registro com esses dados")
    erroAoSalvar.value = mensagemDoErro(e, "Não foi possível salvar. Tente de novo.")
  } finally {
    salvando.value = false
  }
}

function pedirRemocao(vendedor: Vendedor) {
  paraRemover.value = vendedor
  erroAoRemover.value = ""
}

async function confirmarRemocao() {
  if (paraRemover.value === null) return
  removendo.value = true
  erroAoRemover.value = ""
  try {
    await deletarVendedor(paraRemover.value.id)
    paraRemover.value = null
    await carregar()
  } catch (e) {
    // 409 quando o vendedor tem produto ou item vendido: a FK recusa
    erroAoRemover.value = mensagemDoErro(e, "Não foi possível remover. Tente de novo.")
  } finally {
    removendo.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
      <div>
        <h1 class="text-[22px] font-semibold tracking-tight">Vendedores</h1>
        <p class="text-tinta-suave mt-1 text-sm">
          Donos da mercadoria — todo produto pertence a um deles
        </p>
      </div>

      <div class="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <CampoBusca v-model="busca" rotulo="Buscar vendedor" class="lg:w-80" />

        <button
          type="button"
          class="h-12 shrink-0 rounded-lg bg-violet-600 px-4.5 font-semibold text-white hover:bg-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none"
          @click="abrir(null)"
        >
          + Novo vendedor
        </button>
      </div>
    </div>

    <ul v-if="carregando" aria-hidden="true" class="flex flex-col gap-2">
      <li
        v-for="n in 4"
        :key="n"
        class="border-linha flex h-16 animate-pulse items-center rounded-xl border bg-white p-3.5"
      >
        <span class="bg-linha h-5 w-40 rounded"></span>
      </li>
    </ul>

    <ErroAoCarregar
      v-else-if="erro"
      titulo="Não foi possível carregar os vendedores"
      @tentar="carregar"
    />

    <EstadoVazio
      v-else-if="vendedores.length === 0"
      icone="vendedores"
      titulo="Nenhum vendedor cadastrado"
    >
      Cadastre quem traz mercadoria antes de cadastrar produtos.
      <template #acao>
        <button
          type="button"
          class="h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
          @click="abrir(null)"
        >
          Novo vendedor
        </button>
      </template>
    </EstadoVazio>

    <p v-else-if="visiveis.length === 0" class="text-tinta-suave py-10 text-center">
      Nenhum vendedor com “{{ busca.trim() }}”.
    </p>

    <ul
      v-else
      class="lg:border-linha flex flex-col gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:bg-white"
    >
      <li
        v-for="vendedor in visiveis"
        :key="vendedor.id"
        class="border-linha lg:border-linha flex min-h-16 items-center justify-between gap-3 rounded-xl border bg-white p-3.5 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-3 lg:last:border-b-0"
      >
        <span class="min-w-0 truncate font-semibold">{{ vendedor.nome }}</span>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="h-9 rounded-lg border border-violet-300 px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
            @click="abrir(vendedor)"
          >
            Editar
          </button>
          <button
            type="button"
            class="h-9 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:outline-none"
            @click="pedirRemocao(vendedor)"
          >
            Remover
          </button>
        </div>
      </li>
    </ul>

    <ModalConfirmacao
      :aberto="modalAberto"
      :titulo="emEdicao ? 'Editar vendedor' : 'Novo vendedor'"
      confirmar="Salvar"
      :carregando="salvando"
      :desabilitado="!nomeValido"
      @fechar="modalAberto = false"
      @confirmar="salvar"
    >
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold">Nome</span>
        <input
          v-model="nome"
          type="text"
          autocomplete="off"
          class="border-linha-forte h-12 w-full rounded-lg border px-3.5 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
          @keyup.enter="salvar"
        />
        <span class="text-tinta-fraca text-[13px]">
          O nome é gravado em maiúsculas e precisa ser único.
        </span>
      </label>

      <p
        v-if="erroAoSalvar"
        role="alert"
        class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
      >
        {{ erroAoSalvar }}
      </p>
    </ModalConfirmacao>

    <ModalConfirmacao
      :aberto="paraRemover !== null"
      titulo="Remover vendedor"
      confirmar="Remover"
      perigo
      :carregando="removendo"
      @fechar="paraRemover = null"
      @confirmar="confirmarRemocao"
    >
      <p class="leading-snug">
        Remover <b>{{ paraRemover?.nome }}</b> do cadastro? Quem já tem produto ou venda no nome não
        pode ser removido — o histórico depende dele.
      </p>

      <p
        v-if="erroAoRemover"
        role="alert"
        class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
      >
        {{ erroAoRemover }}
      </p>
    </ModalConfirmacao>
  </main>
</template>
