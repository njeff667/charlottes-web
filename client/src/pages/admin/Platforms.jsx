import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';
import { 
  getPlatformConfigs, 
  updatePlatformConfig,
  connectPlatform,
  disconnectPlatform 
} from '../../utils/api';

export default function AdminPlatforms() {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: configsData, isLoading } = useQuery({
    queryKey: ['platformConfigs'],
    queryFn: getPlatformConfigs
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ platform, data }) => updatePlatformConfig(platform, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['platformConfigs']);
      setShowConfigModal(false);
      setSelectedPlatform(null);
    }
  });

  const connectMutation = useMutation({
    mutationFn: ({ platform, credentials }) => connectPlatform(platform, credentials),
    onSuccess: () => {
      queryClient.invalidateQueries(['platformConfigs']);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectPlatform,
    onSuccess: () => {
      queryClient.invalidateQueries(['platformConfigs']);
    }
  });

  const configs = configsData?.data?.configs || [];

  const platforms = [
    {
      id: 'ebay',
      name: 'eBay',
      description: 'List items on eBay marketplace',
      icon: '🛒',
      color: 'bg-yellow-100 border-yellow-300'
    },
    {
      id: 'facebook',
      name: 'Facebook Marketplace',
      description: 'Sell locally on Facebook',
      icon: '📘',
      color: 'bg-blue-100 border-blue-300'
    },
    {
      id: 'depop',
      name: 'Depop',
      description: 'Reach fashion-forward buyers',
      icon: '👗',
      color: 'bg-red-100 border-red-300'
    },
    {
      id: 'craigslist',
      name: 'Craigslist',
      description: 'Post to local classifieds',
      icon: '📰',
      color: 'bg-purple-100 border-purple-300'
    }
  ];

  const getPlatformConfig = (platformId) => {
    return configs.find(c => c.platform === platformId);
  };

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
          <p className="text-gray-600 mt-2">
            Configure and manage your selling platforms
          </p>
        </div>

        {/* Platform Cards */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading platforms...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map((platform) => {
              const config = getPlatformConfig(platform.id);
              const isConnected = config?.isConnected;
              const isActive = config?.isActive;

              return (
                <div
                  key={platform.id}
                  className={`bg-white rounded-lg shadow-sm border-2 ${platform.color} p-6`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{platform.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {platform.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <CheckCircle className="text-green-500" size={24} />
                      ) : (
                        <XCircle className="text-red-500" size={24} />
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${
                        isConnected ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Active:</span>
                      <span className={`font-semibold ${
                        isActive ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {isActive ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {config && (
                      <>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Total Listings:</span>
                          <span className="font-semibold">
                            {config.usage?.totalListings || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Active Listings:</span>
                          <span className="font-semibold">
                            {config.usage?.activeListings || 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPlatform(platform);
                            setShowConfigModal(true);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center space-x-2"
                        >
                          <Settings size={16} />
                          <span>Configure</span>
                        </button>
                        <button
                          onClick={() => disconnectMutation.mutate(platform.id)}
                          disabled={disconnectMutation.isPending}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedPlatform(platform);
                          setShowConfigModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Connect Platform
                      </button>
                    )}
                  </div>

                  {/* Error Display */}
                  {config?.lastError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-semibold mb-1">
                        Last Error:
                      </p>
                      <p className="text-xs text-red-700">
                        {config.lastError.message}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {new Date(config.lastError.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Configuration Modal */}
        {showConfigModal && selectedPlatform && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Configure {selectedPlatform.name}
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Platform integrations require API credentials. 
                    Please refer to each platform's developer documentation for setup instructions.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="text"
                    placeholder="Enter API key..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    placeholder="Enter API secret..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Access Token (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter access token..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSync"
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="autoSync" className="text-sm text-gray-700">
                    Enable automatic synchronization
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setSelectedPlatform(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}