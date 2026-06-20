import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Step 1: Form, Step 2: Verification
  const [step, setStep] = useState(1);
  const [registrationToken, setRegistrationToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', phone: '', address: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email.endsWith('@gmail.com')) {
      setError('Vui lòng sử dụng địa chỉ email @gmail.com');
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Số điện thoại phải bao gồm đúng 10 chữ số');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success && res.data.data.registration_token) {
        setRegistrationToken(res.data.data.registration_token);
        setStep(2);
      }
    } catch (err) {
      if (err.response?.data?.data?.length > 0) {
        setError(err.response.data.data[0].msg);
      } else {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register-verify', {
        registration_token: registrationToken,
        code: verificationCode
      });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200">
        
        {step === 1 && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
              <p className="mt-2 text-gray-600">Join AuraShop today</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input 
                  required type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address (@gmail.com)</label>
                <input 
                  required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  required type="password" name="password" minLength="6" value={formData.password} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input 
                  required type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                  placeholder="0987654321"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address (Optional)</label>
                <input 
                  type="text" name="address" value={formData.address} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full flex justify-center items-center bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Register'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-600">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900">Verify Email</h2>
              <p className="mt-2 text-gray-600">
                We've sent a 6-digit verification code to <br/>
                <strong>{formData.email}</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Verification Code</label>
                <input 
                  required type="text" maxLength="6"
                  value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold rounded-xl border-2 border-slate-300 shadow-md ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                  placeholder="------"
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full flex justify-center items-center bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Verify & Complete'}
              </button>
              
              <div className="text-center mt-4">
                 <button 
                   type="button" 
                   onClick={() => setStep(1)} 
                   className="text-sm text-gray-500 hover:text-primary transition-colors"
                 >
                   &larr; Back to Registration
                 </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default Register;
