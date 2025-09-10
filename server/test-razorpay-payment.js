const axios = require('axios');
require('dotenv').config();

const baseURL = 'http://localhost:5001/api';

async function testRazorpayPayment() {
    console.log('🧪 Testing Razorpay Payment Flow...\n');

    try {
        // Step 1: Login
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@thekua.com',
            password: 'Admin@123'
        });

        if (loginResponse.data.status !== 'success') {
            console.log('❌ Login failed');
            return;
        }

        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful');

        // Step 2: Create Razorpay Order
        console.log('\n2. Creating Razorpay order...');
        try {
            const razorpayOrderResponse = await axios.post(
                `${baseURL}/payments/create-razorpay-order`,
                {
                    amount: 599 // ₹599
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (razorpayOrderResponse.data.success) {
                console.log('✅ Razorpay order created successfully');
                console.log(`📋 Order ID: ${razorpayOrderResponse.data.data.orderId}`);
                console.log(`💰 Amount: ₹${razorpayOrderResponse.data.data.amount / 100}`);
                
                // Step 3: Test Order Creation with Payment Details
                console.log('\n3. Testing order creation with payment details...');
                const orderData = {
                    items: [
                        {
                            product: {
                                _id: '507f1f77bcf86cd799439011',
                                name: 'Test Thekua',
                                price: 299,
                                image: 'https://example.com/test.jpg',
                                description: 'Test product',
                                category: 'Sweets'
                            },
                            quantity: 2,
                            price: 299,
                            subtotal: 598
                        }
                    ],
                    shippingAddress: {
                        firstName: 'Test',
                        lastName: 'User',
                        phone: '+91 9876543210',
                        email: 'test@example.com',
                        street: '123 Test Street',
                        city: 'Test City',
                        state: 'Test State',
                        postalCode: '123456',
                        country: 'India'
                    },
                    paymentMethod: 'razorpay',
                    paymentDetails: {
                        orderId: razorpayOrderResponse.data.data.orderId,
                        paymentId: 'pay_test_payment_id',
                        signature: 'test_signature',
                        method: 'Razorpay'
                    },
                    totalAmount: 599,
                    subtotal: 598,
                    shippingCost: 0,
                    tax: 30
                };

                try {
                    const orderResponse = await axios.post(
                        `${baseURL}/orders`,
                        orderData,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (orderResponse.data.status === 'success') {
                        console.log('✅ Order created successfully');
                        console.log(`📦 Order ID: ${orderResponse.data.data.order._id}`);
                        console.log(`📋 Order Number: ${orderResponse.data.data.order.orderNumber}`);
                    } else {
                        console.log('❌ Order creation failed:', orderResponse.data.message);
                        console.log('📋 Full error response:', orderResponse.data);
                    }
                } catch (orderError) {
                    console.log('❌ Order creation request failed:', orderError.response?.data || orderError.message);
                    console.log('📋 Full error details:', orderError.response?.data);
                }

            } else {
                console.log('❌ Razorpay order creation failed:', razorpayOrderResponse.data.message);
            }

        } catch (razorpayError) {
            console.log('❌ Razorpay order creation error:', razorpayError.response?.data?.message || razorpayError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
}

// Test environment variables
async function testEnvironment() {
    console.log('🧪 Testing Environment Setup...\n');
    
    console.log('Environment Variables:');
    console.log(`- RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Not set'}`);
    console.log(`- RAZORPAY_SECRET_KEY: ${process.env.RAZORPAY_SECRET_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`- MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
    
    // Test Razorpay service
    try {
        const { createOrder } = require('./services/razorpayService');
        console.log('\n🧪 Testing Razorpay Service...');
        
        const testOrder = await createOrder(100, 'INR', 'test_receipt');
        console.log('✅ Razorpay service working');
        console.log(`📋 Test order ID: ${testOrder.id}`);
        
    } catch (serviceError) {
        console.log('❌ Razorpay service error:', serviceError.message);
    }
}

async function runTests() {
    await testEnvironment();
    console.log('\n' + '='.repeat(50) + '\n');
    await testRazorpayPayment();
    console.log('\n🏁 Tests completed!');
}

runTests();
