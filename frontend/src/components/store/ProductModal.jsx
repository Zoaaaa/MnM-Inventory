import { useEffect, useState } from 'react';
import { formatPrice, getProductImage, getMessengerLink } from '../../lib/utils';
import StockBadge from '../ui/StockBadge';

function ProductModal({ product, onClose }) {
  const [messengerPageId, setMessengerPageId] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/config/messenger`)
      .then((res) => res.json())
      .then((json) => {
        setMessengerPageId(json?.data?.pageId || '');
      })
      .catch(() => {
        setMessengerPageId('');
      });
  }, []);

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

  if (!product) return null;

  const messengerLink = getMessengerLink(messengerPageId, product.name);

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

        {/* Product image */}
        <div className="aspect-square bg-gray-100 sm:rounded-t-2xl overflow-hidden">
          <img
            src={getProductImage(product.image_url)}
            alt={product.name}
            className="w-full h-full object-contain p-8"
          />
        </div>

        {/* Product details */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {product.category_name || 'Uncategorized'}
              </p>
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            </div>
            <StockBadge stockStatus={product.stock_status} stock={product.stock} />
          </div>

          <p className="text-2xl font-bold text-primary-600 mb-3">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {product.description}
            </p>
          )}

          {/* Messenger Order Button */}
          {product.stock_status !== 'out_of_stock' ? (
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

export default ProductModal;
