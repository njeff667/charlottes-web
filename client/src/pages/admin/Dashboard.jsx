import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { getPlatformStats, getActiveListings, getPendingApprovals } from '../../utils/api';

export default function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['platformStats'],
    queryFn: getPlatformStats
  });

  const { data: listingsData } = useQuery({
    queryKey: ['activeListings'],
    queryFn: () => getActiveListings({ limit: 10 })
  });

  const { data: approvalsData } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: getPendingApprovals
  });

  const stats = statsData?.data?.stats || {};
  const listings = listingsData?.data?.listings || [];
  const approvals = approvalsData?.data?.notifications || [];

  // Calculate totals
  const totalActiveListings = Object.values(stats).reduce((sum, platform) => 
    sum + (platform.activeListings || 0), 0
  );
  const totalSales = Object.values(stats).reduce((sum, platform) => 
    sum + (platform.totalSales || 0), 0
  );
  const totalRevenue = Object.values(stats).reduce((sum, platform) => 
    sum + (platform.totalRevenue || 0), 0
  );

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your multi-platform inventory and listings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Listings</p>
                <p className="text-3xl font-bold text-gray-900">{totalActiveListings}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900">{totalSales}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <ShoppingBag className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900">{approvals.length}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <AlertCircle className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats).map(([platform, data]) => (
              <div key={platform} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold capitalize">{platform}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    data.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active:</span>
                    <span className="font-semibold">{data.activeListings || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-semibold">{data.totalSales || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold">${(data.totalRevenue || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/admin/inventory"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <Package className="text-purple-600 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Manage Inventory
            </h3>
            <p className="text-gray-600 text-sm">
              Add, edit, and organize your product inventory
            </p>
          </Link>

          <Link
            to="/admin/listings"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <TrendingUp className="text-blue-600 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multi-Platform Listings
            </h3>
            <p className="text-gray-600 text-sm">
              Create and manage listings across all platforms
            </p>
          </Link>

          <Link
            to="/admin/notifications"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <AlertCircle className="text-yellow-600 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Notifications
            </h3>
            <p className="text-gray-600 text-sm">
              Review alerts and pending approvals
            </p>
          </Link>
        </div>

        {/* Recent Listings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Listings</h2>
            <Link
              to="/admin/listings"
              className="text-purple-600 hover:text-purple-700 text-sm font-semibold"
            >
              View All
            </Link>
          </div>
          {listings.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No active listings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Platform
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Listed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listings.slice(0, 5).map((listing) => (
                    <tr key={listing._id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {listing.product?.images?.[0] && (
                            <img
                              src={listing.product.images[0].url}
                              alt={listing.product.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {listing.product?.title || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm capitalize text-gray-700">
                          {listing.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-gray-900">
                          ${listing.price?.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          listing.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {listing.listedAt 
                          ? new Date(listing.listedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}