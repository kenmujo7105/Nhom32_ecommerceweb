import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  const [verifying, setVerifying] = useState(!!vnp_ResponseCode);

  useEffect(() => {
    if (vnp_ResponseCode) {
      const verifyPayment = async () => {
        try {
          const paramsObj = Object.fromEntries(searchParams.entries());
          const res = await api.post('/payment/vnpay/callback', paramsObj);
          if (res.data.success) {
            toast.success('Thanh toán VNPay thành công!');
          }
        } catch (err) {
          console.error(err);
          const message = err.response?.data?.message || 'Xác thực thanh toán thất bại.';
          toast.error(message);
        } finally {
          setVerifying(false);
        }
      };
      verifyPayment();
    }
  }, [vnp_ResponseCode]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-12 rounded-3xl shadow-md text-center max-w-lg w-full border-2 border-slate-300 shadow-md ring-1 ring-slate-200">
        {verifying ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-800">Verifying your payment...</h2>
            <p className="text-gray-500 mt-2">Please do not close this page.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6 text-green-500">
              <CheckCircle size={80} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-xl text-gray-600 mb-8">Your order has been successfully placed.</p>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border-2 border-slate-300 shadow-md ring-1 ring-slate-200">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Order Reference</p>
              <p className="text-2xl font-bold text-primary">#{orderId}</p>
            </div>

            <Link 
              to="/products"
              className="block w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-full transition-colors"
            >
              Continue Shopping
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;
