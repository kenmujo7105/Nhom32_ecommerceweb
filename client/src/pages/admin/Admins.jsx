import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Edit, Trash2, Plus, Power } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Modal from '../../components/admin/Modal';

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Table state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', email: '', password: '', is_active: 1 });
  const [formError, setFormError] = useState('');

  // Action state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'status' or 'delete'
  const [targetAdmin, setTargetAdmin] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, [page, search, sortField, sortOrder]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { 
        params: { page, search, role: 'admin', sort_by: sortField, sort_order: sortOrder, limit: 10 } 
      });
      if (res.data && res.data.data) {
        setAdmins(res.data.data);
        setTotalPages(Math.ceil((res.data.pagination?.total || 0) / (res.data.pagination?.limit || 10)) || 1);
      }
    } catch (err) {
      console.error("Failed to fetch admins", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (admin = null) => {
    setFormError('');
    if (admin) {
      setIsEditMode(true);
      setFormData({ 
        id: admin._id || admin.id, 
        name: admin.name, 
        email: admin.email,
        password: '', // Don't populate password
        is_active: admin.is_active !== false ? 1 : 0
      });
    } else {
      setIsEditMode(false);
      setFormData({ id: null, name: '', email: '', password: '', is_active: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (isEditMode) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't send empty password
        await api.put(`/admin/admins/${formData.id}`, payload);
      } else {
        if (!formData.password) {
          setFormError('Password is required for new admin');
          return;
        }
        await api.post('/admin/admins', formData);
      }
      setIsModalOpen(false);
      fetchAdmins(); // Refresh
    } catch (err) {
      console.error("Failed to save admin", err);
      setFormError(err.response?.data?.message || "Failed to save admin.");
    }
  };

  const handleActionClick = (type, admin) => {
    setActionType(type);
    setTargetAdmin(admin);
    setIsConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (!targetAdmin) return;
    try {
      if (actionType === 'status') {
        const currentStatus = targetAdmin.is_active !== false; 
        await api.put(`/admin/admins/${targetAdmin._id || targetAdmin.id}`, { is_active: !currentStatus ? 1 : 0 });
      } else if (actionType === 'delete') {
        await api.delete(`/admin/users/${targetAdmin._id || targetAdmin.id}`);
      }
      fetchAdmins(); // Refresh
    } catch (err) {
      console.error(`Failed to update admin ${actionType}`, err);
      alert(err.response?.data?.message || `Failed to ${actionType} admin.`);
    }
  };

  const columns = [
    { 
      header: 'Admin Name', 
      field: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="font-medium text-slate-800">{row.name}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <StatusBadge status={row.is_active !== false ? 'Active' : 'Inactive'} />
      ) 
    },
    { header: 'Joined', field: 'created_at', sortable: true, render: (row) => <span className="text-slate-600">{new Date(row.createdAt || Date.now()).toLocaleDateString()}</span> },
    { 
      header: 'Actions', 
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => handleOpenModal(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => handleActionClick('status', row)}
            className={`p-1.5 rounded-md transition-colors ${row.is_active !== false ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
            title={row.is_active !== false ? 'Deactivate Admin' : 'Activate Admin'}
          >
            <Power size={16} />
          </button>
          <button 
            onClick={() => handleActionClick('delete', row)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-md border border-slate-300">
        <h2 className="text-lg font-semibold text-slate-800 hidden md:block">Staff / Admins</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 text-sm outline-none"
            />
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={18} /> Add Admin
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={admins} 
        loading={loading} 
        page={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
        onSort={(field, order) => { setSortField(field); setSortOrder(order); setPage(1); }}
        sortField={sortField}
        sortOrder={sortOrder}
        keyField="_id"
      />

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? 'Edit Admin' : 'Add New Admin'}
      >
        <form onSubmit={handleSaveAdmin} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {formError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input 
              type="password" 
              required={!isEditMode}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Save Admin
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Action */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmAction}
        title={actionType === 'delete' ? 'Delete Admin' : 'Toggle Admin Status'}
        message={
          actionType === 'delete' 
            ? `Are you sure you want to completely remove ${targetAdmin?.name}? This action cannot be undone.` 
            : `Are you sure you want to mark ${targetAdmin?.name} as ${targetAdmin?.is_active !== false ? 'INACTIVE' : 'ACTIVE'}?`
        }
        confirmText={actionType === 'delete' ? 'Delete' : 'Confirm'}
        isDestructive={actionType === 'delete' || targetAdmin?.is_active !== false}
      />
    </div>
  );
};

export default Admins;
