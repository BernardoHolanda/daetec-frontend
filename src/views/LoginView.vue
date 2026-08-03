<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useField, useForm } from "vee-validate"
import axios from "axios"
import api from "../services/api"
import { useAuthStore } from "../stores/auth"

const auth = useAuthStore()
const router = useRouter()

const erroLogin = ref("")
const carregando = ref(false)
const mostrarSenha = ref(false)

const { handleSubmit, errors } = useForm({
  validationSchema: {
    username(value: string) {
      return value?.trim() ? true : "Informe o usuário"
    },
    password(value: string) {
      return value?.trim() ? true : "Informe a senha"
    },
  },
})

const { value: username } = useField<string>("username")
const { value: password } = useField<string>("password")

const onSubmit = handleSubmit(async (values) => {
  erroLogin.value = ""
  carregando.value = true
  try {
    const form = new URLSearchParams()
    form.append("username", values.username)
    form.append("password", values.password)

    const { data } = await api.post<{ access_token: string }>("/login", form)
    auth.setToken(data.access_token)
    router.push({ name: "vender" })
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      erroLogin.value = "Usuário ou senha inválidos"
    } else {
      erroLogin.value = "Não foi possível conectar. Tente novamente."
    }
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <main class="flex min-h-screen flex-col bg-white xl:flex-row">
    <aside
      class="xl:border-linha flex flex-col items-start gap-4 px-6 pt-8 xl:w-155 xl:shrink-0 xl:justify-between xl:border-r xl:bg-violet-50 xl:px-14 xl:py-16"
    >
      <div class="flex flex-col items-start gap-4 xl:flex-row xl:items-center xl:gap-3.5">
        <div
          class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-600 text-[27px] font-bold text-white xl:h-13 xl:w-13 xl:text-[25px]"
        >
          D
        </div>
        <div>
          <h1 class="text-[28px] font-bold tracking-tight xl:text-[26px]">DAETEC</h1>
          <p class="text-[11px] font-medium tracking-widest text-violet-600 uppercase">
            Diretório acadêmico
          </p>
        </div>
      </div>

      <p class="text-tinta-suave text-base leading-relaxed text-pretty xl:hidden">
        Toda venda do dia registrada em segundos, do corredor à mesa do CA.
      </p>

      <div class="hidden xl:flex xl:max-w-110 xl:flex-col xl:gap-6">
        <p class="text-[40px] leading-tight font-semibold tracking-tight text-balance">
          Toda venda do dia registrada em segundos.
        </p>
        <p class="text-tinta-suave text-[17px] leading-relaxed text-pretty">
          Vendas, contas em aberto e o fechamento do caixa no mesmo lugar — no celular do corredor e
          no computador do centro acadêmico.
        </p>
        <ul class="flex flex-col gap-2.5 text-[15px]">
          <li class="flex items-center gap-2.5">
            <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
            Pix, débito, crédito, dinheiro e conta
          </li>
          <li class="flex items-center gap-2.5">
            <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
            Contas em aberto por cliente
          </li>
          <li class="flex items-center gap-2.5">
            <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
            Relatório do dia por vendedor
          </li>
        </ul>
      </div>

      <p class="text-tinta-fraca hidden text-sm xl:block">
        Acesso criado pela administração do diretório.
      </p>
    </aside>

    <div class="flex flex-1 flex-col px-6 pb-7 xl:items-center xl:justify-center xl:px-16">
      <div class="flex w-full flex-1 flex-col xl:max-w-100 xl:flex-none">
        <div class="mb-6 hidden xl:block">
          <h2 class="text-2xl leading-tight font-semibold tracking-tight">Entrar</h2>
          <p class="text-tinta-suave mt-1.5 text-[15px]">
            Use o usuário que a administração te passou.
          </p>
        </div>

        <form class="mt-8 flex flex-col gap-4 xl:mt-0" @submit="onSubmit">
          <p
            v-if="erroLogin"
            role="alert"
            class="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 px-3.5 py-3 text-[15px] leading-snug font-medium text-red-700"
          >
            <span
              aria-hidden="true"
              class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-600 text-[13px] font-bold text-white"
            >
              !
            </span>
            {{ erroLogin }}
          </p>

          <div class="flex flex-col gap-1.5">
            <label for="username" class="text-[13px] font-semibold">Usuário</label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              autofocus
              :aria-invalid="!!errors.username || !!erroLogin"
              :aria-describedby="errors.username ? 'erro-username' : undefined"
              class="h-13 rounded-lg border px-3.5 text-base outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-200 xl:h-12"
              :class="errors.username || erroLogin ? 'border-red-600' : 'border-linha-forte'"
            />
            <p v-if="errors.username" id="erro-username" class="text-sm font-medium text-red-700">
              {{ errors.username }}
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-[13px] font-semibold">Senha</label>
            <div
              class="flex h-13 items-center gap-2 rounded-lg border pr-2 pl-3.5 focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-200 xl:h-12"
              :class="errors.password || erroLogin ? 'border-red-600' : 'border-linha-forte'"
            >
              <input
                id="password"
                v-model="password"
                :type="mostrarSenha ? 'text' : 'password'"
                autocomplete="current-password"
                :aria-invalid="!!errors.password || !!erroLogin"
                :aria-describedby="errors.password ? 'erro-password' : undefined"
                class="min-w-0 flex-1 text-base outline-none"
              />
              <button
                type="button"
                class="h-10 shrink-0 rounded-md bg-violet-50 px-3 text-[13px] font-semibold text-violet-800"
                @click="mostrarSenha = !mostrarSenha"
              >
                {{ mostrarSenha ? "Ocultar" : "Mostrar" }}
              </button>
            </div>
            <p v-if="errors.password" id="erro-password" class="text-sm font-medium text-red-700">
              {{ errors.password }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="carregando"
            class="mt-1 flex h-13 items-center justify-center gap-2.5 rounded-lg bg-violet-600 text-[17px] font-semibold text-white hover:bg-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none disabled:cursor-wait disabled:bg-violet-700"
          >
            <span
              v-if="carregando"
              aria-hidden="true"
              class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            ></span>
            {{ carregando ? "Entrando..." : "Entrar" }}
          </button>
        </form>

        <p class="text-tinta-fraca mt-auto pt-8 text-sm leading-snug xl:mt-6 xl:pt-0">
          Problemas para entrar? Fale com quem administra o DAETEC.
        </p>
      </div>
    </div>
  </main>
</template>
