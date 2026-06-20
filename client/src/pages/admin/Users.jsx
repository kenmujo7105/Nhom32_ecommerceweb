import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldAlert, Power, User, Filter, Trash2, Package, X } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Table state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Action state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'role' or 'status'
  const [targetUser, setTargetUser] = useState(null);

  // Products Modal State
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, search, statusFilter, sortField, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { 
        params: { page, search, role: 'customer', is_active: statusFilter, sort_by: sortField, sort_order: sortOrder, limit: 10 } 
      });
      if (res.data && res.data.data) {
        setUsers(res.data.data);
        setTotalPages(Math.ceil((res.data.pagination?.total || 0) / (res.data.pagination?.limit || 10)) || 1);
      } else if (Array.isArray(res.data)) {
        let filtered = [...res.data];
        if (search) {
          filtered = filtered.filter(u => 
            u.name?.toLowerCase().includes(search.toLowerCase()) || 
            u.email?.toLowerCase().includes(search.toLowerCase())
          );
        }
        setUsers(filtered);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (type, user) => {
    setActionType(type);
    setTargetUser(user);
    setIsConfirmOpen(true);
  };

  const handleViewProducts = async (user) => {
    setTargetUser(user);
    setProductsModalOpen(true);
    setProductsLoading(true);
    setUserProducts([]);
    try {
      const res = await api.get(`/admin/users/${user._id || user.id}/products`);
      if (res.data.success) {
        setUserProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch user products", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const confirmAction = async () => {
    if (!targetUser) return;
    try {
      if (actionType === 'role') {
        const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
        await api.patch(`/admin/users/${targetUser._id || targetUser.id}`, { role: newRole });
      } else if (actionType === 'status') {
        // Assume missing active field implies active
        const currentStatus = targetUser.is_active !== 0 && targetUser.is_active !== false; 
        await api.patch(`/admin/users/${targetUser._id || targetUser.id}`, { is_active: !currentStatus });
      } else if (actionType === 'delete') {
        await api.delete(`/admin/users/${targetUser._id || targetUser.id}`);
      }
      fetchUsers(); // Refresh
    } catch (err) {
      console.error(`Failed to update user ${actionType}`, err);
      alert(`Failed to update user ${actionType}.`);
    }
  };

  const columns = [
    { 
      header: 'Customer', 
      field: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            {row.avatar ? <img src={row.avatar} className="w-10 h-10 rounded-full object-cover" alt="avatar"/> : <User size={20} />}
          </div>
          <div>
            <div className="font-medium text-slate-800">{row.name}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Role', 
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${row.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
          {row.role === 'admin' ? <ShieldAlert size={12} /> : <Shield size={12} />}
          {row.role === 'admin' ? 'Admin' : 'User'}
        </span>
      ) 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <StatusBadge status={(row.is_active !== 0 && row.is_active !== false) ? 'Active' : 'Inactive'} />
      ) 
    },
    { header: 'Joined', field: 'created_at', sortable: true, render: (row) => <span className="text-slate-600">{new Date(row.createdAt || Date.now()).toLocaleDateString()}</span> },
    { 
      header: 'Actions', 
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => handleViewProducts(row)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="View Purchased Products"
          >
            <Package size={18} />
          </button>
          <button 
            onClick={() => handleActionClick('status', row)}
            className={`p-1.5 rounded-md transition-colors ${(row.is_active !== 0 && row.is_active !== false) ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
            title={(row.is_active !== 0 && row.is_active !== false) ? 'Deactivate User' : 'Activate User'}
          >
            <Power size={18} />
          </button>
          <button 
            onClick={() => handleActionClick('delete', row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete User"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ) 
    }
  ];

  const getConfirmMessage = () => {
    if (!targetUser) return '';
    if (actionType === 'role') {
      const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
      return `Are you sure you want to change ${targetUser.name}'s role to ${newRole.toUpperCase()}?`;
    } else if (actionType === 'delete') {
      return `Are you sure you want to completely remove ${targetUser.name}? This action cannot be undone.`;
    } else {
      const newStatus = (targetUser.is_active !== 0 && targetUser.is_active !== false) ? 'inactive' : 'active';
      return `Are you sure you want to mark ${targetUser.name} as ${newStatus.toUpperCase()}?`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-md border border-slate-300">
        <h2 className="text-lg font-semibold text-slate-800 hidden md:block">Customers</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name, email, phone..." 
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
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white w-full sm:w-40 text-sm outline-none"
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={users} 
        loading={loading} 
        page={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
        onSort={(field, order) => { setSortField(field); setSortOrder(order); setPage(1); }}
        sortField={sortField}
        sortOrder={sortOrder}
        keyField="_id"
      />

      {/* Confirm Action */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmAction}
        title={actionType === 'role' ? 'Change User Role' : actionType === 'delete' ? 'Delete User' : 'Toggle User Status'}
        message={getConfirmMessage()}
        confirmText={actionType === 'role' ? 'Confirm Role Change' : actionType === 'delete' ? 'Delete' : 'Confirm Status Change'}
        isDestructive={actionType === 'delete' || (actionType === 'status' && (targetUser?.is_active !== 0 && targetUser?.is_active !== false))}
      />

      {/* Products Modal */}
      {productsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">
                Purchased Products - <span className="text-indigo-600">{targetUser?.name}</span>
              </h3>
              <button 
                onClick={() => setProductsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {productsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : userProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package size={48} className="mx-auto text-slate-300 mb-4" />
                  <p>This customer hasn't purchased any products yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">{product.name}</h4>
                        <div className="text-sm text-slate-500 mt-1">
                          Last purchased: {new Date(product.last_purchased).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                        </div>
                        <div className="text-sm font-medium text-emerald-600 mt-1">
                          Quantity: {product.total_quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
