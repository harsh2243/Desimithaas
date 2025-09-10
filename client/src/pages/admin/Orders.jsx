import { motion } from 'framer-motion'

function AdminOrders() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Orders Management
        </h2>
        <p className="text-gray-600">
          Admin orders page is under construction. This will include:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li>• Order Listing</li>
          <li>• Order Status Updates</li>
          <li>• Payment Verification</li>
          <li>• Shipping Management</li>
          <li>• Order Analytics</li>
        </ul>
      </div>
    </motion.div>
  )
}

export default AdminOrders
