<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import {
  atualizarProduto,
  criarProduto,
  deletarProduto,
  listarProdutos,
} from "../services/produtos"
import { listarVendedores } from "../services/vendedores"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { normalizar } from "../utils/texto"
import { mensagemDoErro } from "../utils/erro"
import type { Produto, Vendedor } from "../types/api"
import CampoBusca from "../components/CampoBusca.vue"
import ErroAoCarregar from "../components/ErroAoCarregar.vue"
import EstadoVazio from "../components/EstadoVazio.vue"
import IconeNav from "../components/IconeNav.vue"
import ModalConfirmacao from "../components/ModalConfirmacao.vue"

const COLUNAS = "lg:grid-cols-[1fr_200px_140px_200px]"

const produtos = ref<Produto[]>([])
const vendedores = ref<Vendedor[]>([])
const carregando = ref(true)
const erro = ref(false)
const busca = ref("")

const modalAberto = ref(false)
// null = criando; um produto = editando aquele
const emEdicao = ref<Produto | null>(null)
const nome = ref("")
const preco = ref("")
const vendedorId = ref<number | null>(null)
const salvando = ref(false)
const erroAoSalvar = ref("")

const paraRemover = ref<Produto | null>(null)
const removendo = ref(false)
const erroAoRemover = ref("")

// sem dono cadastrado não dá pra criar produto: o vendedor_id é obrigatório na API
const semVendedores = computed(() => vendedores.value.length === 0)

const visiveis = computed(() => {
  const termo = normalizar(busca.value.trim())
  const achados = termo
    ? produtos.value.filter((p) => normalizar(p.nome).includes(termo))
    : produtos.value
  return [...achados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
})

const formValido = computed(
  () => nome.value.trim().length > 0 && Number(preco.value) > 0 && vendedorId.value !== null,
)

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    // em paralelo: uma não depende da outra, e o modal precisa dos vendedores prontos
    const [listaProdutos, listaVendedores] = await Promise.all([
      listarProdutos(),
      listarVendedores(),
    ])
    produtos.value = listaProdutos
    vendedores.value = listaVendedores
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
}

function abrir(produto: Produto | null) {
  emEdicao.value = produto
  nome.value = produto?.nome ?? ""
  preco.value = produto?.preco ?? ""
  vendedorId.value = produto?.vendedor.id ?? vendedores.value[0]?.id ?? null
  erroAoSalvar.value = ""
  modalAberto.value = true
}

async function salvar() {
  if (!formValido.value || vendedorId.value === null) return
  const dados = {
    nome: nome.value.trim(),
    preco: preco.value,
    vendedor_id: vendedorId.value,
  }
  salvando.value = true
  erroAoSalvar.value = ""
  try {
    if (emEdicao.value) await atualizarProduto(emEdicao.value.id, dados)
    else await criarProduto(dados)
    modalAberto.value = false
    await carregar()
  } catch (e) {
    erroAoSalvar.value = mensagemDoErro(e, "Não foi possível salvar. Tente de novo.")
  } finally {
    salvando.value = false
  }
}

function pedirRemocao(produto: Produto) {
  paraRemover.value = produto
  erroAoRemover.value = ""
}

