import React, { useState } from 'react';
import { X, Loader2, Mail, Lock, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess('Mã xác nhận đã được gửi đến email của bạn.');
        setTimeout(() => {
          setSuccess('');
          setStep(2);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/reset-password', { email, code, new_password: newPassword });
      if (res.data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mã xác nhận không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={resetState}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Quên Mật Khẩu?</h2>
                <p className="mt-2 text-gray-500">Nhập email của bạn để nhận mã khôi phục.</p>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
              {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>}

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    required
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Nhập email của bạn..."
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Gửi mã khôi phục'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tạo Mật Khẩu Mới</h2>
                <p className="mt-2 text-gray-500">Nhập mã xác nhận (6 số) được gửi đến {email}</p>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã xác nhận</label>
                  <input 
                    required
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-3 text-center tracking-widest text-lg font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="------"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                  <input 
                    required
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                    minLength={6}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Xác nhận đổi mật khẩu'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thành công!</h2>
              <p className="text-gray-500 mb-8">Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.</p>
              <button 
                onClick={resetState}
                className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-xl transition-colors"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
