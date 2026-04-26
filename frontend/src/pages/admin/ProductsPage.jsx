import { useState, useEffect } from 'react';
import { productsApi, categoriesApi } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import StockBadge from '../../components/ui/StockBadge';
import toast from 'react-hot-toast';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filter, setFilter] = useState('all'); // all, low_stock, out_of_stock
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll({ active_only: 'false', limit: 200 });
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchProducts(),
      categoriesApi.getAll(true).then((res) => setCategories(res.data)),
    ]);
  }, []);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await productsApi.delete(product.id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleQuickStock = async (product, newStock) => {
    try {
      await productsApi.updateStock(product.id, parseInt(newStock));
      toast.success(`Stock updated for ${product.name}`);
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await productsApi.update(product.id, { is_active: !product.is_active });
      toast.success(`${product.name} ${product.is_active ? 'hidden' : 'visible'}`);
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (filter === 'low_stock') return p.stock_status === 'low_stock';
    if (filter === 'out_of_stock') return p.stock_status === 'out_of_stock';
    if (filter === 'hidden') return !p.is_active;
    return true;
  }).filter((p) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'uncategorized') return !p.category_id;
    return String(p.category_id) === categoryFilter;
  }).filter((p) => {
    if (!searchQuery) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">
            {filteredProducts.length === products.length
              ? `${products.length} total products`
              : `${filteredProducts.length} of ${products.length} products`}
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
          ))}
          <option value="uncategorized">Uncategorized</option>
        </select>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {/* Products table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Product</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                <th className="text-right p-3 font-medium text-gray-600">Price</th>
                <th className="text-center p-3 font-medium text-gray-600">Stock</th>
                <th className="text-center p-3 font-medium text-gray-600">Status</th>
                <th className="text-right p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${!product.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500 sm:hidden">{product.category_name}</p>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-gray-600">
                    {product.category_name || '—'}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatPrice(product.price)}
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(e) => handleQuickStock(product, e.target.value)}
                      className="w-16 text-center border rounded px-1 py-0.5 text-sm"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <StockBadge stockStatus={product.stock_status} stock={product.stock} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                        title={product.is_active ? 'Hide' : 'Show'}
                      >
                        {product.is_active ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        onClick={() => { setEditingProduct(product); setShowForm(true); }}
                        className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-xs px-2 py-1 rounded hover:bg-red-100"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <p className="text-center text-gray-500 py-8">No products found.</p>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}

/**
 * Product Create/Edit Form Modal
 */
function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    price: product?.price || '',
    stock: product?.stock || 0,
    low_stock_threshold: product?.low_stock_threshold || 5,
    image_url: product?.image_url || '',
    is_active: product?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.image_url || '');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Update preview when URL changes
    if (name === 'image_url') {
      setImagePreview(value);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    setUploading(true);
    try {
      const response = await productsApi.uploadImage(file);
      const uploadedUrl = response.data.image_url;
      setForm((prev) => ({ ...prev, image_url: uploadedUrl }));
      setImagePreview(uploadedUrl);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
      setImagePreview(form.image_url);
    } finally {
      setUploading(false);
      // Clean up the object URL
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image_url: '' }));
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        low_stock_threshold: parseInt(form.low_stock_threshold),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      };

      if (product) {
        await productsApi.update(product.id, data);
        toast.success('Product updated');
      } else {
        await productsApi.create(data);
        toast.success('Product created');
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
      <div className="relative bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input-field"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (PHP) *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input
                name="low_stock_threshold"
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>

            {/* Image mode toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  imageMode === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  imageMode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Upload Image
              </button>
            </div>

            {imageMode === 'url' ? (
              <input
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                className="input-field"
                placeholder="https://..."
              />
            ) : (
              <div className="space-y-2">
                <label
                  className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploading
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    {uploading ? (
                      <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-blue-600">Click to upload</span> an image
                        </p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}

            {/* Image preview */}
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                  onError={(e) => { e.target.style.display = 'none'; }}
                  onLoad={(e) => { e.target.style.display = 'block'; }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Visible in store</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
              {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
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

export default ProductsPage;
