import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Beer, Image } from '../types/api';

function Beers() {
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null);
  const [uploading, setUploading] = useState(false);

  const resolveImageSrc = (beer: Beer): string | null => {
    const r2Key = (beer as any).image_r2_key || beer.image?.r2_key;
    
    if (r2Key) {
      if (r2Key.startsWith('/') || r2Key.startsWith('http://') || r2Key.startsWith('https://')) {
        return r2Key;
      }
      return `/media/${r2Key}`;
    }
    
    if (beer.name) {
      const fallbackSvg = `/beers/${beer.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
      return fallbackSvg;
    }
    
    return null;
  };
  
  const [formData, setFormData] = useState({
    name: '',
    style: '',
    notes: '',
    image_id: '',
    visible: 1,
    sort_order: 0,
  });
  
  const [uploadedImage, setUploadedImage] = useState<Image | null>(null);

  useEffect(() => {
    loadBeers();
  }, []);

  const loadBeers = async () => {
    try {
      setLoading(true);
      const data = await api.beers.list(true, false);
      setBeers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cervezas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBeer(null);
    setUploadedImage(null);
    setFormData({
      name: '',
      style: '',
      notes: '',
      image_id: '',
      visible: 1,
      sort_order: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (beer: Beer) => {
    setEditingBeer(beer);
    setUploadedImage(null);
    setFormData({
      name: beer.name,
      style: beer.style || '',
      notes: beer.notes || '',
      image_id: beer.image_id || '',
      visible: beer.visible,
      sort_order: beer.sort_order,
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadResult = await api.r2.upload(file, 'beers');
      
      const imageData = await api.images.create({
        key: `beer.${Date.now()}`,
        section: 'beer',
        r2_key: uploadResult.r2Key,
        alt: formData.name || 'Cerveza',
        visible: 1,
        sort_order: 0,
      });
      
      setUploadedImage(imageData);
      setFormData({ ...formData, image_id: imageData.id });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBeer) {
        await api.beers.update(editingBeer.id, formData);
      } else {
        await api.beers.create(formData);
      }
      setShowModal(false);
      loadBeers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleToggleVisible = async (beer: Beer) => {
    try {
      await api.beers.update(beer.id, { visible: beer.visible ? 0 : 1 });
      loadBeers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDelete = async (beer: Beer, hard = false) => {
    const confirmMsg = hard 
      ? '⚠️ BORRADO PERMANENTE - No se puede recuperar. ¿Confirmar?'
      : '¿Mover a papelera?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      await api.beers.delete(beer.id, hard);
      loadBeers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Cervezas</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Nueva Cerveza
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {beers.map(beer => (
          <div key={beer.id} className={`card ${beer.visible === 0 ? 'item-hidden' : ''}`}>
            {(() => {
              const imgSrc = resolveImageSrc(beer);
              return imgSrc ? (
                <img 
                  src={imgSrc} 
                  alt={beer.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
              ) : null;
            })()}
            <div style={{ 
              display: resolveImageSrc(beer) ? 'none' : 'flex',
              width: '100%', 
              height: '200px', 
              backgroundColor: 'var(--border)', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}>
              🍺
            </div>
            
            <h3 style={{ marginBottom: '0.5rem' }}>{beer.name}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{beer.style || 'Sin estilo'}</p>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{beer.notes || 'Sin descripción'}</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {beer.visible === 1 ? (
                <span className="badge badge-visible">Visible</span>
              ) : (
                <span className="badge badge-hidden">Oculto</span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => handleEdit(beer)}>
                Editar
              </button>
              <button 
                className={beer.visible ? 'btn btn-secondary' : 'btn btn-success'}
                onClick={() => handleToggleVisible(beer)}
              >
                {beer.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(beer, false)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {beers.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🍺</div>
          <p>No hay cervezas configuradas</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingBeer ? 'Editar Cerveza' : 'Nueva Cerveza'}
              </h2>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estilo</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  placeholder="IPA, Stout, Lager, etc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas de cata</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Describe el sabor, aroma, etc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Imagen</label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <p>Subiendo imagen...</p>}
                {uploadedImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img 
                      src={uploadedImage.r2_key.startsWith('/') ? uploadedImage.r2_key : `/media/${uploadedImage.r2_key}`}
                      alt="Preview"
                      className="image-preview"
                    />
                    <p style={{ fontSize: '0.875rem', color: 'var(--success)' }}>✓ Imagen subida</p>
                  </div>
                )}
                {editingBeer && !uploadedImage && (() => {
                  const currentImgSrc = resolveImageSrc(editingBeer);
                  return currentImgSrc ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={currentImgSrc}
                        alt="Current"
                        className="image-preview"
                      />
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Imagen actual</p>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="visible"
                    checked={formData.visible === 1}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="visible" className="form-label" style={{ marginBottom: 0 }}>
                    Mostrar en sitio público
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Beers;
