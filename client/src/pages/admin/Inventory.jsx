import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { getProducts } from '../../utils/api';

export default function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['adminProducts', searchTerm, statusFilter],
    queryFn: () => getProducts({
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter
    })
  });

  const products = productsData?.data?.products || [];

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your product inventory
            </p>
          </div>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2">
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first product</p>
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                Add Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      SKU
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Quantity
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="text-gray-400" size={20} />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {product.title}
                            </p>
                            {product.brand && (
                              <p className="text-xs text-gray-600">{product.brand}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {product.sku || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        ${product.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {product.quantity || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'sold'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit size={16} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
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