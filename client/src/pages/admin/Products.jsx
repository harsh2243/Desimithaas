import { motion } from 'framer-motion'

function AdminProducts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Products Management
        </h2>
        <p className="text-gray-600">
          Admin products page is under construction. This will include:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li>• Product Listing</li>
          <li>• Add New Products</li>
          <li>• Edit Product Details</li>
          <li>• Manage Inventory</li>
          <li>• Product Analytics</li>
        </ul>
      </div>
    </motion.div>
  )
}

export default AdminProducts
