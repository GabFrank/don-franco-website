import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { ContactInfo } from '../types/api';

function Contact() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    whatsapp: '',
    address: '',
    hours: '',
  });

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      setLoading(true);
      const data = await api.contactInfo.get();
      setContactInfo(data);
      setFormData({
        whatsapp: data.whatsapp,
        address: data.address,
        hours: data.hours,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar información de contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.contactInfo.update(formData);
      setEditing(false);
      loadContactInfo();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (contactInfo) {
      setFormData({
        whatsapp: contactInfo.whatsapp,
        address: contactInfo.address,
        hours: contactInfo.hours,
      });
    }
    setEditing(false);
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Información de Contacto</h1>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            Editar
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
        <strong>Nota:</strong> La información de contacto siempre es visible en el sitio público (no tiene opción "Mostrar/Ocultar").
      </div>

      {!editing ? (
        <div className="card">
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                WhatsApp
              </h3>
              <p style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                {contactInfo?.whatsapp}
              </p>
              <a 
                href={`https://wa.me/${contactInfo?.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success"
                style={{ marginTop: '0.5rem' }}
              >
                Abrir en WhatsApp
              </a>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                Dirección
              </h3>
              <p style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                {contactInfo?.address}
              </p>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                Horarios
              </h3>
              <pre style={{ 
                fontSize: '1rem', 
                fontWeight: 500, 
                fontFamily: 'inherit',
                whiteSpace: 'pre-wrap',
                backgroundColor: 'var(--bg-primary)',
                padding: '1rem',
                borderRadius: '4px',
              }}>
                {contactInfo?.hours}
              </pre>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                Última actualización
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {contactInfo?.updated_at 
                  ? new Date(contactInfo.updated_at * 1000).toLocaleString('es-PY')
                  : '-'
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input
                type="text"
                className="form-input"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
                placeholder="+595 981 123456"
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Incluye el código de país (ej: +595 para Paraguay)
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="Av. Principal 1234, Asunción"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horarios</label>
              <textarea
                className="form-textarea"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                rows={6}
                required
                placeholder={`Lunes a Jueves: 18:00 - 00:00
Viernes y Sábado: 18:00 - 01:00
Domingo: 18:00 - 23:00`}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Un horario por línea. Se mostrará exactamente como lo escribas.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Contact;
