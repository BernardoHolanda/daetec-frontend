<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { isAxiosError } from "axios"
import { obterConta } from "../services/contas"
import { formatarBRL, paraCentavos } from "../utils/dinheiro"
import { formatarDia, formatarDiaHora } from "../utils/data"
import type { Conta, Venda } from "../types/api"
import IconeNav from "../components/IconeNav.vue"

const props = defineProps<{ clienteId: string }>()

const conta = ref<Conta | null>(null)
const carregando = ref(true)
const erro = ref<"nao-encontrado" | "falhou" | null>(null)

// uma fonte só pras colunas: cabeçalho e linha não podem divergir
const COLUNAS = "lg:grid-cols-[180px_1fr_160px_140px]"

async function carregar() {
  carregando.value = true
  erro.value = null
  try {
    conta.value = await obterConta(props.clienteId)
  } catch (e) {
    // 404 é URL digitada na mão, não falha de rede — merece outra mensagem
    erro.value = isAxiosError(e) && e.response?.status === 404 ? "nao-encontrado" : "falhou"
  } finally {
    carregando.value = false
  }
}

// immediate cobre a montagem; o watch cobre trocar de cliente sem sair da rota
watch(() => props.clienteId, carregar, { immediate: true })

const total = computed(() => paraCentavos(conta.value?.total ?? "0"))

const iniciais = computed(() => {
  const partes = (conta.value?.nome ?? "").split(" ").filter(Boolean)
  const sobrenome = partes.length > 1 ? partes[partes.length - 1] : ""
  return `${partes[0]?.[0] ?? ""}${sobrenome[0] ?? ""}`.toUpperCase()
})

// consumo é item consumido, igual ao que o GET /contas soma
const consumos = computed(() =>
  (conta.value?.vendas ?? []).reduce(
    (soma, venda) => soma + venda.itens.reduce((qtd, item) => qtd + item.quantidade, 0),
    0,
  ),
)

const desde = computed(() => {
  const datas = (conta.value?.vendas ?? []).map((venda) => venda.data_hora)
  // ISO ordena como texto: o menor é o consumo mais antigo
  return datas.length ? formatarDia(datas.reduce((a, b) => (a < b ? a : b))) : ""
})

function totalDa(venda: Venda): number {
  return venda.itens.reduce(
    (soma, item) => soma + paraCentavos(item.preco_unitario) * item.quantidade,
    0,
  )
}

// lista, não texto: cada item ganha a própria linha na tela
function itensDa(venda: Venda): { id: number; texto: string }[] {
  return venda.itens.map((item) => ({
    id: item.id,
    texto: `${item.quantidade} × ${item.produto.nome}`,
  }))
}

