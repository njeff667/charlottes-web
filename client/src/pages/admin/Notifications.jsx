import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, AlertCircle, DollarSign, Package } from 'lucide-react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  approveThirdPartyAction,
  getPendingApprovals 
} from '../../utils/api';

export default function AdminNotifications() {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 100 })
  });

  const { data: approvalsData } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: getPendingApprovals
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const approveMutation = useMutation({
    mutationFn: approveThirdPartyAction,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['pendingApprovals']);
    }
  });

  const notifications = notificationsData?.data?.notifications || [];
  const approvals = approvalsData?.data?.notifications || [];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'sale':
        return <DollarSign className="text-green-600" size={20} />;
      case 'sync_error':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'third_party_action':
        return <Bell className="text-yellow-600" size={20} />;
      default:
        return <Package className="text-blue-600" size={20} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            Stay updated on platform activities and approvals
          </p>
        </div>

        {/* Pending Approvals */}
        {approvals.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="text-yellow-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">
                Pending Approvals ({approvals.length})
              </h2>
            </div>
            <div className="space-y-4">
              {approvals.map((notification) => (
                <div
                  key={notification._id}
                  className="bg-white rounded-lg p-4 border border-yellow-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {notification.message}
                      </p>
                      {notification.thirdPartyAction && (
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            Action Details:
                          </p>
                          <p className="text-sm text-gray-600">
                            Type: {notification.thirdPartyAction.actionType}
                          </p>
                          <p className="text-sm text-gray-600">
                            Performed by: {notification.thirdPartyAction.performedBy}
                          </p>
                          <p className="text-sm text-gray-600">
                            Time: {new Date(notification.thirdPartyAction.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-4">
                    <button
                      onClick={() => approveMutation.mutate(notification._id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => markReadMutation.mutate(notification._id)}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Notifications */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Notifications</h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 transition ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          {notification.platform && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                              {notification.platform}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.status === 'unread' && (
                          <button
                            onClick={() => markReadMutation.mutate(notification._id)}
                            disabled={markReadMutation.isPending}
                            className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center space-x-1"
                          >
                            <CheckCircle size={14} />
                            <span>Mark as Read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}