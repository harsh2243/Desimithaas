import { motion } from 'framer-motion'

function Profile() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
            My Profile
          </h1>
          
          <div className="card p-8">
            <p className="text-center text-gray-600">
              Profile page is under construction. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Personal Information Management</li>
              <li>• Address Book</li>
              <li>• Password Change</li>
              <li>• Order History</li>
              <li>• Wishlist</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Profile
