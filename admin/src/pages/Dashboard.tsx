function Dashboard() {
  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Bienvenido al panel de administración de Don Franco.</p>
      
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <h3>📝 Textos</h3>
          <p>Gestionar bloques de texto del sitio</p>
        </div>
        
        <div className="card">
          <h3>🍽️ Menú</h3>
          <p>Editar categorías, items y páginas</p>
        </div>
        
        <div className="card">
          <h3>🍺 Cervezas</h3>
          <p>Administrar cervezas y sus imágenes</p>
        </div>
        
        <div className="card">
          <h3>📸 Galería</h3>
          <p>Gestionar fotos de galería</p>
        </div>
        
        <div className="card">
          <h3>⭐ Reseñas</h3>
          <p>Editar citas y estadísticas</p>
        </div>
        
        <div className="card">
          <h3>📞 Contacto</h3>
          <p>Actualizar información de contacto</p>
        </div>
        
        <div className="card">
          <h3>🚀 Publicar</h3>
          <p>Publicar cambios al sitio</p>
        </div>
      </div>
      
      <div className="alert alert-info" style={{ marginTop: '2rem' }}>
        <strong>Nota:</strong> Los cambios no se reflejarán en el sitio público hasta que uses la función "Publicar".
      </div>
    </div>
  );
}

export default Dashboard;
