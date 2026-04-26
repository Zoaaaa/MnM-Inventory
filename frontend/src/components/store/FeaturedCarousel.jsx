import { useState, useEffect, useCallback } from 'react';
import { featuredApi } from '../../lib/api';
import { formatPrice, getProductImage } from '../../lib/utils';

function FeaturedCarousel({ onFeaturedClick }) {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    featuredApi.getAll()
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-advance every 5 seconds
  const nextSlide = useCallback(() => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (isPaused || items.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused, items.length]);

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (loading) {
    return (
      <div className="mb-6 rounded-xl overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900 animate-pulse">
        <div className="h-[280px] sm:h-[320px] lg:h-[360px]" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const current = items[activeIndex];
  const products = current.products || [];
  const firstProduct = products[0] || null;
  const isBundle = products.length > 1;

  // Use custom image, or first product image, or fallback
  const imageUrl = current.image_url || (firstProduct && getProductImage(firstProduct.image_url)) || '/cube.svg';

  return (
    <div
      className="mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex flex-col lg:flex-row">
        {/* Main slide area */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-[280px] sm:min-h-[320px] lg:min-h-[360px]">
          {/* Image side */}
          <div className="relative sm:w-1/2 lg:w-3/5 flex-shrink-0 bg-black/20">
            <div className="relative w-full h-48 sm:h-full overflow-hidden">
              <img
                key={current.id}
                src={imageUrl}
                alt={current.title}
                className="w-full h-full object-cover transition-opacity duration-500"
                onError={(e) => { e.target.src = '/cube.svg'; }}
              />
              {/* Gradient overlay for text readability on mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-gray-900/60" />

              {/* Bundle badge */}
              {isBundle && (
                <div className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Bundle • {products.length} items
                </div>
              )}
            </div>

            {/* Navigation arrows */}
            {items.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Previous slide"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => { nextSlide(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Next slide"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Description side */}
          <div className="flex-1 p-5 sm:p-6 lg:p-8 flex flex-col justify-center text-white overflow-y-auto">
            {/* Category tag for single product */}
            {!isBundle && firstProduct?.category_name && (
              <span className="inline-block text-[11px] uppercase tracking-wider text-primary-400 font-semibold mb-2">
                {firstProduct.category_name}
              </span>
            )}

            {/* Bundle tag */}
            {isBundle && (
              <span className="inline-block text-[11px] uppercase tracking-wider text-primary-400 font-semibold mb-2">
                Bundle / Promo
              </span>
            )}

            {/* Title */}
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
              {current.title}
            </h3>

            {/* Description */}
            {current.description && (
              <p className="text-sm sm:text-base text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                {current.description}
              </p>
            )}

            {/* Price display */}
            {current.price > 0 && (
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-primary-400">
                  {formatPrice(current.price)}
                </span>
                {current.show_original_price && current.original_price > current.price && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(current.original_price)}
                  </span>
                )}
                {current.show_original_price && current.original_price > current.price && (
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                    {Math.round((1 - current.price / current.original_price) * 100)}% OFF
                  </span>
                )}
              </div>
            )}

            {/* Bundle: product list */}
            {isBundle && (
              <div className="mb-4 space-y-1.5">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
                    <img
                      src={getProductImage(p.image_url)}
                      alt={p.name}
                      className="w-7 h-7 rounded object-cover flex-shrink-0 bg-gray-700 ring-1 ring-white/10"
                      onError={(e) => { e.target.src = '/cube.svg'; }}
                    />
                    <span className="text-sm text-white font-medium truncate flex-1">{p.name}</span>
                    <span className="text-sm font-semibold text-amber-400">{formatPrice(p.price)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA button */}
            {products.length > 0 && (
              <button
                onClick={() => onFeaturedClick && onFeaturedClick(current)}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm w-fit"
              >
                {isBundle ? 'View Bundle' : 'View Details'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Thumbnail strip (right side on desktop, bottom on mobile) */}
        {items.length > 1 && (
          <div className="lg:w-[200px] bg-black/30 border-t lg:border-t-0 lg:border-l border-white/10">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden lg:h-full scrollbar-thin">
              {items.map((item, index) => {
                const thumbProducts = item.products || [];
                const thumbFirst = thumbProducts[0] || null;
                const thumbImage = item.image_url || (thumbFirst && getProductImage(thumbFirst.image_url)) || '/cube.svg';
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    className={`flex-shrink-0 flex items-center gap-2 p-2 lg:p-3 w-40 lg:w-full text-left transition-all ${
                      index === activeIndex
                        ? 'bg-primary-600/30 border-l-2 lg:border-l-2 border-primary-500'
                        : 'hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                  >
                    <img
                      src={thumbImage}
                      alt={item.title}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded object-cover flex-shrink-0"
                      onError={(e) => { e.target.src = '/cube.svg'; }}
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        index === activeIndex ? 'text-white' : 'text-gray-400'
                      }`}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {item.price > 0
                          ? formatPrice(item.price)
                          : thumbFirst ? formatPrice(thumbFirst.price) : ''
                        }
                        {thumbProducts.length > 1 ? ` • ${thumbProducts.length} items` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dot indicators for mobile */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2 lg:hidden bg-black/20">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex
                  ? 'bg-primary-500 w-4'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeaturedCarousel;
