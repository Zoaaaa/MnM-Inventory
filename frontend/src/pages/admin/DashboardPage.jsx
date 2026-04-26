import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import StockBadge from '../../components/ui/StockBadge';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, lowStockRes] = await Promise.all([
          productsApi.getStats(),
          productsApi.getLowStock(),
        ]);
        setStats(statsRes.data);
        setLowStock(lowStockRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-24 bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Products',
      value: stats?.total_products || 0,
      icon: '📦',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Active Products',
      value: stats?.active_products || 0,
      icon: '✅',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Low Stock',
      value: stats?.low_stock || 0,
      icon: '⚠️',
      color: 'bg-yellow-50 text-yellow-700',
      link: '/admin/products',
    },
    {
      label: 'Out of Stock',
      value: stats?.out_of_stock || 0,
      icon: '🚫',
      color: 'bg-red-50 text-red-700',
      link: '/admin/products',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your inventory</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`card p-4 ${card.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              {card.link && (
                <Link to={card.link} className="text-xs underline opacity-70 hover:opacity-100">
                  View
                </Link>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
            <p className="text-xs opacity-70">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Inventory value */}
      {stats?.total_inventory_value && (
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(stats.total_inventory_value)}
          </p>
        </div>
      )}

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            ⚠️ Low Stock Alerts ({lowStock.length})
          </h2>
          <div className="card divide-y">
            {lowStock.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StockBadge stockStatus={product.stock_status} stock={product.stock} />
                  <span className="text-sm font-medium text-gray-600">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/admin/products" className="card p-4 text-center hover:shadow-md transition-shadow">
            <span className="text-2xl">📦</span>
            <p className="text-sm font-medium mt-1">Manage Products</p>
          </Link>
          <Link to="/admin/categories" className="card p-4 text-center hover:shadow-md transition-shadow">
            <span className="text-2xl">🏷️</span>
            <p className="text-sm font-medium mt-1">Categories</p>
          </Link>
          <Link to="/admin/import" className="card p-4 text-center hover:shadow-md transition-shadow">
            <span className="text-2xl">📥</span>
            <p className="text-sm font-medium mt-1">Import Products</p>
          </Link>
          <a href="/" target="_blank" className="card p-4 text-center hover:shadow-md transition-shadow">
            <span className="text-2xl">🏪</span>
            <p className="text-sm font-medium mt-1">View Store</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
