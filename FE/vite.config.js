import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/' : './' // Thêm dòng này để các file JS/CSS trỏ đúng đường dẫn tương đối
})