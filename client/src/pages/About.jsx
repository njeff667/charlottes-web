import { Heart, Package, Users } from 'lucide-react';

export default function About() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About Charlotte's Web
          </h1>
          <p className="text-xl text-gray-600">
            Re-homing quality items with care and purpose
          </p>
        </div>

        {/* Story Section */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Charlotte's Web was born from a simple yet meaningful mission: to give quality 
              items a second chance at being loved and used. What started as a storage unit 
              filled with duplicate items has evolved into a platform dedicated to connecting 
              these products with people who will appreciate them.
            </p>
            <p className="text-gray-700 mb-4">
              Many of our items are new or like-new, never been opened. They represent 
              thoughtful purchases that, for various reasons, ended up as duplicates. Rather 
              than letting them sit unused, we've created this space to help them find their 
              perfect home.
            </p>
            <p className="text-gray-700">
              Every item in our collection has been carefully inspected and documented. We 
              believe in transparency and want you to know exactly what you're getting. Our 
              goal is to make the process of finding quality items at great prices as simple 
              and trustworthy as possible.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Heart className="text-purple-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Care</h3>
              <p className="text-gray-600">
                We handle every item with care and respect, ensuring it reaches you in the 
                best possible condition.
              </p>
            </div>
            <div className="bg-pink-50 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <Package className="text-pink-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quality</h3>
              <p className="text-gray-600">
                We only offer items that meet our quality standards. Many are new or 
                like-new condition.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community</h3>
              <p className="text-gray-600">
                We're building a community of people who value quality items and sustainable 
                shopping.
              </p>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-purple-100 mb-4">
              To provide a trusted platform where quality items find new homes, where buyers 
              discover great deals, and where nothing goes to waste.
            </p>
            <p className="text-lg text-purple-100">
              We believe that every item deserves a chance to be useful and appreciated. 
              Through Charlotte's Web, we're making that happen, one product at a time.
            </p>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Browse Our Collection</h3>
                  <p className="text-gray-600">
                    Explore our carefully curated selection of quality items from our storage 
                    unit collection.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Find Your Perfect Item</h3>
                  <p className="text-gray-600">
                    Each listing includes detailed descriptions, photos, and condition 
                    information to help you make informed decisions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Complete Your Purchase</h3>
                  <p className="text-gray-600">
                    Secure checkout and reliable shipping ensure your item arrives safely at 
                    your door.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}