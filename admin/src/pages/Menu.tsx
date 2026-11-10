import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { MenuCategory, MenuItem, MenuPage } from '../types/api';

type Tab = 'digital' | 'pages';

function Menu() {
  const [activeTab, setActiveTab] = useState<Tab>('digital');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<MenuPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveImageSrc = (r2Key: string | undefined): string => {
    if (!r2Key) return '/media/placeholder.jpg';
    if (r2Key.startsWith('/') || r2Key.startsWith('http://') || r2Key.startsWith('https://')) {
      return r2Key;
    }
    return `/media/${r2Key}`;
  };
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingPage, setEditingPage] = useState<MenuPage | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({ title: '', visible: 1, sort_order: 0 });
  const [itemForm, setItemForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: 0,
    badge: '',
    visible: 1,
    sort_order: 0,
  });
  const [pageForm, setPageForm] = useState({ title: '', r2_key: '', visible: 1, sort_order: 0 });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [categoriesData, itemsData, pagesData] = await Promise.all([
        api.menuCategories.list(true, false),
        api.menuItems.list(true, false),
        api.menuPages.list(true, false),
      ]);
      setCategories(categoriesData);
      setItems(itemsData);
      setPages(pagesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar menú');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategoryVisible = async (category: MenuCategory) => {
    try {
      await api.menuCategories.update(category.id, { visible: category.visible ? 0 : 1 });
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleToggleItemVisible = async (item: MenuItem) => {
    try {
      await api.menuItems.update(item.id, { visible: item.visible ? 0 : 1 });
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleTogglePageVisible = async (page: MenuPage) => {
    try {
      await api.menuPages.update(page.id, { visible: page.visible ? 0 : 1 });
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleBulkPagesVisible = async (visible: number) => {
    try {
      await Promise.all(pages.map(page => api.menuPages.update(page.id, { visible })));
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.menuCategories.update(editingCategory.id, categoryForm);
      } else {
        await api.menuCategories.create(categoryForm);
      }
      setShowCategoryModal(false);
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.menuItems.update(editingItem.id, itemForm);
      } else {
        await api.menuItems.create(itemForm);
      }
      setShowItemModal(false);
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await api.menuPages.update(editingPage.id, pageForm);
      } else {
        await api.menuPages.create(pageForm);
      }
      setShowPageModal(false);
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getItemsByCategory = (categoryId: string) => items.filter(i => i.category_id === categoryId);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="container">
      <h1>Menú</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginTop: '2rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)' }}>
        <button
          className={`btn ${activeTab === 'digital' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '4px 4px 0 0', marginRight: '0.5rem' }}
          onClick={() => setActiveTab('digital')}
        >
          Menú Digital
        </button>
        <button
          className={`btn ${activeTab === 'pages' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '4px 4px 0 0' }}
          onClick={() => setActiveTab('pages')}
        >
          Carta PNG
        </button>
      </div>

      {activeTab === 'digital' && (
        <>
          <div className="action-buttons-top">
            <button className="btn btn-primary" onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ title: '', visible: 1, sort_order: 0 });
              setShowCategoryModal(true);
            }}>
              + Nueva Categoría
            </button>
            <button className="btn btn-primary" onClick={() => {
              setEditingItem(null);
              setItemForm({
                category_id: categories[0]?.id || '',
                name: '',
                description: '',
                price: 0,
                badge: '',
                visible: 1,
                sort_order: 0,
              });
              setShowItemModal(true);
            }}>
              + Nuevo Item
            </button>
          </div>

          {categories.map(category => {
            const categoryItems = getItemsByCategory(category.id);
            const isCategoryHidden = category.visible === 0;
            
            return (
              <div key={category.id} className={`card ${isCategoryHidden ? 'item-hidden' : ''}`} style={{ marginBottom: '2rem' }}>
                <div className="category-header">
                  <h2>{category.title}</h2>
                  <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={() => {
                      setEditingCategory(category);
                      setCategoryForm({
                        title: category.title,
                        visible: category.visible,
                        sort_order: category.sort_order,
                      });
                      setShowCategoryModal(true);
                    }}>
                      Editar
                    </button>
                    <button 
                      className={category.visible ? 'btn btn-secondary' : 'btn btn-success'}
                      onClick={() => handleToggleCategoryVisible(category)}
                    >
                      {category.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
                    </button>
                  </div>
                </div>

                {isCategoryHidden && (
                  <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                    ⚠️ Categoría oculta - Todos los items serán invisibles aunque estén marcados como visibles
                  </div>
                )}

                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Precio</th>
                        <th>Badge</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                    {categoryItems.map(item => {
                      const isEffectivelyHidden = isCategoryHidden || item.visible === 0;
                      
                      return (
                        <tr key={item.id} className={isEffectivelyHidden ? 'item-hidden' : ''}>
                          <td>
                            {item.name}
                            {isCategoryHidden && item.visible === 1 && (
                              <span 
                                className="tooltip cascaded-hidden" 
                                data-tooltip="Categoría oculta - item no será público"
                                style={{ marginLeft: '0.5rem' }}
                              >
                                ⚠️
                              </span>
                            )}
                          </td>
                          <td>{item.price ? `Gs ${item.price.toLocaleString()}` : '-'}</td>
                          <td>{item.badge || '-'}</td>
                          <td>
                            {item.visible === 1 ? (
                              <span className="badge badge-visible">Visible</span>
                            ) : (
                              <span className="badge badge-hidden">Oculto</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-secondary" onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  category_id: item.category_id,
                                  name: item.name,
                                  description: item.description || '',
                                  price: item.price || 0,
                                  badge: item.badge || '',
                                  visible: item.visible,
                                  sort_order: item.sort_order,
                                });
                                setShowItemModal(true);
                              }}>
                                Editar
                              </button>
                              <button 
                                className={item.visible ? 'btn btn-secondary' : 'btn btn-success'}
                                onClick={() => handleToggleItemVisible(item)}
                              >
                                {item.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-card-list">
                  {categoryItems.map(item => {
                    const isEffectivelyHidden = isCategoryHidden || item.visible === 0;
                    
                    return (
                      <div key={item.id} className={`mobile-card-item ${isEffectivelyHidden ? 'item-hidden' : ''}`}>
                        <div className="mobile-card-row">
                          <span className="mobile-card-label">Nombre</span>
                          <span className="mobile-card-value">
                            {item.name}
                            {isCategoryHidden && item.visible === 1 && (
                              <span style={{ marginLeft: '0.5rem', color: 'var(--warning)' }}>
                                ⚠️
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {item.description && (
                          <div className="mobile-card-row">
                            <span className="mobile-card-label">Descripción</span>
                            <span className="mobile-card-value">{item.description}</span>
                          </div>
                        )}
                        
                        <div className="mobile-card-row">
                          <span className="mobile-card-label">Precio</span>
                          <span className="mobile-card-value">{item.price ? `Gs ${item.price.toLocaleString()}` : '-'}</span>
                        </div>
                        
                        {item.badge && (
                          <div className="mobile-card-row">
                            <span className="mobile-card-label">Badge</span>
                            <span className="mobile-card-value">{item.badge}</span>
                          </div>
                        )}
                        
                        <div className="mobile-card-row">
                          <span className="mobile-card-label">Estado</span>
                          <div>
                            {item.visible === 1 ? (
                              <span className="badge badge-visible">Visible</span>
                            ) : (
                              <span className="badge badge-hidden">Oculto</span>
                            )}
                          </div>
                        </div>
                        
                        {isCategoryHidden && item.visible === 1 && (
                          <div className="alert alert-warning" style={{ fontSize: '0.75rem', padding: '0.5rem', marginTop: '0.5rem' }}>
                            ⚠️ Categoría oculta - item no será público
                          </div>
                        )}
                        
                        <div className="mobile-card-actions">
                          <button className="btn btn-secondary" onClick={() => {
                            setEditingItem(item);
                            setItemForm({
                              category_id: item.category_id,
                              name: item.name,
                              description: item.description || '',
                              price: item.price || 0,
                              badge: item.badge || '',
                              visible: item.visible,
                              sort_order: item.sort_order,
                            });
                            setShowItemModal(true);
                          }}>
                            Editar
                          </button>
                          <button 
                            className={item.visible ? 'btn btn-secondary' : 'btn btn-success'}
                            onClick={() => handleToggleItemVisible(item)}
                          >
                            {item.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {categoryItems.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                    No hay items en esta categoría
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}

      {activeTab === 'pages' && (
        <>
          <div className="action-buttons-top">
            <button className="btn btn-primary" onClick={() => {
              setEditingPage(null);
              setPageForm({ title: '', r2_key: '', visible: 1, sort_order: 0 });
              setShowPageModal(true);
            }}>
              + Nueva Página
            </button>
            <button className="btn btn-success" onClick={() => handleBulkPagesVisible(1)}>
              Mostrar Todas
            </button>
            <button className="btn btn-secondary" onClick={() => handleBulkPagesVisible(0)}>
              Ocultar Todas
            </button>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Imagen</th>
                  <th>Estado</th>
                  <th>Orden</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page.id} className={page.visible === 0 ? 'item-hidden' : ''}>
                    <td>{page.title}</td>
                    <td>
                      <img src={resolveImageSrc(page.r2_key)} alt={page.title} className="image-preview" />
                    </td>
                    <td>
                      {page.visible === 1 ? (
                        <span className="badge badge-visible">Visible</span>
                      ) : (
                        <span className="badge badge-hidden">Oculto</span>
                      )}
                    </td>
                    <td>{page.sort_order}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => {
                          setEditingPage(page);
                          setPageForm({
                            title: page.title,
                            r2_key: page.r2_key,
                            visible: page.visible,
                            sort_order: page.sort_order,
                          });
                          setShowPageModal(true);
                        }}>
                          Editar
                        </button>
                        <button 
                          className={page.visible ? 'btn btn-secondary' : 'btn btn-success'}
                          onClick={() => handleTogglePageVisible(page)}
                        >
                          {page.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="mobile-card-list">
              {pages.map(page => (
                <div key={page.id} className={`mobile-card-item ${page.visible === 0 ? 'item-hidden' : ''}`}>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Título</span>
                    <span className="mobile-card-value">{page.title}</span>
                  </div>
                  
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Imagen</span>
                    <img 
                      src={resolveImageSrc(page.r2_key)} 
                      alt={page.title} 
                      style={{ width: '100%', maxWidth: '200px', height: 'auto', borderRadius: '4px', border: '1px solid var(--border)', marginTop: '0.5rem' }}
                    />
                  </div>
                  
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Estado</span>
                    <div>
                      {page.visible === 1 ? (
                        <span className="badge badge-visible">Visible</span>
                      ) : (
                        <span className="badge badge-hidden">Oculto</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Orden</span>
                    <span className="mobile-card-value">{page.sort_order}</span>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <button className="btn btn-secondary" onClick={() => {
                      setEditingPage(page);
                      setPageForm({
                        title: page.title,
                        r2_key: page.r2_key,
                        visible: page.visible,
                        sort_order: page.sort_order,
                      });
                      setShowPageModal(true);
                    }}>
                      Editar
                    </button>
                    <button 
                      className={page.visible ? 'btn btn-secondary' : 'btn btn-success'}
                      onClick={() => handleTogglePageVisible(page)}
                    >
                      {page.visible ? '👁️ Ocultar' : '👁️ Mostrar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="form-input"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="category-visible"
                    checked={categoryForm.visible === 1}
                    onChange={(e) => setCategoryForm({ ...categoryForm, visible: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="category-visible" className="form-label" style={{ marginBottom: 0 }}>
                    Mostrar categoría
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
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

      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem ? 'Editar Item' : 'Nuevo Item'}
              </h2>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={itemForm.category_id}
                  onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-textarea"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Precio (Gs)</label>
                <input
                  type="number"
                  className="form-input"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Badge</label>
                <input
                  type="text"
                  className="form-input"
                  value={itemForm.badge}
                  onChange={(e) => setItemForm({ ...itemForm, badge: e.target.value })}
                  placeholder="Premium, Nuevo, etc."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="form-input"
                  value={itemForm.sort_order}
                  onChange={(e) => setItemForm({ ...itemForm, sort_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="item-visible"
                    checked={itemForm.visible === 1}
                    onChange={(e) => setItemForm({ ...itemForm, visible: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="item-visible" className="form-label" style={{ marginBottom: 0 }}>
                    Mostrar item
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
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

      {showPageModal && (
        <div className="modal-overlay" onClick={() => setShowPageModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPage ? 'Editar Página' : 'Nueva Página'}
              </h2>
            </div>
            <form onSubmit={handleSavePage}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input
                  type="text"
                  className="form-input"
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">R2 Key (ruta de imagen)</label>
                <input
                  type="text"
                  className="form-input"
                  value={pageForm.r2_key}
                  onChange={(e) => setPageForm({ ...pageForm, r2_key: e.target.value })}
                  required
                  placeholder="menu-pages/page-01.png"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="form-input"
                  value={pageForm.sort_order}
                  onChange={(e) => setPageForm({ ...pageForm, sort_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="page-visible"
                    checked={pageForm.visible === 1}
                    onChange={(e) => setPageForm({ ...pageForm, visible: e.target.checked ? 1 : 0 })}
                  />
                  <label htmlFor="page-visible" className="form-label" style={{ marginBottom: 0 }}>
                    Mostrar página
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPageModal(false)}>
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

export default Menu;
