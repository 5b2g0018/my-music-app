import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/my-music-app/', // 🔥 核心：一定要加上這一行，GitHub Pages 才能找到 CSS 和 JS
});
