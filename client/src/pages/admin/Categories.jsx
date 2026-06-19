import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const Categories = () => {
  const [categories, setCategories] = useState([]);
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
  const [formData, setFormData] = useState({ id: null, name: '' });

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [page, search, sortField, sortOrder]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories', {
        params: { page, search, sort_by: sortField, sort_order: sortOrder, limit: 10 }
      });
      if (res.data && res.data.data) {
        setCategories(res.data.data);
        setTotalPages(Math.ceil((res.data.pagination?.total || 0) / (res.data.pagination?.limit || 10)) || 1);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setIsEditMode(true);
      setFormData({ 
        id: category._id || category.id, 
        name: category.name
      });
    } else {
      setIsEditMode(false);
      setFormData({ id: null, name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/categories/${formData.id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setIsModalOpen(false);
      fetchCategories(); // Refresh
    } catch (err) {
      console.error("Failed to save category", err);
      alert("Failed to save category.");
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.delete(`/categories/${categoryToDelete._id || categoryToDelete.id}`);
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category", err);
      alert("Failed to delete category.");
    }
  };

  const columns = [
    { header: 'Category Name', field: 'name', sortable: true, className: 'font-medium text-slate-900' },
    { 
      header: 'Tổng tồn kho', 
      field: 'total_stock', 
      sortable: true,
      className: 'text-slate-500',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          {row.total_stock || 0}
        </span>
      )
    },
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
            onClick={() => handleDeleteClick(row)}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 hidden md:block">Categories</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 text-sm outline-none"
            />
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={categories} 
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
        title={isEditMode ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        confirmText="Delete"
      />
    </div>
  );
};

export default Categories;
