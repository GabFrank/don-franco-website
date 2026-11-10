import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { ReviewQuote, ReviewStats } from '../types/api';

function Reviews() {
  const [quotes, setQuotes] = useState<ReviewQuote[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<ReviewQuote | null>(null);
  
  const [quoteForm, setQuoteForm] = useState({
    author: '',
    text: '',
    visible: 1,
    sort_order: 0,
  });
  
  const [statsForm, setStatsForm] = useState({
    rating: 0,
    review_count: 0,
    block_visible: 1,
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [quotesData, statsData] = await Promise.all([
        api.reviewQuotes.list(true, false),
        api.reviewStats.get(),
      ]);
      setQuotes(quotesData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = () => {
    setEditingQuote(null);
    setQuoteForm({
      author: '',
      text: '',
      visible: 1,
      sort_order: quotes.length,
    });
    setShowQuoteModal(true);
  };

  const handleEditQuote = (quote: ReviewQuote) => {
    setEditingQuote(quote);
    setQuoteForm({
      author: quote.author,
      text: quote.text,
      visible: quote.visible,
      sort_order: quote.sort_order,
    });
    setShowQuoteModal(true);
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuote) {
        await api.reviewQuotes.update(editingQuote.id, quoteForm);
      } else {
        await api.reviewQuotes.create(quoteForm);
      }
      setShowQuoteModal(false);
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleToggleQuoteVisible = async (quote: ReviewQuote) => {
    try {
      await api.reviewQuotes.update(quote.id, { visible: quote.visible ? 0 : 1 });
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDeleteQuote = async (quote: ReviewQuote, hard = false) => {
    const confirmMsg = hard 
      ? '⚠️ BORRADO PERMANENTE - No se puede recuperar. ¿Confirmar?'
      : '¿Mover a papelera?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      await api.reviewQuotes.delete(quote.id, hard);
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleEditStats = () => {
    if (!stats) return;
    setStatsForm({
      rating: stats.rating,
      review_count: stats.review_count,
      block_visible: stats.block_visible,
    });
    setShowStatsModal(true);
  };

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.reviewStats.update(statsForm);
      setShowStatsModal(false);
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <h1>Reseñas</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Estadísticas</h2>
          <button className="btn btn-secondary" onClick={handleEditStats}>
            Editar
          </button>
        </div>
        
        {stats && (
          <>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Rating Promedio
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--ember)' }}>
                  ⭐ {stats.rating.toFixed(1)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total de Reseñas
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {stats.review_count}+
                </p>
              </div>
            </div>
            
            <div>
              {stats.block_visible === 1 ? (
                <span className="badge badge-visible">Sección visible en sitio</span>
              ) : (
                <span className="badge badge-hidden">Sección oculta en sitio</span>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Citas de Reseñas</h2>
        <button className="btn btn-primary" onClick={handleCreateQuote}>
          + Nueva Cita
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {quotes.map(quote => (
          <div key={quote.id} className={`card ${quote.visible === 0 ? 'item-hidden' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                  "{quote.text}"
                </p>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  — {quote.author}
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px' }}>
                {quote.visible === 1 ? (
                  <span className="badge badge-visible">Visible</span>
                ) : (
                  <span className="badge badge-hidden">Oculto</span>
                )}
                
                <button className="btn btn-secondary" onClick={() => handleEditQuote(quote)}>
                  Editar
                </button>
                <button 
                  className={quote.visible ? 'btn btn-secondary' : 'btn btn-success'}
                  onClick={() => handleToggleQuoteVisible(quote)}
                >
                  {quote.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteQuote(quote, false)}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {quotes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">⭐</div>
          <p>No hay citas de reseñas</p>
        </div>
      )}

      {showQuoteModal && (
        <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingQuote ? 'Editar Cita' : 'Nueva Cita'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveQuote}>
              <div className="form-group">
                <label className="form-label">Autor</label>
                <input
                  type="text"
                  className="form-input"
                  value={quoteForm.author}
                  onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })}
                  required
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Texto de la reseña</label>
                <textarea
                  className="form-textarea"
                  value={quoteForm.text}
                  onChange={(e) => setQuoteForm({ ...quoteForm, text: e.target.value })}
                  rows={4}
                  required
                  placeholder="La experiencia fue excelente..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="form-input"
                  value={quoteForm.sort_order}
                  onChange={(e) => setQuoteForm({ ...quoteForm, sort_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="quote-visible"
                    checked={quoteForm.visible === 1}
                    onChange={(e) => setQuoteForm({ ...quoteForm, visible: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="quote-visible" className="form-label" style={{ marginBottom: 0 }}>
                    Mostrar en sitio público
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteModal(false)}>
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

      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Estadísticas</h2>
            </div>
            
            <form onSubmit={handleSaveStats}>
              <div className="form-group">
                <label className="form-label">Rating Promedio</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  className="form-input"
                  value={statsForm.rating}
                  onChange={(e) => setStatsForm({ ...statsForm, rating: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total de Reseñas</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={statsForm.review_count}
                  onChange={(e) => setStatsForm({ ...statsForm, review_count: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="block-visible"
                    checked={statsForm.block_visible === 1}
                    onChange={(e) => setStatsForm({ ...statsForm, block_visible: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="block-visible" className="form-label" style={{ marginBottom: 0 }}>
                    Mostrar toda la sección de reseñas en sitio público
                  </label>
                </div>
              </div>

              <div className="alert alert-info">
                <strong>Nota:</strong> Si ocultas la sección, las citas individuales no se mostrarán aunque estén marcadas como visibles.
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatsModal(false)}>
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

export default Reviews;
