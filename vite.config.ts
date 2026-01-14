import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env
  // Fix: Cast process to any to avoid TS error about missing cwd property on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // LÓGICA ROBUSTA DE DETECCIÓN DE API KEY
  // Busca en este orden:
  // 1. Entorno de sistema (Vercel) - API_KEY
  // 2. Entorno de sistema (Vercel) - VITE_API_KEY (por si acaso la nombraste así)
  // 3. Archivo .env local - API_KEY
  // 4. Archivo .env local - VITE_API_KEY
  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || env.API_KEY || env.VITE_API_KEY;

  // Log para depuración en el Build Log de Vercel (no se verá en el navegador del cliente por seguridad)
  if (mode === 'production') {
      console.log(`[Vite Build] API Key status: ${apiKey ? 'DETECTED ✅' : 'MISSING ❌'}`);
  }

  return {
    plugins: [react()],
    define: {
      // Inyectamos el valor encontrado directamente en el código del cliente
      // Esto hace que 'process.env.API_KEY' funcione en el navegador
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Prevenimos crashes por acceder a otras propiedades de process.env
      'process.env': {} 
    }
  }
})