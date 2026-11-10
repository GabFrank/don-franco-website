import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TextBlocks from './pages/TextBlocks';
import Menu from './pages/Menu';
import Beers from './pages/Beers';
import Gallery from './pages/Gallery';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Publish from './pages/Publish';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/textos" element={<TextBlocks />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cervezas" element={<Beers />} />
        <Route path="/galeria" element={<Gallery />} />
        <Route path="/resenas" element={<Reviews />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/publicar" element={<Publish />} />
      </Routes>
    </Layout>
  );
}

export default App;
