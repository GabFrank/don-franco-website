import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { GalleryImage } from '../types/api';

function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    r2_key: '',
    alt: '',
    visible: 1,
    sort_order: 0,
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await api.galleryImages.list(true, false);
      setImages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar galería');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadResult = await api.r2.upload(file, 'gallery');
      
      await api.galleryImages.create({
        r2_key: uploadResult.r2_key,
        alt: '',
        visible: 1,
        sort_order: images.length,
      });
      
      setUploading(false);
      loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen');
      setUploading(false);
    }
  };

  const handleToggleVisible = async (image: GalleryImage) => {
    try {
      await api.galleryImages.update(image.id, { visible: image.visible ? 0 : 1 });
      loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleBulkVisible = async (visible: number) => {
    if (selectedIds.size === 0) {
      alert('Selecciona al menos una imagen');
      return;
    }
    
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => 
          api.galleryImages.update(id, { visible })
        )
      );
      setSelectedIds(new Set());
      loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleBulkDelete = async (hard = false) => {
    if (selectedIds.size === 0) {
      alert('Selecciona al menos una imagen');
      return;
    }
    
    const confirmMsg = hard 
      ? '⚠️ BORRADO PERMANENTE - No se puede recuperar. ¿Confirmar?'
      : '¿Mover a papelera las imágenes seleccionadas?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => 
          api.galleryImages.delete(id, hard)
        )
      );
      setSelectedIds(new Set());
      loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map(img => img.id)));
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      r2_key: image.r2_key,
      alt: image.alt || '',
      visible: image.visible,
      sort_order: image.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;
    
    try {
      await api.galleryImages.update(editingImage.id, formData);
      setShowModal(false);
      loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <h1>Galería</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          + Subir Imagen
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        
        {uploading && <span>Subiendo...</span>}
        
        {selectedIds.size > 0 && (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>
              {selectedIds.size} seleccionada(s)
            </span>
            <button className="btn btn-success" onClick={() => handleBulkVisible(1)}>
              Mostrar Seleccionadas
            </button>
            <button className="btn btn-secondary" onClick={() => handleBulkVisible(0)}>
              Ocultar Seleccionadas
            </button>
            <button className="btn btn-danger" onClick={() => handleBulkDelete(false)}>
              Eliminar Seleccionadas
            </button>
          </>
        )}
        
        <button className="btn btn-secondary" onClick={handleSelectAll}>
          {selectedIds.size === images.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {images.map(image => (
          <div 
            key={image.id} 
            className={`card ${image.visible === 0 ? 'item-hidden' : ''}`}
            style={{ padding: '0.5rem', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
              <input
                type="checkbox"
                checked={selectedIds.has(image.id)}
                onChange={() => toggleSelection(image.id)}
                style={{ width: '1.5rem', height: '1.5rem', cursor: 'pointer' }}
              />
            </div>
            
            <img 
              src={`/media/${image.r2_key}`} 
              alt={image.alt || 'Galería'}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {image.visible === 1 ? (
                <span className="badge badge-visible">Visible</span>
              ) : (
                <span className="badge badge-hidden">Oculto</span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => handleEdit(image)} style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}>
                Editar
              </button>
              <button 
                className={image.visible ? 'btn btn-secondary' : 'btn btn-success'}
                onClick={() => handleToggleVisible(image)}
                style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
              >
                {image.visible ? '👁️' : '👁️'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📸</div>
          <p>No hay imágenes en la galería</p>
        </div>
      )}

      {showModal && editingImage && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Imagen</h2>
            </div>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1rem' }}>
                <img 
                  src={`/media/${editingImage.r2_key}`} 
                  alt="Preview"
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px' }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Texto alternativo (alt)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  placeholder="Descripción de la imagen"
                />
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
                <button type="submit" className="btn btn-primary">
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

export default Gallery;
