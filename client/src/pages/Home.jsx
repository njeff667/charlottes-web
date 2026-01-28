import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingBag, Heart } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Charlotte's Web
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Re-homing quality items with care and purpose
            </p>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Discover new and like-new items from our storage unit collection. 
              Each item has a story, and we're here to help them find their new home.
            </p>
            <Link
              to="/store"
              className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              <span>Shop Now</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Shop With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Package className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Items</h3>
              <p className="text-gray-600">
                Many items are new or like-new, never been opened. We carefully inspect everything.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <ShoppingBag className="text-pink-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Great Prices</h3>
              <p className="text-gray-600">
                Affordable pricing on quality items. Find great deals on things you need.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Heart className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">With Purpose</h3>
              <p className="text-gray-600">
                Every purchase helps us continue our mission of re-homing quality items with care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Next Treasure?
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Browse our collection of quality items waiting for their new home.
            </p>
            <Link
              to="/store"
              className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              <span>Browse Store</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-lg text-gray-700 mb-6">
              Charlotte's Web began as a heartfelt project to re-home duplicate items 
              collected over the years. What started as a storage unit full of quality 
              items has become a mission to help these products find new homes where 
              they'll be appreciated and used.
            </p>
            <Link
              to="/about"
              className="text-purple-600 font-semibold hover:text-purple-700 inline-flex items-center space-x-1"
            >
              <span>Learn More About Us</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}