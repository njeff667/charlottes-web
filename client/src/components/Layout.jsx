import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Home, Store, Info, User } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-purple-600">
                Charlotte's Web
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`flex items-center space-x-1 ${
                  location.pathname === '/' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link
                to="/store"
                className={`flex items-center space-x-1 ${
                  location.pathname === '/store' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Store size={18} />
                <span>Store</span>
              </Link>
              <Link
                to="/about"
                className={`flex items-center space-x-1 ${
                  location.pathname === '/about' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <Info size={18} />
                <span>About</span>
              </Link>
              <Link
                to="/admin"
                className={`flex items-center space-x-1 ${
                  isAdmin ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                <User size={18} />
                <span>Admin</span>
              </Link>
              <Link
                to="/cart"
                className="flex items-center space-x-1 text-gray-700 hover:text-purple-600"
              >
                <ShoppingCart size={18} />
                <span>Cart</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <Link
                to="/"
                className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/store"
                className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Store
              </Link>
              <Link
                to="/about"
                className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/admin"
                className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
              <Link
                to="/cart"
                className="block px-4 py-2 text-gray-700 hover:bg-purple-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Charlotte's Web</h3>
              <p className="text-gray-400">
                Re-homing quality items with care and purpose.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/store" className="text-gray-400 hover:text-white">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Questions? Reach out to us anytime.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2024 Charlotte's Web. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}