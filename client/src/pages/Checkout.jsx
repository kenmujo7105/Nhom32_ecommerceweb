import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill if logged in
  useEffect(() => {
    if (user) {
      setFormData({
        customer_name: user.name || '',
        customer_email: user.email || '',
        customer_phone: user.phone || '',
        customer_address: user.address || ''
      });
    }
  }, [user]);

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const items = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    try {
      const res = await api.post('/orders', {
        ...formData,
        items,
        payment_method: paymentMethod
      });
      
      if (res.data.success) {
        const orderId = res.data.data.order_id;
        
        if (paymentMethod === 'stripe') {
          // Initialize Stripe Checkout
          try {
            const stripeRes = await api.post('/payment/create', { order_id: orderId });
            if (stripeRes.data.success && stripeRes.data.url) {
              window.location.href = stripeRes.data.url;
              return; // Halt further execution, user is redirecting
            } else {
              toast.error('Failed to initialize payment. Proceeding as COD.');
            }
          } catch (stripeErr) {
            console.error('Stripe error:', stripeErr);
            toast.error('Stripe not configured properly. Order placed as COD.');
          }
        }
        
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order-success/${orderId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input 
                  required
                  type="text" 
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input 
                  required
                  type="email" 
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Address</label>
                <textarea 
                  required
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="123 Commerce St, City, Country, ZIP"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setPaymentMethod('cod')}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}
                  >
                    <Banknote size={32} />
                    <span className="font-semibold text-sm text-center">Cash on Delivery</span>
                  </div>
                  <div 
                    onClick={() => setPaymentMethod('stripe')}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}
                  >
                    <CreditCard size={32} />
                    <span className="font-semibold text-sm text-center">Pay Online (Stripe)</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8"
              >
                {submitting ? <Loader2 className="animate-spin" size={24} /> : `Pay $${getCartTotal().toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => {
                  const price = item.product.sale_price ? parseFloat(item.product.sale_price) : parseFloat(item.product.price);
                  return (
                    <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <img src={item.product.image_url || 'https://via.placeholder.com/100'} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div>
                          <p className="font-semibold text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="font-bold text-gray-900">${(price * item.quantity).toFixed(2)}</div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-primary">${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
