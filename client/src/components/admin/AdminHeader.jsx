import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Menu, Bell, Search, User, ChevronDown } from 'lucide-react';

function AdminHeader({ setSidebarOpen, currentPath }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page
  };

  const getPageTitle = (path) => {
    switch (path) {
      case '/admin':
        return 'Dashboard'
      case '/admin/products':
        return 'Products Management'
      case '/admin/orders':
        return 'Orders Management'
      case '/admin/users':
        return 'Users Management'
      case '/admin/analytics':
        return 'Analytics'
      case '/admin/settings':
        return 'Settings'
      default:
        return 'Admin Panel'
    }
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      {/* Page Title */}
      <div className="flex flex-1 items-center">
        <h1 className="text-xl font-semibold text-gray-900">
          {getPageTitle(currentPath)}
        </h1>
      </div>

      {/* Search (Desktop only) */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm text-gray-900">New order received</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm text-gray-900">Product stock low</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm text-gray-900">New user registered</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
              <div className="border-t px-4 py-2">
                <button className="text-sm text-primary-600 hover:text-primary-500">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            className="-m-1.5 flex items-center p-1.5"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user?.firstName?.charAt(0) || 'A'}
              </span>
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                {user?.firstName} {user?.lastName}
              </span>
              <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
            </span>
          </button>

          {/* User menu dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <a
                href="#"
                className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50"
              >
                Your profile
              </a>
              <a
                href="#"
                className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50"
              >
                Settings
              </a>
              <a
                href="/"
                className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50"
              >
                Back to website
              </a>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-1 text-sm leading-6 text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminHeader
