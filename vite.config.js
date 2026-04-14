import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/MediShift/', // 👈 加上這一行，必須跟你的 Repo 名字一樣
})