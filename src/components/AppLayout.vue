<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useUsuarioStore } from "../stores/usuario"
import IconeNav from "./IconeNav.vue"

const auth = useAuthStore()
const usuarioStore = useUsuarioStore()
const router = useRouter()

interface ItemNav {
  /** nome da rota (o mesmo do router) */
  nome: string
  rotulo: string
  /** só aparece pra admin */
  admin?: boolean
  /** também aparece na navegação inferior do celular */
  celular?: boolean
}

const ITENS: ItemNav[] = [
  { nome: "vender", rotulo: "Registrar venda", celular: true },
  { nome: "contas", rotulo: "Contas em aberto", celular: true },
  { nome: "produtos", rotulo: "Produtos", admin: true },
  { nome: "clientes", rotulo: "Clientes", admin: true },
  { nome: "relatorio", rotulo: "Relatório", admin: true, celular: true },
]

const itensLaterais = computed(() => ITENS.filter((item) => !item.admin || usuarioStore.isAdmin))

const itensCelular = computed(() => [
  ...itensLaterais.value.filter((item) => item.celular),
  { nome: "perfil", rotulo: "Perfil" } as ItemNav,
])

const username = computed(() => usuarioStore.usuario?.username ?? "")
const iniciais = computed(() => username.value.slice(0, 2).toUpperCase())
const papel = computed(() => (usuarioStore.isAdmin ? "Administrador" : "Vendedor"))

function sair() {
  auth.logout()
  usuarioStore.limpar()
  router.push({ name: "login" })
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside
      class="border-linha hidden w-62 shrink-0 flex-col gap-6 border-r bg-white px-4 py-5 lg:flex"
    >
      <div class="flex items-center gap-2.5 px-2">
        <div
          class="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-[10px] bg-violet-600 text-base font-bold text-white"
        >
          D
        </div>
        <div class="min-w-0">
          <p class="text-base leading-tight font-bold tracking-tight">DAETEC</p>
          <p class="text-tinta-fraca text-[10px] font-medium tracking-widest">
            DIRETÓRIO ACADÊMICO
          </p>
        </div>
      </div>

      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in itensLaterais"
          :key="item.nome"
          :to="{ name: item.nome }"
          class="flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] font-medium"
          active-class="!bg-violet-100 !font-semibold !text-violet-800"
        >
          <IconeNav :nome="item.nome" />
          {{ item.rotulo }}
        </RouterLink>
      </nav>

      <div class="mt-auto flex flex-col gap-2">
        <div class="flex items-center gap-2.5 rounded-[10px] bg-violet-50 p-2.5">
          <div
            class="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-full bg-violet-200 text-sm font-semibold text-violet-800"
          >
            {{ iniciais }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm leading-tight font-semibold">{{ username }}</p>
            <p class="text-tinta-fraca text-xs">{{ papel }}</p>
          </div>
        </div>
        <button
          type="button"
          class="text-tinta-suave hover:bg-fundo flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-medium"
          @click="sair"
        >
          <IconeNav nome="sair" />
          Sair
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
      <RouterView />
    </div>

    <nav
      class="border-linha fixed inset-x-0 bottom-0 z-10 flex border-t bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <RouterLink
        v-for="item in itensCelular"
        :key="item.nome"
        :to="{ name: item.nome }"
        class="text-tinta-suave flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
        active-class="!text-violet-700 !font-semibold"
      >
        <IconeNav :nome="item.nome" />
        {{ item.rotulo.split(" ")[0] }}
      </RouterLink>
    </nav>
  </div>
</template>
