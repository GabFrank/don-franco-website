import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navigation = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/textos', label: 'Textos', icon: '📝' },
    { path: '/menu', label: 'Menú', icon: '🍽️' },
    { path: '/cervezas', label: 'Cervezas', icon: '🍺' },
    { path: '/galeria', label: 'Galería', icon: '📸' },
    { path: '/resenas', label: 'Reseñas', icon: '⭐' },
    { path: '/contacto', label: 'Contacto', icon: '📞' },
    { path: '/publicar', label: 'Publicar', icon: '🚀' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Don Franco</h1>
          <p className="sidebar-subtitle">Panel Admin</p>
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
