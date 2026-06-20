import { formatCurrency } from '../utils/formatters';
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Package, Save, XCircle } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, loading: authLoading, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);
  const [changePasswordToken, setChangePasswordToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      if (res.data.success) setOrders(res.data.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put('/auth/profile', formData);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchProfile(); // Refresh global user state
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordUpdating(true);
    try {
      const res = await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      if (res.data.success && res.data.data.change_password_token) {
        setChangePasswordToken(res.data.data.change_password_token);
        setPasswordStep(2);
        toast.success('Verification code sent to your email.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate password change');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleVerifyChangePassword = async (e) => {
    e.preventDefault();
    setPasswordUpdating(true);
    try {
      const res = await api.post('/auth/change-password-verify', {
        change_password_token: changePasswordToken,
        code: verificationCode
      });
      if (res.data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setVerificationCode('');
        setPasswordStep(1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const res = await api.patch(`/orders/${orderId}/cancel`);
        if (res.data.success) {
          toast.success('Order cancelled successfully!');
          fetchOrders();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Profile Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-md border-2 border-slate-300 shadow-md ring-1 ring-slate-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
              
              {message.text && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={user.email} disabled className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 bg-gray-50 text-gray-500 cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <textarea rows="3" name="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                
                <button type="submit" disabled={updating} className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl mt-4 transition-colors">
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Changes</>}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white p-8 rounded-3xl shadow-md border-2 border-slate-300 shadow-md ring-1 ring-slate-200 mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
              
              {passwordStep === 1 ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                    <input required type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                    <input required type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                    <input required type="password" value={passwordData.confirm_password} onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <button type="submit" disabled={passwordUpdating} className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl mt-4 transition-colors">
                    {passwordUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Change Password'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyChangePassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      We've sent a 6-digit verification code to your email.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Verification Code</label>
                    <input 
                      required type="text" maxLength="6"
                      value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="------"
                    />
                  </div>
                  <button type="submit" disabled={passwordUpdating} className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl mt-4 transition-colors shadow-lg">
                    {passwordUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Change'}
                  </button>
                  <div className="text-center mt-3">
                    <button 
                      type="button" 
                      onClick={() => setPasswordStep(1)} 
                      className="text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      &larr; Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-md border-2 border-slate-300 shadow-md ring-1 ring-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <Package className="text-primary" size={28} />
                <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="border-2 border-slate-300 shadow-md ring-1 ring-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Order #{order.id}</p>
                          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{formatCurrency(parseFloat(order.total_price))}</p>
                            <span className={`inline-block px-3 py-1 mt-2 rounded-full text-xs font-bold uppercase
                              ${order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' : 
                                order.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                'bg-blue-100 text-blue-700'}`}>
                              {order.status}
                            </span>
                          </div>
                          {(order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'preparing') && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center gap-1 font-medium transition-colors"
                            >
                              <XCircle size={16} />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