// uma venda pode ter itens de donos diferentes; o Set tira a repetição
function vendedoresDa(venda: Venda): string[] {
  return [...new Set(venda.itens.map((item) => item.vendedor.nome))]
}
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <div class="flex min-h-11 items-center gap-2 text-sm lg:min-h-0">
      <RouterLink
        :to="{ name: 'contas' }"
        class="flex items-center gap-1.5 font-semibold text-violet-800"
      >
        <IconeNav nome="voltar" class="lg:hidden" />
        Contas em aberto
      </RouterLink>
      <template v-if="conta">
        <span class="text-tinta-fraca hidden lg:inline">/</span>
        <span class="text-tinta-suave hidden truncate lg:inline">{{ conta.nome }}</span>
      </template>
    </div>

    <div v-if="carregando" aria-hidden="true" class="flex flex-col gap-4 lg:gap-6">
      <div class="border-linha h-32 animate-pulse rounded-xl border bg-white"></div>
      <div class="border-linha h-56 animate-pulse rounded-xl border bg-white"></div>
    </div>

    <div
      v-else-if="erro"
      class="border-linha flex flex-col items-start gap-3 rounded-xl border bg-white p-6"
    >
      <div>
        <p class="font-semibold">
          {{ erro === "nao-encontrado" ? "Cliente não encontrado" : "Não foi possível carregar" }}
        </p>
        <p class="text-tinta-suave mt-1 text-sm">
          {{
            erro === "nao-encontrado"
              ? "Esse cadastro não existe mais."
              : "Verifique a conexão e tente de novo."
          }}
        </p>
      </div>
      <button
        v-if="erro === 'falhou'"
        type="button"
        class="h-11 rounded-lg bg-violet-600 px-4 font-semibold text-white hover:bg-violet-700"
        @click="carregar"
      >
        Tentar novamente
      </button>
      <RouterLink
        v-else
        :to="{ name: 'contas' }"
        class="grid h-11 place-items-center rounded-lg border border-violet-300 px-4 font-semibold text-violet-800"
      >
        Voltar para as contas
      </RouterLink>
    </div>

    <template v-else-if="conta">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div
          class="lg:border-linha flex flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6 lg:rounded-xl lg:border lg:bg-white lg:p-6"
        >
          <div class="flex items-center gap-3 lg:gap-4">
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-200 text-base font-semibold text-violet-800 lg:h-14 lg:w-14 lg:text-xl"
            >
              {{ iniciais }}
            </span>
            <h1 class="text-[19px] font-semibold tracking-tight lg:text-[26px]">
              {{ conta.nome }}
            </h1>
          </div>

          <div
            class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 lg:border-0 lg:bg-transparent lg:p-0 lg:text-right"
          >
            <p
              class="text-[10px] font-semibold tracking-widest text-amber-800 uppercase lg:text-[11px]"
            >
              Total em aberto
            </p>
            <p
              class="text-[44px] leading-none font-bold tracking-tight text-amber-800 tabular-nums lg:mt-1.5 lg:text-[56px]"
            >
              {{ formatarBRL(total) }}
            </p>
            <p class="mt-1 text-[13px] text-amber-700 lg:text-sm">
              {{ consumos }} {{ consumos === 1 ? "consumo" : "consumos" }}
              <template v-if="desde">· desde {{ desde }}</template>
            </p>
          </div>
        </div>

        <!-- painel de ação: no celular vira o bloco do rodapé, com outro texto -->
        <aside
          class="border-linha hidden w-80 shrink-0 flex-col gap-3 rounded-xl border bg-white p-5 lg:flex"
        >
          <p class="font-semibold">Recebeu o pagamento?</p>
          <p class="text-tinta-suave text-sm leading-relaxed">
            É ao fechar a conta que o valor <b class="text-tinta">entra como recebido</b> no
            relatório do dia.
          </p>
          <!-- ligado no passo 3 -->
          <button
            type="button"
            disabled
            class="h-13 rounded-lg bg-violet-600 text-[17px] font-semibold text-white disabled:opacity-50"
          >
            Fechar conta
          </button>
          <RouterLink
            :to="{ name: 'vender' }"
            class="grid h-11 place-items-center rounded-lg border border-violet-300 text-[15px] font-semibold text-violet-800"
          >
            Registrar novo consumo
          </RouterLink>
        </aside>
      </div>

      <section class="flex flex-col gap-2">
        <h2 class="text-tinta-fraca text-[11px] font-semibold tracking-widest uppercase lg:hidden">
          Histórico de consumo
        </h2>

        <p
          v-if="conta.vendas.length === 0"
          class="border-linha-forte text-tinta-suave rounded-xl border border-dashed p-10 text-center"
        >
          Nenhum consumo em aberto.
        </p>

        <div
          v-else
          class="lg:border-linha flex flex-col gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:bg-white"
        >
          <div
            class="border-linha text-tinta-fraca bg-fundo hidden border-b px-5 py-3 text-[11px] font-semibold tracking-widest uppercase lg:grid lg:gap-3"
            :class="COLUNAS"
          >
            <span>Data</span>
            <span>Itens</span>
            <span>Vendedor</span>
            <span class="text-right">Valor</span>
          </div>

          <ul class="flex flex-col gap-2 lg:gap-0">
            <li
              v-for="venda in conta.vendas"
              :key="venda.id"
              class="border-linha lg:border-linha grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 rounded-xl border bg-white p-3.5 lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-4 lg:last:border-b-0"
              :class="COLUNAS"
            >
              <span class="font-semibold tabular-nums lg:font-medium">
                {{ formatarDiaHora(venda.data_hora) }}
              </span>
              <!-- order-last: no desktop o valor é a 4ª coluna; no celular fica na 1ª linha -->
              <span
                class="text-right text-[19px] font-bold tabular-nums lg:order-last lg:text-base"
              >
                {{ formatarBRL(totalDa(venda)) }}
              </span>
              <ul class="text-tinta-suave col-span-2 text-sm lg:col-span-1 lg:text-base">
                <li v-for="item in itensDa(venda)" :key="item.id">{{ item.texto }}</li>
              </ul>
              <ul
                class="text-tinta-fraca lg:text-tinta-suave col-span-2 text-[13px] lg:col-span-1 lg:text-base"
              >
                <li v-for="(nome, i) in vendedoresDa(venda)" :key="nome">
                  <span v-if="i === 0" class="lg:hidden">Vendido por </span>{{ nome }}
                </li>
              </ul>
            </li>
          </ul>

          <div
            class="flex items-baseline justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:px-5"
          >
            <span class="font-semibold text-amber-800">Total em aberto</span>
            <span class="text-[28px] font-bold text-amber-800 tabular-nums">
              {{ formatarBRL(total) }}
            </span>
          </div>
        </div>
      </section>

      <div v-if="conta.vendas.length > 0" class="mt-auto flex flex-col gap-2 lg:hidden">
        <p class="text-tinta-suave text-center text-[13px]">
          Ao fechar, o valor entra como recebido hoje.
        </p>
        <!-- ligado no passo 3 -->
        <button
          type="button"
          disabled
          class="h-13 rounded-lg bg-violet-600 text-[17px] font-semibold text-white disabled:opacity-50"
        >
          Fechar conta · {{ formatarBRL(total) }}
        </button>
      </div>
    </template>
  </main>
</template>
