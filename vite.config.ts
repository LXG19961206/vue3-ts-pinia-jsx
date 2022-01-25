import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), vueJsx()],
    server: {
        proxy: {
            '/api': {
                target: 'http://ground.aerosat.com.cn',
                rewrite: path => path.replace(/^\/api/, ''),
                changeOrigin: true
            },
            '/audio': {
                target: 'http://119.3.227.27:29003/content',
                rewrite: path => path.replace(/^\/audio/, ''),
                changeOrigin: true
            },
            '/file': {
                target: 'http://119.3.227.27:29201/ad',
                rewrite: path => path.replace(/^\/file/, ''),
                changeOrigin: true
            }
        }
    }
})
