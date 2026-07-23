<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useField, useForm } from 'vee-validate'
import axios from 'axios'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const erroLogin = ref('')
const carregando = ref(false)

const { handleSubmit, errors } = useForm({
  validationSchema: {
    username(value: string) {
      return value?.trim() ? true : 'Informe o usuário'
    },
    password(value: string) {
      return value?.trim() ? true : 'Informe a senha'
    },
  },
})

const { value: username } = useField<string>('username')
const { value: password } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  erroLogin.value = ''
  carregando.value = true
  try {
    const form = new URLSearchParams()
    form.append('username', values.username)
    form.append('password', values.password)

    const { data } = await api.post<{ access_token: string }>('/login', form)
    auth.setToken(data.access_token)
    router.push({ name: 'home' })
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      erroLogin.value = 'Usuário ou senha inválidos'
    } else {
      erroLogin.value = 'Não foi possível conectar. Tente novamente.'
    }
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-zinc-100">
    <form @submit="onSubmit" class="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4">
      <h1 class="text-2xl font-bold text-zinc-800 text-center">DAETEC</h1>

      <div>
        <label class="block text-sm font-medium text-zinc-700 mb-1">Usuário</label>
        <input
          v-model="username"
          type="text"
          class="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p v-if="errors.username" class="text-sm text-red-600 mt-1">{{ errors.username }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-zinc-700 mb-1">Senha</label>
        <input
          v-model="password"
          type="password"
          class="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p v-if="errors.password" class="text-sm text-red-600 mt-1">{{ errors.password }}</p>
      </div>

      <p v-if="erroLogin" class="text-sm text-red-600 text-center">{{ erroLogin }}</p>

      <button
        type="submit"
        :disabled="carregando"
        class="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition"
      >
        {{ carregando ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </main>
</template>
