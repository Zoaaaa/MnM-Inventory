import { useState, useEffect } from 'react';
import { featuredApi, productsApi } from '../../lib/api';
import { formatPrice, getProductImage } from '../../lib/utils';
import toast from 'react-hot-toast';

function FeaturedPage() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await featuredApi.adminGetAll();
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load featured items');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll({ active_only: 'false', limit: 200 });
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  useEffect(() => {
    Promise.all([fetchItems(), fetchProducts()]);
  }, []);

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from featured? This cannot be undone.`)) return;
    try {
      await featuredApi.delete(item.id);
      toast.success('Featured item removed');
      fetchItems();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await featuredApi.update(item.id, { is_active: !item.is_active });
      toast.success(`${item.title} ${item.is_active ? 'hidden' : 'visible'}`);
      fetchItems();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    const order = newItems.map((item, i) => ({ id: item.id, sort_order: i }));
    try {
      await featuredApi.reorder(order);
      setItems(newItems.map((item, i) => ({ ...item, sort_order: i })));
      toast.success('Order updated');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleMoveDown = async (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    const order = newItems.map((item, i) => ({ id: item.id, sort_order: i }));
    try {
      await featuredApi.reorder(order);
      setItems(newItems.map((item, i) => ({ ...item, sort_order: i })));
      toast.success('Order updated');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Featured Carousel</h1>
          <p className="text-sm text-gray-500">
            Manage the featured items displayed on the storefront carousel
          </p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          + Add Featured Item
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-2">No featured items yet.</p>
          <p className="text-sm text-gray-400">
            Add products to the carousel to highlight them on the storefront.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`card flex items-center gap-4 p-4 ${!item.is_active ? 'opacity-50' : ''}`}
            >
              {/* Sort order controls */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Image thumbnail */}
              <img
                src={item.image_url || (item.products?.[0] && getProductImage(item.products[0].image_url)) || '/cube.svg'}
                alt={item.title}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                onError={(e) => { e.target.src = '/cube.svg'; }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                  {item.products?.length > 1 && (
                    <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                      Bundle • {item.products.length} items
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 truncate">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.products?.map((p) => (
                    <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {p.name}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm font-medium text-primary-600">
                    {formatPrice(item.price)}
                  </span>
                  {item.show_original_price && item.original_price > item.price && (
                    <>
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(item.original_price)}
                      </span>
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                        {Math.round((1 - item.price / item.original_price) * 100)}% OFF
                      </span>
                    </>
                  )}
                  <span className="text-xs text-gray-400">•</span>
                  <span className={`text-xs ${item.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(item)}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                  title={item.is_active ? 'Hide' : 'Show'}
                >
                  {item.is_active ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  onClick={() => { setEditingItem(item); setShowForm(true); }}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-200"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="text-xs px-2 py-1 rounded hover:bg-red-100"
                  title="Remove"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <FeaturedForm
          item={editingItem}
          products={products}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSaved={() => { setShowForm(false); setEditingItem(null); fetchItems(); }}
        />
      )}
    </div>
  );
}

/**
 * Featured Item Create/Edit Form Modal
 */
