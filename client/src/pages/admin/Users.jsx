import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldAlert, Power, User, Filter } from 'lucide-react';
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

  const confirmAction = async () => {
    if (!targetUser) return;
    try {
      if (actionType === 'role') {
        const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
        await api.patch(`/admin/users/${targetUser._id || targetUser.id}`, { role: newRole });
      } else if (actionType === 'status') {
        // Assume missing active field implies active
        const currentStatus = targetUser.is_active !== false; 
        await api.patch(`/admin/users/${targetUser._id || targetUser.id}`, { is_active: !currentStatus });
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
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${row.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {row.role === 'admin' ? <ShieldAlert size={12} /> : <Shield size={12} />}
          {row.role === 'admin' ? 'Admin' : 'User'}
        </span>
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
            onClick={() => handleActionClick('status', row)}
            className={`p-1.5 rounded-md transition-colors ${row.is_active !== false ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
            title={row.is_active !== false ? 'Deactivate User' : 'Activate User'}
          >
            <Power size={18} />
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
    } else {
      const newStatus = targetUser.is_active !== false ? 'inactive' : 'active';
      return `Are you sure you want to mark ${targetUser.name} as ${newStatus.toUpperCase()}?`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 hidden md:block">Customers</h2>
        
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
        title={actionType === 'role' ? 'Change User Role' : 'Toggle User Status'}
        message={getConfirmMessage()}
        confirmText={actionType === 'role' ? 'Confirm Role Change' : 'Confirm Status Change'}
        isDestructive={actionType === 'status' && targetUser?.is_active !== false}
      />
    </div>
  );
};

export default Users;
