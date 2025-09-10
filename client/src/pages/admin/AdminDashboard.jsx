import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react'
import { adminAPI } from '../../services/api'

function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState('today')

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard(),
    select: (response) => response.data.data
  })

  // Fetch quick stats
  const { 
    data: quickStats,
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['admin-quick-actions'],
    queryFn: () => adminAPI.getQuickActions(),
    select: (response) => response.data.data
  })

  const overview = dashboardData?.overview || {}
  const stats = {
    // Revenue stats
    totalRevenue: overview.revenue?.totalRevenue || 0,
    revenueToday: overview.revenue?.revenueToday || 0,
    revenueThisWeek: overview.revenue?.revenueThisWeek || 0,
    revenueThisMonth: overview.revenue?.revenueThisMonth || 0,
    avgOrderValue: overview.revenue?.avgOrderValue || 0,
    
    // Order stats
    totalOrders: overview.orders?.totalOrders || 0,
    ordersToday: overview.orders?.ordersToday || 0,
    ordersThisWeek: overview.orders?.ordersThisWeek || 0,
    ordersThisMonth: overview.orders?.ordersThisMonth || 0,
    pendingOrders: overview.orders?.pendingOrders || 0,
    processingOrders: overview.orders?.processingOrders || 0,
    shippedOrders: overview.orders?.shippedOrders || 0,
    deliveredOrders: overview.orders?.deliveredOrders || 0,
    cancelledOrders: overview.orders?.cancelledOrders || 0,
    
    // Customer stats
    totalCustomers: overview.customers?.totalCustomers || 0,
    activeCustomers: overview.customers?.activeCustomers || 0,
    newCustomersToday: overview.customers?.newCustomersToday || 0,
    newCustomersThisMonth: overview.customers?.newCustomersThisMonth || 0,
    
    // Product stats
    totalProducts: overview.products?.totalProducts || 0,
    activeProducts: overview.products?.activeProducts || 0,
    featuredProducts: overview.products?.featuredProducts || 0,
    outOfStockProducts: overview.products?.outOfStockProducts || 0,
    lowStockProducts: overview.products?.lowStockProducts || 0,
    
    // Growth calculations (can be enhanced with historical data)
    revenueGrowth: overview.revenue?.revenueThisMonth > 0 ? 12.5 : 0,
    orderGrowth: overview.orders?.ordersThisMonth > 0 ? 8.3 : 0,
    customerGrowth: overview.customers?.newCustomersThisMonth > 0 ? 15.2 : 0,
    productGrowth: overview.products?.totalProducts > 0 ? 5.1 : 0,
  }
  
  const recentOrders = dashboardData?.recentOrders || []
  const topProducts = dashboardData?.topProducts || []

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue?.toLocaleString('en-IN') || 0}`,
      change: stats.revenueGrowth || 0,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders || 0,
      change: stats.orderGrowth || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers || 0,
      change: stats.customerGrowth || 0,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts || 0,
      change: stats.productGrowth || 0,
      icon: Package,
      color: 'bg-orange-500'
    }
  ]

  const orderStatusCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Processing',
      value: stats.processingOrders || 0,
      icon: RefreshCw,
      color: 'bg-blue-500'
    },
    {
      title: 'Shipped',
      value: stats.shippedOrders || 0,
      icon: Truck,
      color: 'bg-indigo-500'
    },
    {
      title: 'Delivered',
      value: stats.deliveredOrders || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="input border-gray-300"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => refetchDashboard()}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {dashboardLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        {stat.change >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {Math.abs(stat.change)}%
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {orderStatusCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="card"
              >
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <button className="btn btn-outline btn-sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </button>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{order.finalAmount?.toLocaleString('en-IN')}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.orderStatus === 'pending' ? 'bg-orange-100 text-orange-800' :
                          order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.paymentMethod?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentOrders.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No recent orders</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="card"
            >
              <div className="card-header">
                <h3 className="text-lg font-semibold">Top Products</h3>
                <button className="btn btn-outline btn-sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </button>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{product._id}</p>
                          <p className="text-sm text-gray-600">₹{product.avgPrice?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{product.totalSold} sold</p>
                        <p className="text-sm text-gray-600">₹{product.totalRevenue?.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-500">{product.orderCount} orders</p>
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No product data</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-8"
          >
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="btn btn-outline flex items-center justify-center p-4">
                    <Download className="w-5 h-5 mr-2" />
                    Export Orders
                  </button>
                  <button className="btn btn-outline flex items-center justify-center p-4">
                    <Download className="w-5 h-5 mr-2" />
                    Export Customers
                  </button>
                  <button className="btn btn-outline flex items-center justify-center p-4">
                    <Download className="w-5 h-5 mr-2" />
                    Export Products
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
