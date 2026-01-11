import { createApp } from './app'
import './assets/css/main.css'

const { app, router } = createApp()

router.isReady().then(() => {
    app.mount('#app')
    
    console.log('hydrated')
})
