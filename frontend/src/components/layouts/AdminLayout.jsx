import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/products', label: 'Products', icon: '📦' },
    { to: '/admin/categories', label: 'Categories', icon: '🏷️' },
    { to: '/admin/featured', label: 'Featured', icon: '⭐' },
    { to: '/admin/import', label: 'Import', icon: '📥' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top nav */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-2">
                <img src="/logo.jpg" alt="MnM Cubes" className="h-7 w-7 rounded" />
                <span className="font-bold text-sm">MnM Admin</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                target="_blank"
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                View Store →
              </Link>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-gray-400">{admin?.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
