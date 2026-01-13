import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Vital: Reemplazamos explícitamente process.env.API_KEY con el valor real
      // Usamos JSON.stringify para que sea un string válido en el código JS resultante
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Evitamos errores si alguna librería intenta acceder a process.env
      'process.env': JSON.stringify({}), 
    }
  }
})