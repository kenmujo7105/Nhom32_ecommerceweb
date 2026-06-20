import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  
  const [verifying, setVerifying] = useState(!!vnp_ResponseCode);
  const [paymentStatus, setPaymentStatus] = useState(vnp_ResponseCode ? 'pending' : 'success'); // 'pending', 'success', 'failed'

  useEffect(() => {
    if (vnp_ResponseCode) {
      const verifyPayment = async () => {
        try {
          if (vnp_ResponseCode !== '00') {
            setPaymentStatus('failed');
            setVerifying(false);
            return;
          }

          const paramsObj = Object.fromEntries(searchParams.entries());
          const res = await api.post('/payment/vnpay/callback', paramsObj);
          if (res.data.success) {
            toast.success('Thanh toán VNPay thành công!');
            setPaymentStatus('success');
          }
        } catch (err) {
          console.error(err);
          const message = err.response?.data?.message || 'Xác thực thanh toán thất bại.';
          toast.error(message);
          setPaymentStatus('failed');
        } finally {
          setVerifying(false);
        }
      };
      verifyPayment();
    }
  }, [vnp_ResponseCode, searchParams]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-12 rounded-3xl shadow-md text-center max-w-lg w-full border-2 border-slate-300 ring-1 ring-slate-200">
        {verifying ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800">Đang xác thực thanh toán...</h2>
            <p className="text-gray-500 mt-2">Vui lòng không đóng trang này.</p>
          </div>
        ) : paymentStatus === 'success' ? (
          <>
            <div className="flex justify-center mb-6 text-green-500">
              <CheckCircle size={80} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Cảm ơn bạn!</h1>
            <p className="text-xl text-gray-600 mb-8">Đơn hàng của bạn đã được đặt thành công.</p>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border-2 border-slate-300 shadow-md ring-1 ring-slate-200">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Mã Đơn Hàng</p>
              <p className="text-2xl font-bold text-primary">#{orderId}</p>
            </div>

            <Link 
              to="/products"
              className="block w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-full transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6 text-red-500">
              <XCircle size={80} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Thanh toán thất bại!</h1>
            <p className="text-lg text-gray-600 mb-8">Rất tiếc, giao dịch của bạn không thành công hoặc đã bị hủy. Đơn hàng của bạn vẫn được lưu lại nhưng chưa được thanh toán (chưa trừ hàng).</p>
            
            <button 
              onClick={() => navigate('/checkout')}
              className="block w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full transition-colors mb-4"
            >
              Thử lại với phương thức khác
            </button>
            <Link 
              to="/products"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-full transition-colors"
            >
              Quay về trang chủ
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;
