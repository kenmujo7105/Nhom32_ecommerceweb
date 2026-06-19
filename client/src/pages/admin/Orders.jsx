import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Table state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Pass params for pagination/search/filter
      const res = await api.get('/orders', { 
        params: { page, search, status: statusFilter, limit: 10 } 
      });
      if (res.data && res.data.data) {
        setOrders(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        let filtered = [...res.data];
        if (search) {
          filtered = filtered.filter(o => 
            o.customerName?.toLowerCase().includes(search.toLowerCase()) || 
            o.customerPhone?.includes(search)
          );
        }
        if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);
        setOrders(filtered);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(); // Refresh table
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    }
  };

  const openOrderDetail = async (order) => {
    try {
      // Fetch full order details if needed, or use the row data
      const res = await api.get(`/orders/${order._id || order.id}`);
      if (res.data && res.data.success) {
        setSelectedOrder(res.data.data);
      } else {
        setSelectedOrder(order);
      }
    } catch (err) {
      setSelectedOrder(order);
    }
    setIsModalOpen(true);
  };

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const columns = [
    { header: 'Order ID', field: '_id', render: (row) => <span className="font-medium text-slate-800">#{String(row._id || row.id).slice(-6).toUpperCase()}</span> },
    { 
      header: 'Customer', 
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.customerName || 'N/A'}</div>
          <div className="text-xs text-slate-500">{row.customerPhone || ''}</div>
        </div>
      ) 
    },
    { header: 'Date', render: (row) => <span className="text-slate-600">{new Date(row.createdAt || row.date || Date.now()).toLocaleDateString()}</span> },
    { header: 'Total', render: (row) => <span className="font-medium">${Number(row.total || row.totalAmount || 0).toFixed(2)}</span> },
    { 
      header: 'Status', 
      render: (row) => (
        <div className="relative inline-block group">
          <select 
            value={row.status || 'pending'}
            onChange={(e) => handleUpdateStatus(row._id || row.id, e.target.value)}
            className="appearance-none bg-transparent outline-none cursor-pointer pl-2 pr-6 py-1 border border-transparent hover:border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600" />
        </div>
      ) 
    },
    { 
      header: 'Actions', 
      className: 'text-right',
      render: (row) => (
        <button 
          onClick={() => openOrderDetail(row)}
          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="View Details"
        >
          <Eye size={18} />
        </button>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 hidden md:block">Orders</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customer or phone..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 text-sm outline-none"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white w-full sm:w-48 text-sm outline-none capitalize"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={orders} 
        loading={loading} 
        page={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
        keyField="_id"
      />

      {/* Order Detail Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Order Details #${selectedOrder ? String(selectedOrder._id || selectedOrder.id).slice(-6).toUpperCase() : ''}`}
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Customer Information</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-slate-500">Name:</span>
                <span className="font-medium text-slate-800">{selectedOrder.customerName || 'N/A'}</span>
                
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-800">{selectedOrder.customerPhone || 'N/A'}</span>
                
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{selectedOrder.customerEmail || 'N/A'}</span>
                
                <span className="text-slate-500">Address:</span>
                <span className="font-medium text-slate-800">{selectedOrder.shippingAddress || 'N/A'}</span>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-wide">Order Information</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-800">{new Date(selectedOrder.createdAt || selectedOrder.date || Date.now()).toLocaleString()}</span>
                
                <span className="text-slate-500">Status:</span>
                <div><StatusBadge status={selectedOrder.status} /></div>
              </div>

              {/* Order Items */}
              <div className="mt-4">
                <h5 className="text-xs font-semibold text-slate-500 mb-2 uppercase border-b border-slate-200 pb-1">Items</h5>
                <ul className="space-y-3">
                  {(selectedOrder.items || selectedOrder.products || []).map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <img src={item.product?.image || item.image || 'https://via.placeholder.com/30'} alt="product" className="w-8 h-8 rounded object-cover" />
                        <div>
                          <div className="font-medium text-slate-800">{item.product?.name || item.name || 'Product Name'}</div>
                          <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <span className="font-medium text-slate-800">${Number(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center text-sm font-bold">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 text-lg">${Number(selectedOrder.total || selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
