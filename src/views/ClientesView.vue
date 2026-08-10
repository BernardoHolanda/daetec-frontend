<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import {
  atualizarCliente,
  criarCliente,
  deletarCliente,
  listarClientes,
} from "../services/clientes"
import { listarContas } from "../services/contas"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { normalizar } from "../utils/texto"
import { mensagemDoErro } from "../utils/erro"
import type { Cliente } from "../types/api"
import IconeNav from "../components/IconeNav.vue"
import ModalConfirmacao from "../components/ModalConfirmacao.vue"

const COLUNAS = "lg:grid-cols-[1fr_180px_160px]"

const clientes = ref<Cliente[]>([])
// cliente_id → centavos em aberto; quem não está no mapa não deve nada
const dividas = ref(new Map<number, number>())
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")

const modalAberto = ref(false)
// null = criando; um cliente = editando aquele
const emEdicao = ref<Cliente | null>(null)
const nome = ref("")
const salvando = ref(false)
const erroAoSalvar = ref("")

const paraRemover = ref<Cliente | null>(null)
const removendo = ref(false)
const erroAoRemover = ref("")

const visiveis = computed(() => {
  const termo = normalizar(busca.value.trim())
  const achados = termo
    ? clientes.value.filter((c) => normalizar(c.nome).includes(termo))
    : clientes.value
  return [...achados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
})

const nomeValido = computed(() => nome.value.trim().length > 0)

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    const [lista, contas] = await Promise.all([listarClientes(), listarContas()])
    clientes.value = lista
    dividas.value = new Map(contas.contas.map((c) => [c.cliente_id, paraCentavos(c.total)]))
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

function abrir(cliente: Cliente | null) {
  emEdicao.value = cliente
  nome.value = cliente?.nome ?? ""
  erroAoSalvar.value = ""
  modalAberto.value = true
}

async function salvar() {
  if (!nomeValido.value) return
  const texto = nome.value.trim()
  salvando.value = true
  erroAoSalvar.value = ""
  try {
    if (emEdicao.value) await atualizarCliente(emEdicao.value.id, texto)
    else await criarCliente(texto)
    modalAberto.value = false
    await carregar()
  } catch (e) {
    erroAoSalvar.value = mensagemDoErro(e, "Não foi possível salvar. Tente de novo.")
  } finally {
    salvando.value = false
  }
}

function pedirRemocao(cliente: Cliente) {
  paraRemover.value = cliente
  erroAoRemover.value = ""
}

async function confirmarRemocao() {
  if (paraRemover.value === null) return
  removendo.value = true
  erroAoRemover.value = ""
  try {
    await deletarCliente(paraRemover.value.id)
    paraRemover.value = null
    await carregar()
  } catch (e) {
    // 409 quando o cliente tem venda — inclusive já paga: o histórico referencia ele
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
        <h1 class="text-[22px] font-semibold tracking-tight">Clientes</h1>
        <p class="text-tinta-suave mt-1 text-sm">Quem pode consumir na conta</p>
      </div>

      <div class="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <label class="relative block lg:w-80">
          <span class="sr-only">Buscar cliente</span>
          <IconeNav
            nome="busca"
            class="text-tinta-fraca pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          />
          <input
            v-model="busca"
            type="search"
            placeholder="Buscar cliente"
            class="border-linha-forte h-12 w-full rounded-lg border bg-white pr-3.5 pl-11 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
          />
        </label>

        <button
          type="button"
          class="h-12 shrink-0 rounded-lg bg-violet-600 px-4.5 font-semibold text-white hover:bg-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none"
          @click="abrir(null)"
        >
          + Novo cliente
        </button>
      </div>
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

    <div
      v-else-if="erro"
      class="border-linha flex flex-col items-start gap-3 rounded-xl border bg-white p-6"
    >
      <div>
        <p class="font-semibold">Não foi possível carregar os clientes</p>
        <p class="text-tinta-suave mt-1 text-sm">Verifique a conexão e tente de novo.</p>
      </div>
      <button
        type="button"
        class="h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
        @click="carregar"
      >
        Tentar novamente
      </button>
    </div>

    <div
      v-else-if="clientes.length === 0"
      class="border-linha-forte flex flex-col items-center gap-2.5 rounded-xl border border-dashed p-8 text-center"
    >
      <div class="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-400">
        <IconeNav nome="clientes" />
      </div>
      <p class="font-semibold">Nenhum cliente cadastrado</p>
      <p class="text-tinta-suave max-w-60 text-sm">
        Cadastre alguém para poder registrar vendas na modalidade “Conta”.
      </p>
      <button
        type="button"
        class="mt-1 h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
        @click="abrir(null)"
      >
        Novo cliente
      </button>
    </div>

    <p v-else-if="visiveis.length === 0" class="text-tinta-suave py-10 text-center">
      Nenhum cliente com “{{ busca.trim() }}”.
    </p>

    <template v-else>
      <div
        class="border-linha text-tinta-fraca bg-fundo hidden rounded-t-xl border border-b-0 px-5 py-3 text-[11px] font-semibold tracking-widest uppercase lg:grid lg:gap-3"
        :class="COLUNAS"
      >
        <span>Cliente</span>
        <span class="text-right">Em aberto</span>
        <span class="text-right">Ações</span>
      </div>

      <ul
        class="lg:border-linha flex flex-col gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-b-xl lg:border lg:bg-white"
      >
        <li
          v-for="cliente in visiveis"
          :key="cliente.id"
          class="border-linha lg:border-linha flex min-h-19 items-center justify-between gap-3 rounded-xl border bg-white p-3.5 lg:grid lg:gap-3 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-3 lg:last:border-b-0"
          :class="COLUNAS"
        >
          <span class="min-w-0 truncate font-semibold">{{ cliente.nome }}</span>

          <span v-if="dividas.get(cliente.id)" class="shrink-0 text-right">
            <span class="block font-bold text-amber-800 tabular-nums">
              {{ formatarBRL(dividas.get(cliente.id) ?? 0) }}
            </span>
            <span class="text-tinta-fraca text-[10px] font-semibold tracking-widest uppercase">
              em aberto
            </span>
          </span>
          <span v-else class="text-tinta-fraca shrink-0 text-sm lg:text-right">Sem conta</span>

          <div class="flex shrink-0 gap-2 lg:justify-self-end">
            <button
              type="button"
              class="h-9 rounded-lg border border-violet-300 px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
              @click="abrir(cliente)"
            >
              Editar
            </button>
            <button
              type="button"
              class="h-9 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:outline-none"
              @click="pedirRemocao(cliente)"
            >
              Remover
            </button>
          </div>
        </li>
      </ul>
    </template>

    <ModalConfirmacao
      :aberto="modalAberto"
      :titulo="emEdicao ? 'Editar cliente' : 'Novo cliente'"
      confirmar="Salvar"
      :carregando="salvando"
      :desabilitado="!nomeValido"
      @fechar="modalAberto = false"
      @confirmar="salvar"
    >
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold">Nome completo</span>
        <input
          v-model="nome"
          type="text"
          autocomplete="off"
          placeholder="Ex.: Larissa Prado"
          class="border-linha-forte h-12 w-full rounded-lg border px-3.5 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
          @keyup.enter="salvar"
        />
        <span class="text-tinta-fraca text-[13px]">Aparece na busca ao registrar em conta.</span>
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
      titulo="Remover cliente"
      confirmar="Remover"
      perigo
      :carregando="removendo"
      @fechar="paraRemover = null"
      @confirmar="confirmarRemocao"
    >
      <p class="leading-snug">
        Remover <b>{{ paraRemover?.nome }}</b> do cadastro? Quem já consumiu alguma vez não pode ser
        removido — o histórico de vendas depende dele.
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
