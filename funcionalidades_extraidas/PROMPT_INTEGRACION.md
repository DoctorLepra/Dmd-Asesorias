# Prompt Maestros para Integración

Copia y pega el siguiente prompt en tu asistente de IA (como Antigravity u otro) cuando estés en el nuevo proyecto para realizar la integración en un solo paso:

---

### Prompt Final de Integración

"Actúa como un experto en Fullstack con React y Supabase. Necesito implementar un sistema de Tareas y Notificaciones en tiempo real en este proyecto siguiendo estas instrucciones:

1. **Análisis y Lectura**: Lee los archivos `Tareas.tsx` y `Notificaciones.tsx` que se encuentran en la carpeta `funcionalidades_extraidas`.
2. **Base de Datos**: Extrae los bloques de código SQL comentados al inicio de ambos archivos y ejecútalos en la instancia de Supabase de este proyecto (o genera las migraciones correspondientes). Asegúrate de habilitar Realtime para las tablas `tasks` y `notifications`.
3. **Adaptación de Estilo**: Integra los componentes `TaskBoard` y `NotificationBell` en la interfaz de mi proyecto actual. Debes ajustar los colores (primarios, secundarios), bordes, fuentes y sombras de los archivos extraídos para que coincidan EXACTAMENTE con el lenguaje de diseño de este nuevo proyecto (revisa mi `globals.css` o componentes base).
4. **Lógica intacta**: Mantén toda la funcionalidad de Supabase Realtime, suscripciones, manejo de estados y notificaciones nativas tal cual como están implementadas en los módulos originales.
5. **Configuración de Cliente**: Asegúrate de que las importaciones de `supabase` apunten al archivo de configuración correcto de este proyecto (ej. `@/lib/supabase` o similar)."

---

## Consejos Adicionales

- Asegúrate de tener las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas.
- Si tu proyecto no usa Next.js (por ejemplo Vite), cambia el prefijo de las variables de entorno en el código a `VITE_SUPABASE_URL`.
- Ejecuta primero el SQL en el dashboard de Supabase para evitar errores de tabla no encontrada.
