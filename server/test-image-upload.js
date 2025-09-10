const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// This script will simulate uploading an image URL to a product
// In real usage, images will be uploaded through the admin panel to Cloudinary

async function updateProductWithTestImage() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-store');
    console.log('Connected to MongoDB');

    // Get the first product
    const product = await Product.findOne();
    if (!product) {
      console.log('No products found');
      return;
    }

    console.log('Original product:', {
      name: product.name,
      mainImage: product.mainImage,
      images: product.images
    });

    // Update with a test Cloudinary URL (this simulates what happens when you upload via admin)
    // This is just for testing - real images will come from your admin uploads
    const testImageUrl = 'https://res.cloudinary.com/dm0piadkg/image/upload/v1/thekua-products/sample-thekua';
    
    await Product.findByIdAndUpdate(product._id, {
      mainImage: testImageUrl
    });

    console.log('Updated product with test image URL');
    
    // Fetch the updated product
    const updatedProduct = await Product.findById(product._id);
    console.log('Updated product:', {
      name: updatedProduct.name,
      mainImage: updatedProduct.mainImage,
      images: updatedProduct.images
    });

    console.log('\nNow when you refresh the frontend, this product should show the image instead of placeholder');
    console.log('To add real images, use the admin panel at http://localhost:3001/admin/products');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

updateProductWithTestImage();
