import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/:roomId',
    name: 'room',
    component: () => import('./views/RoomView.vue'),
    props: true
  },
  {
    path: '/',
    redirect: '/default'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
