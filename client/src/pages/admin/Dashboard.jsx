import { motion } from 'framer-motion'

function AdminDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Dashboard
        </h2>
        <p className="text-gray-600">
          Admin dashboard is under construction. This will include:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li>• Sales Analytics</li>
          <li>• Order Statistics</li>
          <li>• Product Management</li>
          <li>• User Management</li>
          <li>• Revenue Charts</li>
        </ul>
      </div>
    </motion.div>
  )
}

export default AdminDashboard
