import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'https://fantasy.premierleague.com',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
