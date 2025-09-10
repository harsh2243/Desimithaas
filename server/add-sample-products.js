const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-store')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const Product = require('./models/Product');

const sampleThekuaProducts = [
  {
    name: 'Traditional Thekua',
    description: 'Authentic traditional Thekua made with jaggery, wheat flour, and ghee. Crispy, sweet, and perfect for festivals.',
    price: 299,
    category: 'Thekua',
    stock: 50,
    tags: ['traditional', 'crispy', 'sweet', 'festival'],
    isActive: true,
    isFeatured: true,
    weight: { value: 500, unit: 'gm' }
  },
  {
    name: 'Coconut Thekua',
    description: 'Delicious Thekua with fresh coconut flakes, adding a tropical twist to the traditional recipe.',
    price: 349,
    category: 'Thekua',
    stock: 30,
    tags: ['coconut', 'crispy', 'sweet', 'tropical'],
    isActive: true,
    isFeatured: false,
    weight: { value: 500, unit: 'gm' }
  },
  {
    name: 'Dry Fruits Thekua',
    description: 'Premium Thekua loaded with almonds, cashews, and raisins. Perfect for gifting.',
    price: 449,
    category: 'Thekua',
    stock: 25,
    tags: ['dry fruits', 'premium', 'almonds', 'cashews', 'gift'],
    isActive: true,
    isFeatured: true,
    weight: { value: 500, unit: 'gm' }
  },
  {
    name: 'Til Gud Thekua',
    description: 'Sesame and jaggery Thekua, perfect for winter festivals like Makar Sankranti.',
    price: 329,
    category: 'Festival Special',
    stock: 40,
    tags: ['sesame', 'jaggery', 'winter', 'makar sankranti'],
    isActive: true,
    isFeatured: false,
    weight: { value: 500, unit: 'gm' }
  },
  {
    name: 'Organic Thekua',
    description: 'Made with 100% organic ingredients - organic wheat flour, organic jaggery, and pure desi ghee.',
    price: 399,
    category: 'Organic',
    stock: 20,
    tags: ['organic', 'healthy', 'pure', 'desi ghee'],
    isActive: true,
    isFeatured: false,
    weight: { value: 500, unit: 'gm' }
  },
  {
    name: 'Sugar-Free Thekua',
    description: 'Diabetic-friendly Thekua sweetened with natural stevia and dates.',
    price: 379,
    category: 'Sugar-Free',
    stock: 15,
    tags: ['sugar-free', 'diabetic-friendly', 'stevia', 'dates', 'healthy'],
    isActive: true,
    isFeatured: false,
    weight: { value: 500, unit: 'gm' }
  },
  {
    name: 'Mini Thekua Bites',
    description: 'Bite-sized traditional Thekua, perfect for kids and portion control.',
    price: 249,
    category: 'Snacks',
    stock: 60,
    tags: ['mini', 'bite-sized', 'kids', 'portion control'],
    isActive: true,
    isFeatured: false,
    weight: { value: 300, unit: 'gm' }
  },
  {
    name: 'Thekua Gift Box',
    description: 'Beautiful gift box containing 4 varieties of Thekua - Traditional, Coconut, Dry Fruits, and Til Gud.',
    price: 799,
    category: 'Gift Boxes',
    stock: 10,
    tags: ['gift box', 'variety', 'festival', 'premium'],
    isActive: true,
    isFeatured: true,
    weight: { value: 800, unit: 'gm' }
  }
];

async function addSampleProducts() {
  try {
    // Clear existing products (optional)
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add sample products
    const products = await Product.insertMany(sampleThekuaProducts);
    console.log(`Added ${products.length} sample Thekua products:`);
    
    products.forEach(product => {
      console.log(`- ${product.name} (₹${product.price}) - ${product.category}`);
    });

    console.log('\nSample products added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample products:', error);
    process.exit(1);
  }
}

addSampleProducts();
