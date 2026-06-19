import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../api/axios';

const FilterBar = ({ filters, setFilters }) => {
  const [categories, setCategories] = useState([]);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: localSearch, page: 1 }));
  };

  const handleCategoryChange = (e) => {
    setFilters(prev => ({ ...prev, category_id: e.target.value, page: 1 }));
  };

  const handleSortChange = (e) => {
    const [sort_by, sort_order] = e.target.value.split('-');
    setFilters(prev => ({ ...prev, sort_by, sort_order, page: 1 }));
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        </form>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Categories */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-gray-400" size={16} />
            <select 
              value={filters.category_id || ''}
              onChange={handleCategoryChange}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select 
            value={`${filters.sort_by || 'created_at'}-${filters.sort_order || 'DESC'}`}
            onChange={handleSortChange}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white min-w-[160px]"
          >
            <option value="created_at-DESC">Newest Arrivals</option>
            <option value="price-ASC">Price: Low to High</option>
            <option value="price-DESC">Price: High to Low</option>
            <option value="name-ASC">Name: A to Z</option>
          </select>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;
