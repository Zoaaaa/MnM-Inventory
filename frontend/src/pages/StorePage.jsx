import { useState, useEffect, useMemo, useCallback } from 'react';
import { productsApi, categoriesApi } from '../lib/api';
import { debounce } from '../lib/utils';
import ProductCard from '../components/store/ProductCard';
import ProductModal from '../components/store/ProductModal';
import FeaturedCarousel from '../components/store/FeaturedCarousel';
import FeaturedModal from '../components/store/FeaturedModal';

function StorePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedFeatured, setSelectedFeatured] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    categoriesApi.getAll().then((res) => setCategories(res.data)).catch(console.error);
  }, []);

  // Fetch products with filters
  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({
        category: params.category || '',
        search: params.search || '',
        sort: params.sort || 'name',
        order: params.sort === 'price' ? 'asc' : params.sort === 'newest' ? 'desc' : 'asc',
        limit: 100,
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((search) => {
        fetchProducts({ category: selectedCategory, search, sort: sortBy });
      }, 300),
    [fetchProducts, selectedCategory, sortBy]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (categorySlug) => {
    setSelectedCategory(categorySlug);
    fetchProducts({ category: categorySlug, search: searchQuery, sort: sortBy });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    fetchProducts({ category: selectedCategory, search: searchQuery, sort: value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Featured carousel */}
      <FeaturedCarousel onFeaturedClick={setSelectedFeatured} />

      {/* Hero section */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Speedcube Catalog
        </h2>
        <p className="text-sm text-gray-500">
          Browse our collection • Tap any product to order via Messenger
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort and count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">
          {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
        </p>
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="name">Name A-Z</option>
          <option value="price">Price: Low to High</option>
          <option value="newest">Newest First</option>
          <option value="category">By Category</option>
        </select>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No products found.</p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                fetchProducts();
              }}
              className="text-primary-600 text-sm mt-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={setSelectedProduct}
            />
          ))}
        </div>
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Featured item modal */}
      {selectedFeatured && (
        <FeaturedModal
          featured={selectedFeatured}
          onClose={() => setSelectedFeatured(null)}
        />
      )}
    </div>
  );
}

export default StorePage;
