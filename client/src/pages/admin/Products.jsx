import { formatCurrency } from '../../utils/formatters';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Table state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', price: '', category_id: '', image: '', description: '', stock: '' });

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, search, categoryFilter, sortField, sortOrder]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Pass params for pagination/search
      const res = await api.get('/products', { 
        params: { page, search, category: categoryFilter, sort_by: sortField, sort_order: sortOrder, limit: 10 } 
      });
      if (res.data && res.data.data) {
        // Handle standard pagination response structure
        setProducts(res.data.data);
        setTotalPages(Math.ceil((res.data.pagination?.total || 0) / (res.data.pagination?.limit || 10)) || 1);
      } else if (Array.isArray(res.data)) {
        // Handle simple array response
        let filtered = [...res.data];
        if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);
        setProducts(filtered);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
      // Fallback categories
      setCategories([{ _id: '1', name: 'Electronics' }, { _id: '2', name: 'Clothing' }]);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setIsEditMode(true);
      setFormData({ 
        id: product._id || product.id, 
        name: product.name, 
        price: product.price, 
        category_id: product.category_id || '', 
        image: product.image || product.imageUrl || '', 
        description: product.description || '',
        stock: product.stock || 0
      });
    } else {
      setIsEditMode(false);
      setFormData({ id: null, name: '', price: '', category_id: '', image: '', description: '', stock: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/products/${formData.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsModalOpen(false);
      fetchProducts(); // Refresh
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Failed to save product.");
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete._id || productToDelete.id}`);
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Failed to delete product.");
    }
  };

  const columns = [
    { 
      header: 'Product', 
      field: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img 
            src={row.image || row.imageUrl || 'https://via.placeholder.com/40'} 
            alt={row.name} 
            className="w-10 h-10 rounded-md object-cover border border-slate-200"
          />
          <div>
            <div className="font-medium text-slate-800">{row.name}</div>
            <div className="text-xs text-slate-500 truncate max-w-[200px]">{row.description}</div>
          </div>
        </div>
      ) 
    },
    { header: 'Category', field: 'category' },
    { header: 'Price', field: 'price', sortable: true, render: (row) => <span className="font-medium">{formatCurrency(Number(row.price))}</span> },
    { header: 'Stock', field: 'stock', sortable: true, render: (row) => (
      <span className={`px-2 py-1 text-xs rounded-md ${row.stock > 10 ? 'bg-emerald-100 text-emerald-700' : row.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
        {row.stock || 0} in stock
      </span>
    )},
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
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 text-sm outline-none"
            />
          </div>
          
          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white w-full sm:w-48 text-sm outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={products} 
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
        title={isEditMode ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
              <input 
                type="number" 
                required
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select 
              required
              value={formData.category_id}
              onChange={e => setFormData({...formData, category_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="" disabled>Select category</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input 
              type="url" 
              value={formData.image}
              onChange={e => setFormData({...formData, image: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <div className="mt-2">
                <img src={formData.image} alt="Preview" className="h-20 rounded-md border border-slate-200 object-cover" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              rows="3"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            ></textarea>
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
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default Products;
