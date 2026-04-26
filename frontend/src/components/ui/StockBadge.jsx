import { getStockDisplay } from '../../lib/utils';

function StockBadge({ stockStatus, stock }) {
  const display = getStockDisplay(stockStatus, stock);

  return <span className={display.className}>{display.label}</span>;
}

export default StockBadge;
