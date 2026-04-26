import { formatPrice, getProductImage } from '../../lib/utils';
import StockBadge from '../ui/StockBadge';

function ProductCard({ product, onClick }) {
  return (
    <button
      onClick={() => onClick(product)}
      className="card text-left w-full hover:shadow-md transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      {/* Product image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <img
          src={getProductImage(product.image_url)}
          alt={product.name}
          className="w-full h-full object-contain p-4"
          loading="lazy"
        />
        {product.stock_status === 'out_of_stock' && (
          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3">
        <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-0.5">
          {product.category_name || 'Uncategorized'}
        </p>
        <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-1.5 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(product.price)}
          </span>
          <StockBadge stockStatus={product.stock_status} stock={product.stock} />
        </div>
      </div>
    </button>
  );
}

export default ProductCard;