async function confirmarRemocao() {
  if (paraRemover.value === null) return
  removendo.value = true
  erroAoRemover.value = ""
  try {
    await deletarProduto(paraRemover.value.id)
    paraRemover.value = null
    await carregar()
  } catch (e) {
    // 409 quando o produto já foi vendido: a venda referencia o produto
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
        <h1 class="text-[22px] font-semibold tracking-tight">Produtos</h1>
        <p v-if="!carregando && !erro" class="text-tinta-suave mt-1 text-sm">
          {{ produtos.length }} {{ produtos.length === 1 ? "cadastrado" : "cadastrados" }}
        </p>
      </div>

      <div class="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <CampoBusca v-model="busca" rotulo="Buscar produto" class="lg:w-80" />

        <button
          type="button"
          :disabled="semVendedores"
          class="h-12 shrink-0 rounded-lg bg-violet-600 px-4.5 font-semibold text-white hover:bg-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          @click="abrir(null)"
        >
          + Novo produto
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

    <ErroAoCarregar
      v-else-if="erro"
      titulo="Não foi possível carregar os produtos"
      @tentar="carregar"
    />

    <!-- produto exige dono, então a ordem de cadastro não é escolha: vendedor primeiro -->
    <EstadoVazio
      v-else-if="produtos.length === 0 && semVendedores"
      icone="produtos"
      titulo="Cadastre um vendedor primeiro"
    >
      Todo produto pertence a um vendedor, então não dá pra cadastrar produto antes.
      <template #acao>
        <RouterLink
          :to="{ name: 'vendedores' }"
          class="grid h-11 place-items-center rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
        >
          Ir para Vendedores
        </RouterLink>
      </template>
    </EstadoVazio>

    <EstadoVazio
      v-else-if="produtos.length === 0"
      icone="produtos"
      titulo="Nenhum produto cadastrado"
    >
      Cadastre o primeiro item para começar a registrar vendas.
      <template #acao>
        <button
          type="button"
          class="h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
          @click="abrir(null)"
        >
          Novo produto
        </button>
      </template>
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
        <span class="text-right">Preço</span>
        <span class="text-right">Ações</span>
      </div>

      <ul
        class="lg:border-linha flex flex-col gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-b-xl lg:border lg:bg-white"
      >
        <li
          v-for="produto in visiveis"
          :key="produto.id"
          class="border-linha lg:border-linha flex min-h-19 flex-col justify-center gap-2 rounded-xl border bg-white p-3.5 lg:grid lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-3 lg:last:border-b-0"
          :class="COLUNAS"
        >
          <div class="flex items-baseline justify-between gap-3 lg:contents">
            <span class="min-w-0 truncate font-semibold">{{ produto.nome }}</span>
            <span class="text-tinta-suave min-w-0 truncate text-[13px] lg:text-[15px]">
              {{ produto.vendedor.nome }}
            </span>
            <!-- order 3: no desktop o preço é a terceira coluna, no celular é a primeira linha -->
            <span class="font-bold tabular-nums lg:order-3 lg:text-right">
              {{ formatarBRL(paraCentavos(produto.preco)) }}
            </span>
          </div>

          <div class="flex gap-2 lg:order-4 lg:justify-end">
            <button
              type="button"
              class="h-9 rounded-lg border border-violet-300 px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus-visible:ring-4 focus-visible:ring-violet-200 focus-visible:outline-none"
              @click="abrir(produto)"
            >
              Editar
            </button>
            <button
              type="button"
              class="h-9 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:outline-none"
              @click="pedirRemocao(produto)"
            >
              Remover
            </button>
          </div>
        </li>
      </ul>
    </template>

    <ModalConfirmacao
      :aberto="modalAberto"
      :titulo="emEdicao ? 'Editar produto' : 'Novo produto'"
      confirmar="Salvar"
      :carregando="salvando"
      :desabilitado="!formValido"
      @fechar="modalAberto = false"
      @confirmar="salvar"
    >
      <div class="flex flex-col gap-3.5">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold">Nome</span>
          <input
            v-model="nome"
            type="text"
            autocomplete="off"
            placeholder="Ex.: Coxinha"
            class="border-linha-forte h-12 w-full rounded-lg border px-3.5 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold">Preço</span>
          <input
            v-model="preco"
            type="number"
            step="0.01"
            min="0.01"
            inputmode="decimal"
            placeholder="0,00"
            class="border-linha-forte h-12 w-full rounded-lg border px-3.5 text-base tabular-nums outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold">Dono</span>
          <select
            v-model="vendedorId"
            class="border-linha-forte h-12 w-full rounded-lg border bg-white px-3 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200"
          >
            <option v-for="vendedor in vendedores" :key="vendedor.id" :value="vendedor.id">
              {{ vendedor.nome }}
            </option>
          </select>
        </label>

        <div
          v-if="emEdicao"
          class="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <IconeNav nome="aviso" class="mt-0.5 shrink-0 text-amber-700" />
          <p class="text-[13px] leading-snug text-amber-800">
            Alterar o preço <b>não muda vendas já registradas</b> — o preço é congelado no momento
            da venda.
          </p>
        </div>

        <p
          v-if="erroAoSalvar"
          role="alert"
          class="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
        >
          {{ erroAoSalvar }}
        </p>
      </div>
    </ModalConfirmacao>

    <ModalConfirmacao
      :aberto="paraRemover !== null"
      titulo="Remover produto"
      confirmar="Remover"
      perigo
      :carregando="removendo"
      @fechar="paraRemover = null"
      @confirmar="confirmarRemocao"
    >
      <p class="leading-snug">
        Remover <b>{{ paraRemover?.nome }}</b> do catálogo? Produto que já foi vendido não pode ser
        removido — o histórico depende dele.
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
