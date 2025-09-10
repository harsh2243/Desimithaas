import { motion } from 'framer-motion'

function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6">
            About TheKua
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bringing you the authentic taste of traditional Indian sweets, 
            made with love and served with pride for over generations.
          </p>
        </motion.div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                TheKua was born from a deep love for traditional Indian sweets and 
                a desire to share the authentic flavors of our heritage with the world. 
                Our journey began in the kitchens of Bihar, where the art of making 
                thekua has been passed down through generations.
              </p>
              <p>
                What started as a family tradition of preparing sweets for festivals 
                and special occasions has grown into a mission to preserve and promote 
                the rich culinary heritage of traditional Indian sweets.
              </p>
              <p>
                Today, we continue to honor these time-tested recipes while ensuring 
                that every bite delivers the same authentic taste that has delighted 
                families for centuries.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img
              src="https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Traditional sweet making"
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </motion.div>
        </div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-8">
            Our Mission
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Authentic Recipes",
                description: "Preserving traditional recipes passed down through generations"
              },
              {
                title: "Quality Ingredients",
                description: "Using only the finest, natural ingredients for the best taste"
              },
              {
                title: "Fresh Delivery",
                description: "Ensuring every product reaches you fresh and delicious"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-lg p-8 shadow-lg"
        >
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Tradition & Heritage
              </h3>
              <p className="text-gray-600">
                We honor the rich culinary traditions of our ancestors, 
                ensuring that every recipe maintains its authentic character 
                and cultural significance.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Quality & Freshness
              </h3>
              <p className="text-gray-600">
                We never compromise on quality. Every product is made fresh 
                using premium ingredients, ensuring the highest standards 
                of taste and nutrition.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Customer Satisfaction
              </h3>
              <p className="text-gray-600">
                Your happiness is our priority. We strive to exceed expectations 
                with every order, providing exceptional service and delicious products.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sustainability
              </h3>
              <p className="text-gray-600">
                We are committed to sustainable practices, from sourcing 
                ingredients responsibly to using eco-friendly packaging materials.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default About
