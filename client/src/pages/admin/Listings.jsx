import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ExternalLink, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { getActiveListings, getProducts, createMultiPlatformListing } from '../../utils/api';

export default function AdminListings() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['adminListings'],
    queryFn: () => getActiveListings({ limit: 100 })
  });

  const { data: productsData } = useQuery({
    queryKey: ['productsForListing'],
    queryFn: () => getProducts({ status: 'active' })
  });

  const createListingMutation = useMutation({
    mutationFn: createMultiPlatformListing,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminListings']);
      setShowCreateModal(false);
      setSelectedProduct('');
      setSelectedPlatforms([]);
    }
  });

  const listings = listingsData?.data?.listings || [];
  const products = productsData?.data?.products || [];

  const platforms = [
    { id: 'ebay', name: 'eBay', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'facebook', name: 'Facebook Marketplace', color: 'bg-blue-100 text-blue-800' },
    { id: 'depop', name: 'Depop', color: 'bg-red-100 text-red-800' },
    { id: 'craigslist', name: 'Craigslist', color: 'bg-purple-100 text-purple-800' }
  ];

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleCreateListing = () => {
    if (selectedProduct && selectedPlatforms.length > 0) {
      createListingMutation.mutate({
        productId: selectedProduct,
        platforms: selectedPlatforms
      });
    }
  };

  // Group listings by product
  const listingsByProduct = listings.reduce((acc, listing) => {
    const productId = listing.product?._id;
    if (!acc[productId]) {
      acc[productId] = {
        product: listing.product,
        listings: []
      };
    }
    acc[productId].listings.push(listing);
    return acc;
  }, {});

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Multi-Platform Listings</h1>
            <p className="text-gray-600 mt-2">
              Manage listings across all platforms
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Listing</span>
          </button>
        </div>

        {/* Platform Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {platforms.map((platform) => {
            const platformListings = listings.filter(l => l.platform === platform.id);
            return (
              <div key={platform.id} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{platform.name}</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {platformListings.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Active Listings</p>
              </div>
            );
          })}
        </div>

        {/* Listings by Product */}
        <div className="space-y-6">
          {listingsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading listings...</p>
            </div>
          ) : Object.keys(listingsByProduct).length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-4">Create your first multi-platform listing</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Create Listing
              </button>
            </div>
          ) : (
            Object.values(listingsByProduct).map(({ product, listings: productListings }) => (
              <div key={product._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url}
                        alt={product.title}
                        className="w-20 h-20 rounded object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ${product.price?.toFixed(2)} • {product.condition}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {productListings.map((listing) => {
                    const platform = platforms.find(p => p.id === listing.platform);
                    return (
                      <div
                        key={listing._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${platform?.color}`}>
                            {platform?.name}
                          </span>
                          {listing.syncStatus === 'synced' ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-semibold capitalize">{listing.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Views:</span>
                            <span className="font-semibold">{listing.views || 0}</span>
                          </div>
                          {listing.listingUrl && (
                            <a
                              href={listing.listingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                            >
                              <span>View Listing</span>
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Listing Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Create Multi-Platform Listing
              </h2>

              {/* Select Product */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.title} - ${product.price?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Platforms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Platforms
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={`p-4 rounded-lg border-2 transition ${
                        selectedPlatforms.includes(platform.id)
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{platform.name}</span>
                        {selectedPlatforms.includes(platform.id) && (
                          <CheckCircle className="text-purple-600" size={20} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedProduct('');
                    setSelectedPlatforms([]);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateListing}
                  disabled={!selectedProduct || selectedPlatforms.length === 0 || createListingMutation.isPending}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {createListingMutation.isPending ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Listing</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}