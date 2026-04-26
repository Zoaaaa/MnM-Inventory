import { useState, useEffect } from 'react';
import { categoriesApi } from '../../lib/api';
import toast from 'react-hot-toast';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll(true);
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? Products in this category will become uncategorized.`)) return;
    try {
      await categoriesApi.delete(category.id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await categoriesApi.update(category.id, { is_active: !category.is_active });
      toast.success(`${category.name} ${category.is_active ? 'hidden' : 'visible'}`);
      fetchCategories();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="card divide-y">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`flex items-center justify-between p-4 ${!category.is_active ? 'opacity-50' : ''}`}
            >
              <div>
                <p className="font-medium text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500">Slug: {category.slug} • Order: {category.sort_order}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleActive(category)}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                  title={category.is_active ? 'Hide' : 'Show'}
                >
                  {category.is_active ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  onClick={() => { setEditingCategory(category); setShowForm(true); }}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="text-xs px-2 py-1 rounded hover:bg-red-100"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-center text-gray-500 py-8">No categories yet.</p>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={() => { setShowForm(false); setEditingCategory(null); }}
          onSaved={() => { setShowForm(false); setEditingCategory(null); fetchCategories(); }}
        />
      )}
    </div>
  );
}

function CategoryForm({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...form,
        sort_order: parseInt(form.sort_order),
      };

      if (category) {
        await categoriesApi.update(category.id, data);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(data);
        toast.success('Category created');
      }
      onSaved();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-4">
          {category ? 'Edit Category' : 'Add Category'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Active</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoriesPage;
