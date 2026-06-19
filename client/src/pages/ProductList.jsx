import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import { Loader2 } from 'lucide-react';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
  
  const [filters, setFilters] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    category_id: searchParams.get('category_id') || '',
    search: searchParams.get('search') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: searchParams.get('sort_order') || 'DESC'
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page > 1) params.set('page', filters.page);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.search) params.set('search', filters.search);
    if (filters.min_price) params.set('min_price', filters.min_price);
    if (filters.max_price) params.set('max_price', filters.max_price);
    if (filters.sort_by !== 'created_at') params.set('sort_by', filters.sort_by);
    if (filters.sort_order !== 'DESC') params.set('sort_order', filters.sort_order);
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: filters.page,
          limit: 12,
          ...(filters.category_id && { category_id: filters.category_id }),
          ...(filters.search && { search: filters.search }),
          ...(filters.min_price && { min_price: filters.min_price }),
          ...(filters.max_price && { max_price: filters.max_price }),
          sort_by: filters.sort_by,
          sort_order: filters.sort_order
        }).toString();

        const res = await api.get(`/products?${query}`);
        if (res.data.success) {
          setProducts(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters]);

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-600">Showing {products.length} of {pagination.total} results</p>
        </div>

        <FilterBar filters={filters} setFilters={setFilters} />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex justify-between mt-auto pt-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
            <button 
              onClick={() => setFilters({ page: 1, category_id: '', search: '', min_price: '', max_price: '', sort_by: 'created_at', sort_order: 'DESC' })}
              className="mt-6 text-primary font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <Pagination 
              currentPage={filters.page} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProductList;
