import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { i18n } from '@/main'
import { nextTick } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        title: 'ALL_THE_PONIES',
      },
      component: HomeView,
    },
    {
      path: '/search/:category/',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
    },
    {
      path: '/pony/:id/',
      name: 'pony',
      component: () => import('../views/gameObjects/PonyPage.vue'),
    },
    {
      path: '/house/:id/',
      name: 'house',
      component: () => import('../views/gameObjects/HousePage.vue'),
    },
    {
      path: '/shop/:id/',
      name: 'shop',
      component: () => import('../views/gameObjects/ShopPage.vue'),
    },
    {
      path: '/decor/:id/',
      name: 'decor',
      component: () => import('../views/gameObjects/DecorPage.vue'),
    },
    {
      path: '/avatar/:id/',
      name: 'avatar',
      component: () => import('../views/gameObjects/AvatarPage.vue'),
    },

    {
      path: '/inventory/',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue')
    },
    {
      path: '/stats/',
      name: 'stats',
      component: () => import('../views/StatsView.vue')
    },

    {
      path: '/quiz/',
      name: 'quiz',
      component: () => import('../views/activities/PonyQuizView.vue'),
    },
    {
      path: '/guesser/',
      name: 'guesser',
      component: () => import('../views/activities/GuesserView.vue'),
    },
    
    
    {
      path: '/about/',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },

    {
      path: '/:notFound',
      name: '404',
      component: () => import('../views/errors/404.vue'),
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // console.log('savedPosition', savedPosition)
    if (savedPosition || to.path == from.path) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

router.afterEach((to, from) => {
  (document.getElementById('sidebar-toggle') as HTMLInputElement).checked = false

  // if (to.component.title) {
  //   document.title = to.component.title
  // } else {
  //   document.title = i18n.global.t(to.meta.title || 'ALL_THE_PONIES')
  // }
})

export default router
