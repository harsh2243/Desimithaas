import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Lock,
  Bell,
  Globe,
  Shield,
  Database,
  Mail,
  Phone,
  MapPin,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Upload,
  Trash2
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'

function AdminSettings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Profile Settings State
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  })

  // Security Settings State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Store Settings State
  const [storeData, setStoreData] = useState({
    storeName: 'TheKua Store',
    storeDescription: 'Premium Traditional Sweets',
    storeEmail: 'store@thekua.com',
    storePhone: '+91 9876543210',
    storeAddress: 'New Delhi, India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en'
  })

  // Notification Settings State
  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    orderNotifications: true,
    lowStockAlerts: true,
    paymentAlerts: true,
    customerNotifications: false,
    promotionalEmails: true
  })

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => adminAPI.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!')
      queryClient.invalidateQueries(['admin-profile'])
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile')
    }
  })

  // Update Password Mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data) => adminAPI.updatePassword(data),
    onSuccess: () => {
      toast.success('Password updated successfully!')
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update password')
    }
  })

  // Update Store Settings Mutation
  const updateStoreMutation = useMutation({
    mutationFn: (data) => adminAPI.updateStoreSettings(data),
    onSuccess: () => {
      toast.success('Store settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update store settings')
    }
  })

  // Update Notification Settings Mutation
  const updateNotificationMutation = useMutation({
    mutationFn: (data) => adminAPI.updateNotificationSettings(data),
    onSuccess: () => {
      toast.success('Notification settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update notification settings')
    }
  })

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileData)
  }

  const handleSecuritySubmit = (e) => {
    e.preventDefault()
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (securityData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    updatePasswordMutation.mutate({
      currentPassword: securityData.currentPassword,
      newPassword: securityData.newPassword
    })
  }

  const handleStoreSubmit = (e) => {
    e.preventDefault()
    updateStoreMutation.mutate(storeData)
  }

  const handleNotificationSubmit = (e) => {
    e.preventDefault()
    updateNotificationMutation.mutate(notificationData)
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'store', name: 'Store Settings', icon: Globe },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'system', name: 'System', icon: Database }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your admin preferences and store configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-gray-600 mt-1">Update your account profile information</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        {profileData.avatar ? (
                          <img
                            src={profileData.avatar}
                            alt="Avatar"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="space-x-2">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="input"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                  <p className="text-gray-600 mt-1">Manage your account security and password</p>
                </div>

                <form onSubmit={handleSecuritySubmit} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                        className="input pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                        className="input pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                      className="input"
                      required
                    />
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Password Requirements</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>At least 8 characters long</li>
                            <li>Include uppercase and lowercase letters</li>
                            <li>Include at least one number</li>
                            <li>Include at least one special character</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Store Settings */}
            {activeTab === 'store' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Store Configuration</h2>
                  <p className="text-gray-600 mt-1">Configure your store information and preferences</p>
                </div>

                <form onSubmit={handleStoreSubmit} className="space-y-6">
                  {/* Store Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={storeData.storeName}
                      onChange={(e) => setStoreData({...storeData, storeName: e.target.value})}
                      className="input"
                      required
                    />
                  </div>

                  {/* Store Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Description
                    </label>
                    <textarea
                      value={storeData.storeDescription}
                      onChange={(e) => setStoreData({...storeData, storeDescription: e.target.value})}
                      className="input"
                      rows={3}
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Email
                      </label>
                      <input
                        type="email"
                        value={storeData.storeEmail}
                        onChange={(e) => setStoreData({...storeData, storeEmail: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Phone
                      </label>
                      <input
                        type="tel"
                        value={storeData.storePhone}
                        onChange={(e) => setStoreData({...storeData, storePhone: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* Store Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Address
                    </label>
                    <textarea
                      value={storeData.storeAddress}
                      onChange={(e) => setStoreData({...storeData, storeAddress: e.target.value})}
                      className="input"
                      rows={2}
                    />
                  </div>

                  {/* Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={storeData.currency}
                        onChange={(e) => setStoreData({...storeData, currency: e.target.value})}
                        className="input"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={storeData.timezone}
                        onChange={(e) => setStoreData({...storeData, timezone: e.target.value})}
                        className="input"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={storeData.language}
                        onChange={(e) => setStoreData({...storeData, language: e.target.value})}
                        className="input"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updateStoreMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateStoreMutation.isPending ? 'Saving...' : 'Save Store Settings'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="text-gray-600 mt-1">Configure when and how you receive notifications</p>
                </div>

                <form onSubmit={handleNotificationSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive general email notifications' },
                      { key: 'orderNotifications', label: 'Order Notifications', description: 'Get notified about new orders' },
                      { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Alert when products are running low' },
                      { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Notifications for payment updates' },
                      { key: 'customerNotifications', label: 'Customer Notifications', description: 'Updates about customer activities' },
                      { key: 'promotionalEmails', label: 'Promotional Emails', description: 'Marketing and promotional content' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationData[item.key]}
                            onChange={(e) => setNotificationData({
                              ...notificationData,
                              [item.key]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={updateNotificationMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    {updateNotificationMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
                  <p className="text-gray-600 mt-1">View system status and maintenance options</p>
                </div>

                <div className="space-y-6">
                  {/* System Status */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">System Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Database Connection</span>
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Connected
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">API Status</span>
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Online
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Payment Gateway</span>
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance */}
                  <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Maintenance Mode</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Enable maintenance mode to perform system updates.</p>
                        </div>
                        <div className="mt-4">
                          <button className="btn btn-outline border-yellow-600 text-yellow-600 hover:bg-yellow-100">
                            Enable Maintenance Mode
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Export */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Data Management</h3>
                    <div className="space-y-3">
                      <button className="btn btn-outline w-full justify-start">
                        <Database className="w-4 h-4 mr-2" />
                        Export All Data
                      </button>
                      <button className="btn btn-outline w-full justify-start">
                        <Upload className="w-4 h-4 mr-2" />
                        Import Data
                      </button>
                      <button className="btn btn-outline w-full justify-start text-red-600 border-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Cache
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