function FeaturedForm({ item, products, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    image_url: item?.image_url || '',
    price: item?.price || '',
    stock: item?.stock ?? 0,
    show_original_price: item?.show_original_price ?? false,
    is_active: item?.is_active ?? true,
  });
  const [selectedProductIds, setSelectedProductIds] = useState(
    item?.product_ids || []
  );
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Image upload state
  const [imageMode, setImageMode] = useState(item?.image_url ? 'custom' : 'auto');
  const [imageInputMode, setImageInputMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(item?.image_url || '');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'image_url') {
      setImagePreview(value);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, and WebP images are allowed');
      return;
    }

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
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image_url: '' }));
    setImagePreview('');
  };

  const toggleProduct = (productId) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  // Auto-fill title and price when first product is selected (only for new items)
  useEffect(() => {
    if (!item && selectedProductIds.length === 1 && !form.title) {
      const p = products.find((p) => p.id === selectedProductIds[0]);
      if (p) {
        setForm((prev) => ({
          ...prev,
          title: p.name,
          description: prev.description || p.description || '',
          price: prev.price || p.price,
        }));
      }
    }
  }, [selectedProductIds, item, products, form.title]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (selectedProductIds.length === 0) {
        toast.error('Please select at least one product');
        setSaving(false);
        return;
      }

      if (!form.title.trim()) {
        toast.error('Title is required');
        setSaving(false);
        return;
      }

      if (!form.price || parseFloat(form.price) < 0) {
        toast.error('Valid price is required');
        setSaving(false);
        return;
      }

      const data = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10) || 0,
        product_ids: selectedProductIds,
        image_url: imageMode === 'custom' ? form.image_url : '',
      };

      if (item) {
        await featuredApi.update(item.id, data);
        toast.success('Featured item updated');
      } else {
        await featuredApi.create(data);
        toast.success('Featured item added');
      }
      onSaved();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category_name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Selected products details
  const selectedProducts = selectedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);
  const originalPrice = selectedProducts.reduce((sum, p) => sum + parseFloat(p.price), 0);

  // Preview image
  const previewImage = imageMode === 'custom' && imagePreview
    ? imagePreview
    : selectedProducts[0]
      ? getProductImage(selectedProducts[0].image_url)
      : '/cube.svg';

  const currentPrice = parseFloat(form.price) || 0;
  const hasDiscount = form.show_original_price && originalPrice > currentPrice && currentPrice > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">
          {item ? 'Edit Featured Item' : 'Add Featured Item'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Products * <span className="text-gray-400 font-normal">({selectedProductIds.length} selected)</span>
            </label>

            {/* Selected products chips */}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedProducts.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full"
                  >
                    <img
                      src={getProductImage(p.image_url)}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    {p.name} — {formatPrice(p.price)}
                    <button
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className="ml-0.5 text-primary-500 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedProducts.length > 1 && (
                  <span className="text-xs text-gray-500 self-center ml-1">
                    Individual total: {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
            )}

            {/* Search */}
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field mb-2"
            />

            {/* Product list with checkboxes */}
            <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-400 p-3 text-center">No products found</p>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-primary-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded text-primary-600"
                      />
                      <img
                        src={getProductImage(p.image_url)}
                        alt=""
                        className="w-8 h-8 rounded object-cover bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.category_name || 'Uncategorized'} • Stock: {p.stock}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                        {formatPrice(p.price)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Bundle Deal: 3x3 Starter Pack"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              This is the headline shown in the carousel
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input-field"
              rows={3}
              placeholder="Describe the featured item, promo, or bundle..."
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (PHP) *
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="input-field"
              placeholder="0.00"
              required
            />
            {selectedProducts.length > 1 && (
              <p className="text-xs text-gray-400 mt-1">
                Individual items total: {formatPrice(originalPrice)}
                {currentPrice > 0 && currentPrice < originalPrice && (
                  <span className="text-red-500 font-medium ml-1">
                    — Save {formatPrice(originalPrice - currentPrice)} ({Math.round((1 - currentPrice / originalPrice) * 100)}% off)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              className="input-field"
              placeholder="0"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Number of bundles/promos available. Set to 0 to mark as out of stock.
            </p>
          </div>

          {/* Show original price toggle */}
          <div className="flex items-center gap-2">
            <input
              name="show_original_price"
              type="checkbox"
              checked={form.show_original_price}
              onChange={handleChange}
              className="rounded"
            />
            <label className="text-sm text-gray-700">
              Show original price <span className="text-gray-400">(strikethrough to show discount)</span>
            </label>
          </div>

          {/* Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carousel Image</label>

            {/* Auto vs Custom toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => setImageMode('auto')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  imageMode === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Use Product Image
              </button>
              <button
                type="button"
                onClick={() => setImageMode('custom')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  imageMode === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Custom Image
              </button>
            </div>

            {imageMode === 'auto' && (
              <p className="text-xs text-gray-400">
                The first product's image will be used automatically
              </p>
            )}

            {imageMode === 'custom' && (
              <>
                {/* URL vs Upload toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                      imageInputMode === 'url'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                      imageInputMode === 'upload'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Upload Image
                  </button>
                </div>

                {imageInputMode === 'url' ? (
                  <input
                    name="image_url"
                    value={form.image_url}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://..."
                  />
                ) : (
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
                )}

                {/* Image preview */}
                {imagePreview && imageMode === 'custom' && (
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
              </>
            )}
          </div>

          {/* Preview */}
          {selectedProducts.length > 0 && (
            <div className="rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900 p-4">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Preview</p>
              <div className="flex gap-3">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-20 h-20 rounded-lg object-cover bg-gray-700 flex-shrink-0"
                  onError={(e) => { e.target.src = '/cube.svg'; }}
                />
                <div className="text-white min-w-0 flex-1">
                  <h4 className="font-bold text-sm truncate">{form.title || 'Untitled'}</h4>
                  {form.description && (
                    <p className="text-xs text-gray-300 truncate mt-0.5">{form.description}</p>
                  )}
                  {selectedProducts.length > 1 && (
                    <div className="mt-1 space-y-0.5">
                      {selectedProducts.slice(0, 3).map((p) => (
                        <p key={p.id} className="text-[10px] text-gray-400 truncate">
                          {p.name} — {formatPrice(p.price)}
                        </p>
                      ))}
                      {selectedProducts.length > 3 && (
                        <p className="text-[10px] text-gray-500">
                          +{selectedProducts.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-primary-400 font-bold text-sm">
                      {currentPrice > 0 ? formatPrice(currentPrice) : '—'}
                    </p>
                    {hasDiscount && (
                      <>
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                        <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                          {Math.round((1 - currentPrice / originalPrice) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Visible in carousel</label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
              {saving ? 'Saving...' : item ? 'Update' : 'Add to Carousel'}
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

export default FeaturedPage;
