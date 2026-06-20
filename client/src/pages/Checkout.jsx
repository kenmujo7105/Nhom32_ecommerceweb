import { formatCurrency } from '../utils/formatters';
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
    customer_phone: ''
  });
  
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedDistrict, setSelectedDistrict] = useState({ code: '', name: '' });
  const [selectedWard, setSelectedWard] = useState({ code: '', name: '' });
  const [streetAddress, setStreetAddress] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Provinces
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch Districts when Province changes
  useEffect(() => {
    if (selectedProvince.code) {
      fetch(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`)
        .then(res => res.json())
        .then(data => {
          setDistricts(data.districts || []);
          setWards([]);
          setSelectedDistrict({ code: '', name: '' });
          setSelectedWard({ code: '', name: '' });
        })
        .catch(err => console.error(err));
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince.code]);

  // Fetch Wards when District changes
  useEffect(() => {
    if (selectedDistrict.code) {
      fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict.code}?depth=2`)
        .then(res => res.json())
        .then(data => {
          setWards(data.wards || []);
          setSelectedWard({ code: '', name: '' });
        })
        .catch(err => console.error(err));
    } else {
      setWards([]);
    }
  }, [selectedDistrict.code]);

  // Pre-fill if logged in
  useEffect(() => {
    if (user) {
      setFormData({
        customer_name: user.name || '',
        customer_email: user.email || '',
        customer_phone: user.phone || ''
      });
      if (user.address) {
        setStreetAddress(user.address);
      }
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
    
    if (!selectedProvince.name || !selectedDistrict.name || !selectedWard.name || !streetAddress.trim()) {
      toast.error('Vui lòng điền đầy đủ địa chỉ nhận hàng.');
      return;
    }

    setSubmitting(true);

    const fullAddress = `${streetAddress.trim()}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;

    const items = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    try {
      const res = await api.post('/orders', {
        ...formData,
        customer_address: fullAddress,
        items,
        payment_method: paymentMethod
      });
      
      if (res.data.success) {
        const orderId = res.data.data.order_id;
        
        if (paymentMethod === 'vnpay') {
          // Initialize VNPay Checkout
          try {
            const vnpayRes = await api.post('/payment/vnpay/create', { order_id: orderId });
            if (vnpayRes.data.success && vnpayRes.data.url) {
              window.location.href = vnpayRes.data.url;
              return; // Halt further execution, user is redirecting
            } else {
              toast.error('Failed to initialize payment. Proceeding as COD.');
            }
          } catch (vnpayErr) {
            console.error('VNPay error:', vnpayErr);
            toast.error('VNPay not configured properly. Order placed as COD.');
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
          <div className="bg-white p-8 rounded-3xl shadow-md border-2 border-slate-300 shadow-md ring-1 ring-slate-200">
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Address</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <select
                    required
                    value={selectedProvince.code}
                    onChange={(e) => setSelectedProvince({ 
                      code: e.target.value, 
                      name: e.target.options[e.target.selectedIndex].text 
                    })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white"
                  >
                    <option value="" disabled>Tỉnh/Thành phố</option>
                    {provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>

                  <select
                    required
                    disabled={!selectedProvince.code}
                    value={selectedDistrict.code}
                    onChange={(e) => setSelectedDistrict({ 
                      code: e.target.value, 
                      name: e.target.options[e.target.selectedIndex].text 
                    })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white disabled:bg-slate-100"
                  >
                    <option value="" disabled>Quận/Huyện</option>
                    {districts.map(d => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>

                  <select
                    required
                    disabled={!selectedDistrict.code}
                    value={selectedWard.code}
                    onChange={(e) => setSelectedWard({ 
                      code: e.target.value, 
                      name: e.target.options[e.target.selectedIndex].text 
                    })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white disabled:bg-slate-100"
                  >
                    <option value="" disabled>Phường/Xã</option>
                    {wards.map(w => (
                      <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <textarea 
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  rows="2"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Số nhà, Tên đường..."
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
                    onClick={() => setPaymentMethod('vnpay')}
                    className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}
                  >
                    <CreditCard size={32} />
                    <span className="font-semibold text-sm text-center">Thanh toán online (VNPay)</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8"
              >
                {submitting ? <Loader2 className="animate-spin" size={24} /> : `Pay ${formatCurrency(getCartTotal())}`}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white p-8 rounded-3xl shadow-md border-2 border-slate-300 shadow-md ring-1 ring-slate-200 sticky top-24">
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
                      <div className="font-bold text-gray-900">{formatCurrency((price * item.quantity))}</div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-primary">{formatCurrency(getCartTotal())}</span>
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
