const axios = require('axios');

const baseURL = 'http://localhost:5001/api';

async function testCartFunctionality() {
    console.log('🧪 Testing Cart Functionality...\n');

    try {
        // Test 1: Get Products
        console.log('1. Testing product retrieval...');
        const productsResponse = await axios.get(`${baseURL}/products`);
        console.log(`✅ Products retrieved: ${productsResponse.data.data.products.length} products found`);
        
        if (productsResponse.data.data.products.length === 0) {
            console.log('❌ No products available to add to cart');
            return;
        }

        const sampleProduct = productsResponse.data.data.products[0];
        console.log(`📦 Sample product: ${sampleProduct.name} (₹${sampleProduct.price})`);

        // Test 2: Test login with existing user
        console.log('\n2. Testing user authentication...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@thekua.com',
            password: 'Admin@123'
        });
        
        if (loginResponse.data.status === 'success') {
            const token = loginResponse.data.data.accessToken;
            console.log('✅ Login successful');

            // Test 3: Add product to cart (backend test)
            console.log('\n3. Testing add to cart (backend)...');
            try {
                const cartResponse = await axios.post(
                    `${baseURL}/users/cart/add`,
                    {
                        productId: sampleProduct._id,
                        quantity: 2
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                console.log('✅ Product added to cart successfully');
                console.log(`📋 Cart total: ₹${cartResponse.data.data.totalAmount}`);
            } catch (cartError) {
                console.log('❌ Failed to add to cart:', cartError.response?.data?.message || cartError.message);
            }

            // Test 4: Get cart contents
            console.log('\n4. Testing get cart contents...');
            try {
                const getCartResponse = await axios.get(`${baseURL}/users/cart`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('✅ Cart retrieved successfully');
                console.log(`📋 Cart items: ${getCartResponse.data.data.cart.length}`);
            } catch (getCartError) {
                console.log('❌ Failed to get cart:', getCartError.response?.data?.message || getCartError.message);
            }

        } else {
            console.log('❌ Login failed');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
}

// Test profile update functionality
async function testProfileUpdate() {
    console.log('\n🧪 Testing Profile Update Functionality...\n');

    try {
        // Login first
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@thekua.com',
            password: 'Admin@123'
        });

        if (loginResponse.data.status === 'success') {
            const token = loginResponse.data.data.accessToken;
            console.log('✅ Login successful for profile test');

            // Test profile update
            console.log('\n1. Testing profile update...');
            try {
                const profileUpdateResponse = await axios.put(
                    `${baseURL}/user/profile`,
                    {
                        firstName: 'Updated',
                        lastName: 'Admin',
                        phone: '+91 9876543210',
                        address: {
                            street: '123 Test Street',
                            city: 'Test City',
                            state: 'Test State',
                            postalCode: '123456',
                            country: 'India'
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                console.log('✅ Profile updated successfully');
                console.log(`👤 Updated user: ${profileUpdateResponse.data.data.user.firstName} ${profileUpdateResponse.data.data.user.lastName}`);
            } catch (profileError) {
                console.log('❌ Profile update failed:', profileError.response?.data?.message || profileError.message);
            }

            // Test orders endpoint
            console.log('\n2. Testing orders endpoint...');
            try {
                const ordersResponse = await axios.get(`${baseURL}/user/orders`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('✅ Orders retrieved successfully');
                console.log(`📦 Order count: ${ordersResponse.data.data.orders.length}`);
            } catch (ordersError) {
                console.log('❌ Orders retrieval failed:', ordersError.response?.data?.message || ordersError.message);
            }
        }
    } catch (error) {
        console.error('❌ Profile test failed:', error.response?.data?.message || error.message);
    }
}

// Run tests
async function runAllTests() {
    await testCartFunctionality();
    await testProfileUpdate();
    console.log('\n🏁 All tests completed!');
}

runAllTests();
