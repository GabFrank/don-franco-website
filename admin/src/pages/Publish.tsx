import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { PublishLog } from '../types/api';

function Publish() {
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [currentPublish, setCurrentPublish] = useState<PublishLog | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  useEffect(() => {
    loadLogs();
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.publish.getLog();
      setLogs(data);
      setError(null);
      
      const pending = data.find(log => log.status === 'pending' || log.status === 'building');
      if (pending && !currentPublish) {
        setCurrentPublish(pending);
        startPolling(pending.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar log de publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (publishId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = setInterval(async () => {
      try {
        const status = await api.publish.getStatus(publishId);
        setCurrentPublish(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setPublishing(false);
          setCurrentPublish(null);
          loadLogs();
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 10000);
    
    setPollingInterval(interval);
  };

  const handlePublish = async () => {
    if (!confirm('¿Publicar cambios al sitio público? Este proceso tarda 1-2 minutos.')) {
      return;
    }
    
    try {
      setPublishing(true);
      const publishLog = await api.publish.trigger();
      setCurrentPublish(publishLog);
      startPolling(publishLog.id);
      loadLogs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al iniciar publicación');
      setPublishing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge badge-visible';
      case 'failed':
        return 'badge badge-deleted';
      case 'building':
        return 'badge badge-hidden';
      case 'pending':
        return 'badge badge-hidden';
      default:
        return 'badge';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Falló';
      case 'building':
        return 'Construyendo...';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const formatDuration = (createdAt: number, completedAt: number | null) => {
    if (!completedAt) return '-';
    const durationMs = (completedAt - createdAt) * 1000;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <h1>Publicar Cambios</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
        <strong>⚠️ Importante:</strong> Los cambios no se reflejan en el sitio público hasta que presiones "Publicar". 
        El proceso de publicación tarda aproximadamente 1-2 minutos.
      </div>

      {currentPublish && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'rgba(232, 93, 4, 0.05)' }}>
          <h2 style={{ marginBottom: '1rem' }}>🚀 Publicación en Curso</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="spinner"></div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {getStatusText(currentPublish.status)}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Iniciado: {new Date(currentPublish.created_at * 1000).toLocaleString('es-PY')}
              </p>
              {currentPublish.status === 'building' && (
                <p style={{ fontSize: '0.875rem', color: 'var(--ember)', marginTop: '0.5rem' }}>
                  Esto puede tardar 1-2 minutos. La página se actualizará automáticamente.
                </p>
              )}
            </div>
          </div>

          {currentPublish.status === 'failed' && (
            <div className="alert alert-error">
              <strong>Error:</strong> La publicación falló. Revisa los logs o intenta nuevamente.
            </div>
          )}

          {currentPublish.status === 'completed' && (
            <div className="alert alert-success">
              <strong>✓ Completado!</strong> Los cambios están ahora visibles en el sitio público.
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <button 
          className="btn btn-primary"
          style={{ fontSize: '1.125rem', padding: '1rem 2rem', width: '100%' }}
          onClick={handlePublish}
          disabled={publishing || !!currentPublish}
        >
          {publishing || currentPublish ? '🚀 Publicando...' : '🚀 Publicar Cambios'}
        </button>
        
        {logs.length > 0 && logs[0].status === 'completed' && (
          <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Última publicación: {new Date(logs[0].created_at * 1000).toLocaleString('es-PY')} por {logs[0].user_email}
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Historial de Publicaciones</h2>
        
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No hay publicaciones previas</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Duración</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>
                        {new Date(log.created_at * 1000).toLocaleString('es-PY')}
                      </td>
                      <td>{log.user_email}</td>
                      <td>
                        <span className={getStatusBadgeClass(log.status)}>
                          {getStatusText(log.status)}
                        </span>
                      </td>
                      <td>
                        {formatDuration(log.created_at, log.completed_at)}
                      </td>
                      <td>
                        {log.webhook_response && (
                          <details>
                            <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>
                              Ver respuesta
                            </summary>
                            <pre style={{ 
                              fontSize: '0.75rem', 
                              backgroundColor: 'var(--bg-primary)', 
                              padding: '0.5rem',
                              borderRadius: '4px',
                              marginTop: '0.5rem',
                              overflow: 'auto',
                              maxHeight: '200px',
                            }}>
                              {JSON.stringify(JSON.parse(log.webhook_response), null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-list">
              {logs.map(log => (
                <div key={log.id} className="mobile-card-item">
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Fecha y Hora</span>
                    <span className="mobile-card-value">
                      {new Date(log.created_at * 1000).toLocaleString('es-PY')}
                    </span>
                  </div>
                  
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Usuario</span>
                    <span className="mobile-card-value">{log.user_email}</span>
                  </div>
                  
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Estado</span>
                    <div>
                      <span className={getStatusBadgeClass(log.status)}>
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Duración</span>
                    <span className="mobile-card-value">
                      {formatDuration(log.created_at, log.completed_at)}
                    </span>
                  </div>
                  
                  {log.webhook_response && (
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600 }}>
                        Ver respuesta
                      </summary>
                      <pre style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--bg-primary)', 
                        padding: '0.5rem',
                        borderRadius: '4px',
                        marginTop: '0.5rem',
                        overflow: 'auto',
                        maxHeight: '200px',
                      }}>
                        {JSON.stringify(JSON.parse(log.webhook_response), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="alert alert-info" style={{ marginTop: '2rem' }}>
        <strong>💡 Consejo:</strong> Verifica tus cambios en el admin antes de publicar. Una vez publicado, 
        los cambios serán visibles para todos los visitantes del sitio.
      </div>
    </div>
  );
}

export default Publish;
