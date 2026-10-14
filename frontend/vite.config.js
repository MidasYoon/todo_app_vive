import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // /api 요청을 서버로 넘깁니다 (D-005). 서버가 127.0.0.1에서 듣기 때문에 localhost 대신 씁니다.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
