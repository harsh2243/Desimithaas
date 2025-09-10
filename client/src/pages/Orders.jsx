import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  X,
  Eye,
  Download,
  RefreshCw,
  Search,
  Calendar,
  MapPin,
  CreditCard,
  Phone
} from 'lucide-react'
import { userAPI } from '../services/api'
import { toast } from 'react-hot-toast'

function Orders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  const queryClient = useQueryClient()

  // Fetch user orders
  const { 
    data: ordersData, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['user-orders', searchQuery, statusFilter],
    queryFn: () => {
      console.log('Fetching orders...');
      return userAPI.getOrders({
        search: searchQuery,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
    },
    select: (response) => response.data.data,
    enabled: true, // Always enabled, let the API handle auth errors
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('Orders fetch error:', error.response?.data || error.message);
      if (error?.response?.status === 401) {
        toast.error('Please log in to view your orders');
      } else if (error?.response?.status === 400) {
        toast.error('Unable to load orders. Please try logging in again.');
      }
    }
  })

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId) => userAPI.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-orders'])
      toast.success('Order cancelled successfully')
      setShowOrderModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order')
    }
  })

  const orders = ordersData?.orders || []

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-purple-100 text-purple-800 border-purple-200',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  }

  const statusIcons = {
    pending: Clock,
    confirmed: Package,
    processing: RefreshCw,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: X
  }

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId)
    }
  }

  const canCancelOrder = (order) => {
    return ['pending', 'confirmed'].includes(order.orderStatus) && order.paymentMethod === 'cod'
  }

  const getOrderProgress = (status) => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
    const currentIndex = steps.indexOf(status)
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items?.some(item => item.product.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container">
          <div className="text-center py-12">
            <div className="mb-4">
              {error?.response?.status === 401 ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
                  <p className="text-gray-600 mb-4">Please log in to view your orders</p>
                  <Link to="/auth/login" className="btn btn-primary mr-3">
                    Log In
                  </Link>
                </>
              ) : error?.response?.status === 400 ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Orders</h3>
                  <p className="text-red-600 mb-4">There was an issue with your request. Please try logging in again.</p>
                  <Link to="/auth/login" className="btn btn-primary mr-3">
                    Log In Again
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Orders</h3>
                  <p className="text-red-600 mb-4">{error?.response?.data?.message || 'An error occurred while loading your orders'}</p>
                </>
              )}
            </div>
            <button 
              onClick={() => refetch()}
              className="btn btn-outline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">
              My Orders
            </h1>
            <button
              onClick={() => refetch()}
              className="btn btn-outline btn-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by order number or product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {orders.length === 0 ? 'No orders yet' : 'No orders found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0 
                  ? 'Start shopping to see your orders here!'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {orders.length === 0 && (
                <Link to="/products" className="btn btn-primary">
                  Start Shopping
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.orderStatus]
                const progress = getOrderProgress(order.orderStatus)
                
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            #{order.orderNumber}
                          </h3>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${statusColors[order.orderStatus]}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="capitalize">{order.orderStatus}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{order.items?.length || 0} item(s)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span className={`px-2 py-1 rounded text-xs ${paymentStatusColors[order.paymentStatus]}`}>
                              {order.paymentMethod.toUpperCase()} - {order.paymentStatus}
                            </span>
                          </div>
                          <div className="font-semibold text-gray-900">
                            Total: {formatCurrency(order.finalAmount)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {order.orderStatus !== 'cancelled' && (
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Pending</span>
                              <span>Confirmed</span>
                              <span>Processing</span>
                              <span>Shipped</span>
                              <span>Delivered</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="btn btn-outline btn-sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        {canCancelOrder(order) && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
                            disabled={cancelOrderMutation.isLoading}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Details Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium">{selectedOrder._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`px-2 py-1 rounded text-xs ${paymentStatusColors[selectedOrder.paymentStatus]}`}>
                    {selectedOrder.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Order Progress */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Progress</h3>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getOrderProgress(selectedOrder.orderStatus)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span className={selectedOrder.orderStatus === 'pending' ? 'text-blue-600 font-medium' : ''}>
                      Pending
                    </span>
                    <span className={selectedOrder.orderStatus === 'confirmed' ? 'text-blue-600 font-medium' : ''}>
                      Confirmed
                    </span>
                    <span className={selectedOrder.orderStatus === 'processing' ? 'text-blue-600 font-medium' : ''}>
                      Processing
                    </span>
                    <span className={selectedOrder.orderStatus === 'shipped' ? 'text-blue-600 font-medium' : ''}>
                      Shipped
                    </span>
                    <span className={selectedOrder.orderStatus === 'delivered' ? 'text-blue-600 font-medium' : ''}>
                      Delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Order Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
                <div className={`flex items-center gap-3 p-4 rounded-lg ${statusColors[selectedOrder.orderStatus]}`}>
                  {React.createElement(statusIcons[selectedOrder.orderStatus], { className: "w-6 h-6" })}
                  <div>
                    <p className="font-medium capitalize">{selectedOrder.orderStatus}</p>
                    <p className="text-sm opacity-75">
                      {selectedOrder.orderStatus === 'pending' && 'Your order has been placed and is being reviewed'}
                      {selectedOrder.orderStatus === 'confirmed' && 'Your order has been confirmed and will be processed soon'}
                      {selectedOrder.orderStatus === 'processing' && 'Your order is being prepared for shipment'}
                      {selectedOrder.orderStatus === 'shipped' && 'Your order is on its way to you'}
                      {selectedOrder.orderStatus === 'delivered' && 'Your order has been successfully delivered'}
                      {selectedOrder.orderStatus === 'cancelled' && 'This order has been cancelled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estimated Delivery */}
              {!['delivered', 'cancelled'].includes(selectedOrder.orderStatus) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Estimated Delivery</h3>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        {selectedOrder.orderStatus === 'shipped' ? 'Expected by' : 'Estimated delivery'}
                      </p>
                      <p className="text-sm text-blue-700">
                        {(() => {
                          const deliveryDate = new Date(selectedOrder.createdAt);
                          deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from order
                          return deliveryDate.toLocaleDateString('en-IN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.product.image || '/thekua-placeholder.svg'}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedOrder.shippingAddress?.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.address}</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{selectedOrder.shippingAddress?.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Order Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Items ({selectedOrder.items?.length || 0}):</span>
                    <span>{formatCurrency(selectedOrder.totalAmount - selectedOrder.shippingCharge)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping & Handling:</span>
                    <span>{selectedOrder.shippingCharge > 0 ? formatCurrency(selectedOrder.shippingCharge) : 'FREE'}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount Applied:</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {selectedOrder.couponCode && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Coupon ({selectedOrder.couponCode}):</span>
                      <span>Applied</span>
                    </div>
                  )}
                  <hr className="my-3" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Paid:</span>
                    <span>{formatCurrency(selectedOrder.finalAmount)}</span>
                  </div>
                  
                  {/* Payment Information */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span>Payment Method:</span>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="capitalize">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span>Payment Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${paymentStatusColors[selectedOrder.paymentStatus]}`}>
                        {selectedOrder.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    {selectedOrder.transactionId && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span>Transaction ID:</span>
                        <span className="font-mono text-xs">{selectedOrder.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {canCancelOrder(selectedOrder) && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder._id)}
                    className="btn btn-outline text-red-600 hover:bg-red-50"
                    disabled={cancelOrderMutation.isLoading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="btn btn-primary ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Orders
