import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useUsuarioStore } from "../stores/usuario"
import AppLayout from "../components/AppLayout.vue"
import LoginView from "../views/LoginView.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginView },
    {
      // rota-mãe: só monta a moldura (barra lateral + navegação inferior).
      // As filhas renderizam no <RouterView/> de dentro do AppLayout.
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", redirect: { name: "vender" } },
        // import() dinâmico: cada tela vira um arquivo separado no build,
        // baixado só quando o usuário entra nela.
        { path: "vender", name: "vender", component: () => import("../views/VenderView.vue") },
        { path: "contas", name: "contas", component: () => import("../views/ContasView.vue") },
        { path: "perfil", name: "perfil", component: () => import("../views/PerfilView.vue") },
        {
          path: "produtos",
          name: "produtos",
          component: () => import("../views/ProdutosView.vue"),
          meta: { admin: true },
        },
        {
          path: "clientes",
          name: "clientes",
          component: () => import("../views/ClientesView.vue"),
          meta: { admin: true },
        },
        {
          path: "relatorio",
          name: "relatorio",
          component: () => import("../views/RelatorioView.vue"),
          meta: { admin: true },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    return to.name === "login" ? true : { name: "login" }
  }

  if (to.name === "login") {
    return { name: "vender" }
  }

  // a primeira navegação autenticada busca quem está logado;
  // as seguintes reaproveitam o que já está no store
  const usuarioStore = useUsuarioStore()
  if (!(await usuarioStore.carregar())) {
    // token vencido ou inválido — o backend recusou o /usuarios/me
    auth.logout()
    return { name: "login" }
  }

  // esconder rota de admin é conveniência, não segurança:
  // quem barra de verdade é o exigir_admin do backend (403)
  if (to.meta.admin && !usuarioStore.isAdmin) {
    return { name: "vender" }
  }
})

export default router
