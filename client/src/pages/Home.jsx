import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Star, ShoppingCart, Truck, Shield, Award } from 'lucide-react'
import { productsAPI } from '../services/api'
import ProductCard from '../components/common/ProductCard'
import LoadingSpinner from '../components/common/LoadingSpinner'

function Home() {
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productsAPI.getFeaturedProducts(),
    select: (response) => response.data.data?.products || response.data.products || []
  })

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const highlights = [
    { label: 'Freshly Prepared', value: 'Daily Batches' },
    { label: 'Customer Rating', value: '4.9/5 Avg' },
    { label: 'Delivery Coverage', value: 'Pan India' }
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container relative py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-primary-100">
                Premium Traditional Thekua
              </span>
              <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight">
                Authentic Taste,
                <span className="block text-primary-200">Modern Convenience</span>
              </h1>
              <p className="text-lg lg:text-xl text-primary-100 leading-relaxed max-w-xl">
                Experience handcrafted Thekua made with trusted ingredients and traditional recipes,
                packed hygienically and delivered fresh to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="btn btn-lg bg-white text-primary-600 hover:bg-primary-50 font-semibold"
                >
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/about"
                  className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Learn More
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/10 border border-white/20 p-3">
                    <p className="text-xs text-primary-100">{item.label}</p>
                    <p className="text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-white/10 border border-white/20 rounded-3xl p-6 lg:p-8 backdrop-blur-sm">
                <img
                  src="https://img.freepik.com/free-photo/front-view-delicious-sand-cookies-inside-plate-white-table-cake-cookie-biscuit_140725-79014.jpg?t=st=1771841558~exp=1771845158~hmac=755e7dc67b6aa77fa8f67750108aa6b59944ead381e09a05b01390179e1eadc4&w=1480"
                  alt="Traditional Thekua"
                  className="w-full h-72 lg:h-80 object-cover rounded-2xl bg-white"
                  onError={(e) => {
                    if (e.currentTarget.src.includes('79014.jpg')) {
                      e.currentTarget.src = 'https://img.freepik.com/free-photo/front-view-delicious-sand-cookies-inside-plate-light-white-table-cake-cookie-biscuit_140725-79013.jpg?t=st=1771841582~exp=1771845182~hmac=9fef0fbf9df5bb0ee5bea8db78da0f55e8ae4d50bbf69aae1f4c7d2a42dab6a1&w=1480'
                    } else if (e.currentTarget.src.includes('79013.jpg')) {
                      e.currentTarget.src = 'https://www.yummefy.com/uploads/1804b698e2.jpg'
                    } else {
                      e.currentTarget.src = '/thekua-placeholder.svg'
                    }
                  }}
                />
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-white/10 p-2">
                    <p className="text-xs text-primary-100">Ingredients</p>
                    <p className="text-sm font-semibold">Premium</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-2">
                    <p className="text-xs text-primary-100">Taste</p>
                    <p className="text-sm font-semibold">Authentic</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-2">
                    <p className="text-xs text-primary-100">Packaging</p>
                    <p className="text-sm font-semibold">Hygienic</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-5 bg-white text-primary-600 rounded-full p-3 shadow-lg">
                <Award className="w-8 h-8" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-3">
              Why Choose TheKua
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built on quality, consistency, and authentic preparation methods.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Truck,
                title: "Free Delivery",
                description: "Free delivery on orders above ₹500"
              },
              {
                icon: Shield,
                title: "Quality Assured",
                description: "100% fresh and authentic traditional recipes"
              },
              {
                icon: Award,
                title: "Premium Quality",
                description: "Made with finest ingredients and traditional methods"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center space-y-4 card p-6"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Bestselling Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our most popular Thekua selections loved by customers across the country.
            </p>
          </motion.div>

          {isLoading ? (
            <LoadingSpinner />
          ) : featuredProducts?.length ? (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {(featuredProducts || []).slice(0, 8).map((product) => (
                <motion.div key={product._id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-600">Featured products will appear here once added from admin panel.</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/products"
              className="btn btn-primary btn-lg"
            >
              View All Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                name: "Priya Sharma",
                location: "Mumbai",
                rating: 5,
                review: "Absolutely delicious! The thekua tastes exactly like my grandmother used to make. Fast delivery and excellent packaging."
              },
              {
                name: "Raj Kumar",
                location: "Delhi",
                rating: 5,
                review: "Best traditional sweets I've ever ordered online. Fresh, authentic, and delivered on time. Highly recommended!"
              },
              {
                name: "Meera Patel",
                location: "Bangalore",
                rating: 5,
                review: "TheKua has become our go-to for all festival celebrations. The quality is consistently excellent."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="card p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.review}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h2 className="text-3xl lg:text-4xl font-display font-bold">
              Ready to Experience Traditional Taste?
            </h2>
            <p className="text-xl text-primary-100">
              Join thousands of satisfied customers who trust TheKua for authentic traditional sweets
            </p>
            <Link
              to="/products"
              className="btn btn-lg bg-white text-primary-600 hover:bg-primary-50"
            >
              Start Shopping
              <ShoppingCart className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
