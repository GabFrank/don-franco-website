import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { TextBlock } from '../types/api';

function TextBlocks() {
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<TextBlock | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    section: 'hero',
    body: '',
    visible: 1,
    sort_order: 0,
  });

  useEffect(() => {
    loadTextBlocks();
  }, []);

  const loadTextBlocks = async () => {
    try {
      setLoading(true);
      const data = await api.textBlocks.list(true, false);
      setTextBlocks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar textos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBlock(null);
    setFormData({
      key: '',
      section: 'hero',
      body: '',
      visible: 1,
      sort_order: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (block: TextBlock) => {
    setEditingBlock(block);
    setFormData({
      key: block.key,
      section: block.section,
      body: block.body,
      visible: block.visible,
      sort_order: block.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBlock) {
        await api.textBlocks.update(editingBlock.id, formData);
      } else {
        await api.textBlocks.create(formData);
      }
      setShowModal(false);
      loadTextBlocks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleToggleVisible = async (block: TextBlock) => {
    try {
      await api.textBlocks.update(block.id, { visible: block.visible ? 0 : 1 });
      loadTextBlocks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar visibilidad');
    }
  };

  const handleDelete = async (block: TextBlock, hard = false) => {
    const confirmMsg = hard 
      ? '⚠️ BORRADO PERMANENTE - No se puede recuperar. ¿Confirmar?'
      : '¿Mover a papelera?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      await api.textBlocks.delete(block.id, hard);
      loadTextBlocks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const groupedBlocks = textBlocks.reduce((acc, block) => {
    if (!acc[block.section]) acc[block.section] = [];
    acc[block.section].push(block);
    return acc;
  }, {} as Record<string, TextBlock[]>);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Textos</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Nuevo Texto
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {Object.entries(groupedBlocks).map(([section, blocks]) => (
        <div key={section} className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>{section}</h2>
          
          <table className="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Contenido</th>
                <th>Estado</th>
                <th>Orden</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.id} className={block.visible === 0 ? 'item-hidden' : ''}>
                  <td><code>{block.key}</code></td>
                  <td>{block.body.substring(0, 60)}{block.body.length > 60 ? '...' : ''}</td>
                  <td>
                    {block.visible === 1 ? (
                      <span className="badge badge-visible">Visible</span>
                    ) : (
                      <span className="badge badge-hidden">Oculto</span>
                    )}
                  </td>
                  <td>{block.sort_order}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => handleEdit(block)}>
                        Editar
                      </button>
                      <button 
                        className={block.visible ? 'btn btn-secondary' : 'btn btn-success'}
                        onClick={() => handleToggleVisible(block)}
                      >
                        {block.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(block, false)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {textBlocks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>No hay textos configurados</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingBlock ? 'Editar Texto' : 'Nuevo Texto'}
              </h2>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Key</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  required
                  disabled={!!editingBlock}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sección</label>
                <select
                  className="form-select"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  required
                >
                  <option value="hero">Hero</option>
                  <option value="story">Story</option>
                  <option value="footer">Footer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Contenido</label>
                <textarea
                  className="form-textarea"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={4}
                  required
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

export default TextBlocks;
