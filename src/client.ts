import { createApp } from './app'
import './assets/css/main.css'

const { app, router } = createApp(window.location.host)

router.isReady().then(() => {
    app.mount('#app')
    
    console.log('hydrated')
})
