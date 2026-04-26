import { useEffect } from 'react';
import { formatPrice, getProductImage } from '../../lib/utils';

const MESSENGER_PAGE_ID = import.meta.env.VITE_MESSENGER_PAGE_ID || '';

function FeaturedModal({ featured, onClose }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!featured) return null;

  const products = featured.products || [];
  const firstProduct = products[0] || null;
  const isBundle = products.length > 1;
  const imageUrl = featured.image_url || (firstProduct && getProductImage(firstProduct.image_url)) || '/logo.jpg';

  // Build messenger message with all product names
  const productNames = products.map((p) => p.name).join(', ');
  const orderMessage = isBundle
    ? `Hi! I'd like to order the bundle: ${featured.title} (${productNames}). Is this still available?`
    : `Hi! I'd like to order: ${featured.title}. Is this still available?`;
  const messengerLink = MESSENGER_PAGE_ID
    ? `https://m.me/${MESSENGER_PAGE_ID}?text=${encodeURIComponent(orderMessage)}`
    : '#';

  // Check if the featured item itself is in stock
  const inStock = featured.stock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur rounded-full p-1.5 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Featured image */}
        <div className="aspect-video bg-gray-900 sm:rounded-t-2xl overflow-hidden relative">
          <img
            src={imageUrl}
            alt={featured.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/logo.jpg'; }}
          />
          {/* Bundle badge */}
          {isBundle && (
            <div className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Bundle • {products.length} items
            </div>
          )}
          {/* Discount badge */}
          {featured.show_original_price && featured.original_price > featured.price && featured.price > 0 && (
            <div className="absolute top-3 right-12 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              {Math.round((1 - featured.price / featured.original_price) * 100)}% OFF
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          {/* Category / Bundle tag */}
          {isBundle ? (
            <p className="text-xs text-primary-600 uppercase tracking-wide font-semibold mb-1">
              Bundle / Promo
            </p>
          ) : firstProduct?.category_name ? (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {firstProduct.category_name}
            </p>
          ) : null}

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{featured.title}</h2>

          {/* Description */}
          {featured.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {featured.description}
            </p>
          )}

          {/* Price */}
          {featured.price > 0 && (
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-2xl font-bold text-primary-600">
                {formatPrice(featured.price)}
              </span>
              {featured.show_original_price && featured.original_price > featured.price && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(featured.original_price)}
                </span>
              )}
            </div>
          )}

          {/* Bundle product list */}
          {isBundle && (
            <div className="mb-5 border rounded-lg divide-y overflow-hidden">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2 bg-gray-50">
                Included in this bundle
              </p>
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                  <img
                    src={getProductImage(p.image_url)}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0 ring-1 ring-gray-200"
                    onError={(e) => { e.target.src = '/logo.jpg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    {p.category_name && (
                      <p className="text-xs text-gray-400">{p.category_name}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-amber-600">{formatPrice(p.price)}</p>
                  </div>
                </div>
              ))}
              {featured.show_original_price && featured.original_price > featured.price && (
                <div className="flex items-center justify-between px-3 py-2 bg-green-50">
                  <span className="text-xs font-medium text-green-700">You save</span>
                  <span className="text-sm font-bold text-green-700">
                    {formatPrice(featured.original_price - featured.price)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Messenger Order Button */}
          {inStock ? (
            <a
              href={messengerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-messenger w-full text-base"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.438 5.503 3.688 7.2V22l3.405-1.868c.907.252 1.871.388 2.907.388 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.062 12.434l-2.545-2.717-4.97 2.717 5.467-5.804 2.609 2.717 4.906-2.717-5.467 5.804z" />
              </svg>
              Message to Order
            </a>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-full font-semibold cursor-not-allowed"
            >
              Currently Unavailable
            </button>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-3">
            Tap to open Messenger and send your order
          </p>
        </div>
      </div>
    </div>
  );
}

export default FeaturedModal;
