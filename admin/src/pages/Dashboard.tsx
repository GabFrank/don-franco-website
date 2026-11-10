import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Bienvenido al panel de administración de Don Franco.</p>
      
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Link to="/textos" className="dashboard-card card">
          <h3>📝 Textos</h3>
          <p>Gestionar bloques de texto del sitio</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/menu" className="dashboard-card card">
          <h3>🍽️ Menú</h3>
          <p>Editar categorías, items y páginas</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/cervezas" className="dashboard-card card">
          <h3>🍺 Cervezas</h3>
          <p>Administrar cervezas y sus imágenes</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/galeria" className="dashboard-card card">
          <h3>📸 Galería</h3>
          <p>Gestionar fotos de galería</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/resenas" className="dashboard-card card">
          <h3>⭐ Reseñas</h3>
          <p>Editar citas y estadísticas</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/contacto" className="dashboard-card card">
          <h3>📞 Contacto</h3>
          <p>Actualizar información de contacto</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/publicar" className="dashboard-card card">
          <h3>🚀 Publicar</h3>
          <p>Publicar cambios al sitio</p>
          <span className="card-arrow">→</span>
        </Link>
      </div>
      
      <div className="alert alert-info" style={{ marginTop: '2rem' }}>
        <strong>Nota:</strong> Los cambios no se reflejarán en el sitio público hasta que uses la función "Publicar".
      </div>
    </div>
  );
}

export default Dashboard;
