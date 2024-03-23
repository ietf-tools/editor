const routes = [
  {
    name: 'submit',
    path: '/submit',
    component: () => import('pages/SubmitPage.vue')
  },
  {
    path: '/',
    component: () => import('layouts/EditorLayout.vue'),
    children: [
      {
        name: 'welcome',
        path: '',
        component: () => import('pages/WelcomePage.vue')
      },
      {
        name: 'editor',
        path: 'editor',
        component: () => import('pages/EditorPage.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    name: 'error',
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
