import { h } from "vue"
import { createRouter, createWebHistory, RouterView } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useUsuarioStore } from "../stores/usuario"
import AppLayout from "../components/AppLayout.vue"
import LoginView from "../views/LoginView.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginView },
    {
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", redirect: { name: "vender" } },
        { path: "vender", name: "vender", component: () => import("../views/VenderView.vue") },
        {
          path: "minhas-vendas",
          name: "minhas-vendas",
          component: () => import("../views/MinhasVendasView.vue"),
        },
        {
          // pai de passagem: só existe pra "Contas em aberto" continuar ativo na lateral
          // enquanto o detalhe está aberto
          path: "contas",
          component: { render: () => h(RouterView) },
          children: [
            { path: "", name: "contas", component: () => import("../views/ContasView.vue") },
            {
              path: ":clienteId",
              name: "conta",
              component: () => import("../views/ContaView.vue"),
              // props: true entrega o :clienteId como prop — a view não depende do router
              props: true,
            },
          ],
        },
        {
          path: "cadastros",
          name: "cadastros",
          component: () => import("../views/CadastrosView.vue"),
          meta: { admin: true },
        },
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
          path: "vendedores",
          name: "vendedores",
          component: () => import("../views/VendedoresView.vue"),
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

  const usuarioStore = useUsuarioStore()
  if (!(await usuarioStore.carregar())) {
    auth.logout()
    return { name: "login" }
  }

  if (to.meta.admin && !usuarioStore.isAdmin) {
    return { name: "vender" }
  }
})

export default router
