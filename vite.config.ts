import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env (sin prefijo VITE_)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioridad: Variable de sistema (Vercel) > Archivo .env
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Reemplaza 'process.env.API_KEY' en el código por el valor real string
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Evita que otras llamadas a process.env rompan la app
      'process.env': {} 
    }
  }
})