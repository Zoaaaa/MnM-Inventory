import { Outlet, Link } from 'react-router-dom';

function StoreLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <img src="/cube.svg" alt="MnM Cubes" className="h-8 w-8" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">MnM Cubes</h1>
                <p className="text-[10px] text-gray-500 leading-tight -mt-0.5">Speedcube Shop PH</p>
              </div>
            </Link>
            <a
              href="https://m.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.438 5.503 3.688 7.2V22l3.405-1.868c.907.252 1.871.388 2.907.388 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.062 12.434l-2.545-2.717-4.97 2.717 5.467-5.804 2.609 2.717 4.906-2.717-5.467 5.804z" />
              </svg>
              Message Us
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} MnM Cubes. All prices in PHP.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Order via Facebook Messenger • Based in the Philippines
          </p>
        </div>
      </footer>
    </div>
  );
}

export default StoreLayout;
