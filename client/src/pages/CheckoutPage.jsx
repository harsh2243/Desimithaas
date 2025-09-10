import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Shield, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Edit2,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'India'
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
  }, [cartItems, navigate, orderPlaced]);

  const subtotal = getCartTotal();
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const response = await fetch('http://localhost:5001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.data.order._id);
      setOrderPlaced(true);
      clearCart();
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place order');
      setIsProcessing(false);
    }
  });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAddress = () => {
    const required = ['firstName', 'lastName', 'phone', 'street', 'city', 'state', 'postalCode'];
    for (const field of required) {
      if (!shippingAddress[field]?.trim()) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    
    // Phone validation
    if (!/^\+?[0-9]{10,15}$/.test(shippingAddress.phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    // Postal code validation for India
    if (shippingAddress.country === 'India' && !/^[1-9][0-9]{5}$/.test(shippingAddress.postalCode)) {
      toast.error('Please enter a valid Indian PIN code');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    setIsProcessing(true);

    const orderData = {
      items: cartItems.map(item => ({
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.discountPrice || item.product.price,
          image: item.product.mainImage || item.product.images?.[0]?.url || '/thekua-placeholder.svg',
          description: item.product.description || '',
          category: item.product.category || 'Traditional Sweets'
        },
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price
      })),
      shippingAddress,
      paymentMethod,
      totalAmount: total,
      subtotal,
      shippingCost: shipping
    };

    if (paymentMethod === 'cod') {
      // For COD, directly place the order
      placeOrderMutation.mutate(orderData);
    } else if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
      // Both card and UPI payments use Razorpay
      await handleRazorpayPayment(orderData);
    }
  };

  const handleRazorpayPayment = async (orderData) => {
    try {
      // Create Razorpay order
      const response = await fetch('http://localhost:5001/api/payments/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount: total }) // Amount in INR
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create Razorpay order');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.data.amount,
        currency: result.data.currency,
        name: 'TheKua',
        description: 'Traditional Sweets Order',
        order_id: result.data.orderId,
        handler: (response) => {
          // Payment successful
          placeOrderMutation.mutate({
            ...orderData,
            paymentDetails: {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              method: paymentMethod === 'upi' ? 'UPI' : 'Razorpay'
            }
          });
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error('Payment was cancelled');
          }
        },
        prefill: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          email: shippingAddress.email,
          contact: shippingAddress.phone
        },
        theme: {
          color: '#2563eb'
        },
        // Configure payment methods based on selected option
        config: {
          display: {
            blocks: {
              // Show UPI options for UPI payment
              upi: {
                name: 'Pay using UPI',
                instruments: paymentMethod === 'upi' ? [
                  { method: 'upi' }
                ] : []
              },
              // Show card options for card payment  
              card: {
                name: 'Credit/Debit Cards',
                instruments: paymentMethod === 'razorpay' ? [
                  { method: 'card' }
                ] : []
              },
              // Always show other methods as fallback
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'netbanking' },
                  { method: 'wallet' }
                ]
              }
            },
            // Prioritize based on selected payment method
            sequence: paymentMethod === 'upi' ? ['upi', 'other'] : ['card', 'other'],
            preferences: {
              show_default_blocks: false
            }
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast.error('Payment initialization failed');
      setIsProcessing(false);
    }
  };

  // Success screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Order Placed Successfully!
          </h2>
          
          <p className="text-gray-600 mb-2">
            Thank you for your order. Your order ID is:
          </p>
          
          <p className="text-lg font-semibold text-primary-600 mb-6">
            #{orderId}
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            You will receive an email confirmation shortly. You can track your order in your profile.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full btn btn-primary"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/products')}
              className="w-full btn btn-outline"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/cart')}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Forms */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                    Shipping Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={shippingAddress.firstName}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={shippingAddress.lastName}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={shippingAddress.email}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="House number, street name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="123456"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="Canada">Canada</option>
                      <option value="UK">UK</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                  Payment Method
                </h2>

                <div className="space-y-4">
                  {/* Cash on Delivery */}
                  <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Banknote className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Cash on Delivery</h3>
                          <p className="text-sm text-gray-500">Pay when you receive your order</p>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Online Payment - Card */}
                  <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">Credit/Debit Card</h3>
                          <p className="text-sm text-gray-500">Pay securely with Razorpay</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400">Powered by</span>
                            <span className="text-xs font-medium text-blue-600 ml-1">Razorpay</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* UPI Payment */}
                  <label className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Smartphone className="w-6 h-6 text-purple-600 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">UPI Payment</h3>
                          <p className="text-sm text-gray-500">Pay with PhonePe, GPay, Paytm & more</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400">Powered by</span>
                            <span className="text-xs font-medium text-blue-600 ml-1">Razorpay</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-sm text-blue-800">
                    <Shield className="w-4 h-4 mr-2" />
                    Your payment information is secure and encrypted
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.product._id} className="flex items-center space-x-4">
                      <img
                        src={item.product.images?.[0] || '/thekua-placeholder.svg'}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || placeOrderMutation.isPending}
                  className="w-full mt-6 btn btn-primary btn-lg disabled:opacity-50"
                >
                  {isProcessing || placeOrderMutation.isPending ? (
                    'Processing...'
                  ) : (
                    `Place Order - ${formatPrice(total)}`
                  )}
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;
