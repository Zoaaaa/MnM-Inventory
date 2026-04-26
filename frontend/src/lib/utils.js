/**
 * Format price in Philippine Peso
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Get stock status display info
 */
export function getStockDisplay(stockStatus, stock) {
  switch (stockStatus) {
    case 'in_stock':
      return {
        label: `In Stock (${stock})`,
        className: 'badge-in-stock',
        color: 'green',
      };
    case 'low_stock':
      return {
        label: `Low Stock (${stock})`,
        className: 'badge-low-stock',
        color: 'yellow',
      };
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        className: 'badge-out-of-stock',
        color: 'red',
      };
    default:
      return {
        label: 'Unknown',
        className: 'badge-out-of-stock',
        color: 'gray',
      };
  }
}

/**
 * Generate Messenger link with prefilled message
 */
export function getMessengerLink(pageId, productName) {
  const message = encodeURIComponent(
    `Hi! I'd like to order: ${productName}. Is this still available?`
  );
  // m.me link works on both mobile and desktop
  return `https://m.me/${pageId}?text=${message}`;
}

/**
 * Debounce function for search input
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get placeholder image for products without images
 */
export function getProductImage(imageUrl) {
  if (imageUrl && imageUrl.trim()) return imageUrl;
  return '/cube.svg';
}
