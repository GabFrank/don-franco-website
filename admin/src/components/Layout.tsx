import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span className="hamburger-icon">
          {isMobileMenuOpen ? '✕' : '☰'}
        </span>
      </button>

      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
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
              onClick={closeMobileMenu}
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
