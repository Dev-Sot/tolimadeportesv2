export function SetupScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'system-ui, sans-serif', background: '#0F1510', color: '#EDEFE6',
    }}>
      <div style={{ maxWidth: 560 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'rgba(87,194,133,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: '1.5rem',
        }}>⚙️</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Falta configurar Canchazo
        </h1>
        <p style={{ color: '#AEBBA9', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          No encontré <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_URL</code> ni{' '}
          <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code> en el entorno.
          Sin esto la app no tiene forma de hablar con tu base de datos.
        </p>
        <ol style={{ color: '#EDEFE6', lineHeight: 1.9, paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
          <li>Copia <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>.env.example</code> a <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>.env.local</code></li>
          <li>Completa la URL y la clave <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>anon</code> de tu propio proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#57C285' }}>supabase.com/dashboard</a> → Project Settings → API</li>
          <li>Reinicia <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>npm run dev</code></li>
        </ol>
        <p style={{ color: '#AEBBA9', fontSize: '0.85rem' }}>
          Detalle completo en el <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>README.md</code> del proyecto.
        </p>
      </div>
    </div>
  );
}
