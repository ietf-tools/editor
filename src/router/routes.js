import { useDocsStore } from 'src/stores/docs'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/WelcomePage.vue'),
        beforeEnter: (to, from) => {
          const docsStore = useDocsStore()
          if (docsStore.active && docsStore.opened.length > 0) {
            return { path: '/editor' }
          }
        }
      },
      {
        path: 'editor',
        component: () => import('pages/EditorMain.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
