# Política de seguridad

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad de seguridad en Canchazo, escríbenos directamente a
**hola@canchazo.co** con el detalle. No abras un issue público hasta que el problema
esté resuelto — así evitamos exponer a otros usuarios mientras se corrige.

Incluye, si es posible:
- Pasos para reproducir el problema
- Impacto esperado (qué datos o funcionalidad se ven afectados)
- Una prueba de concepto, si aplica

## Alcance

Cubre el código de este repositorio: frontend, hooks de acceso a datos, políticas RLS
documentadas en el esquema de Supabase, y la configuración de despliegue en Vercel.
No cubre infraestructura de terceros (Supabase, Wompi, Vercel) — reporta esos casos
directamente a sus programas de seguridad.

## Prácticas actuales

- Autenticación y autorización delegadas a Supabase Auth + Row Level Security
- Las claves publicadas en el cliente (`VITE_SUPABASE_ANON_KEY`, `VITE_WOMPI_PUBLIC_KEY`)
  son claves públicas por diseño — nunca se exponen claves de servicio (`service_role`)
- El total de una orden se recalcula del lado del servidor (función de base de datos)
  en lugar de confiar en el valor enviado por el cliente
