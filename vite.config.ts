import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env locales (si existen)
  const env = loadEnv(mode, process.cwd(), '');
  
  // IMPORTANTE: En Vercel, las variables están en process.env. 
  // En local, suelen estar en 'env' (cargado por loadEnv).
  // Buscamos en ambos lugares para asegurar que no sea undefined.
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Inyectamos el valor de la API Key directamente en el código del cliente
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Mantenemos esto para compatibilidad con algunas librerías, pero la API_KEY ya está definida arriba
      'process.env': {} 
    }
  }
})