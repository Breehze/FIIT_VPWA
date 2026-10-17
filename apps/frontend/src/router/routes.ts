import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/AuthPage.vue') },
    ],
  },
  {
    path: '/chat',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@/pages/MainPage.vue') }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes
