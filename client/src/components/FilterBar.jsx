import { formatCurrency } from '../utils/formatters';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const FilterBar = ({ filters, setFilters }) => {
  const [categories, setCategories] = useState([]);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [minPrice, setMinPrice] = useState(filters.min_price || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price || '');
  
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (localSearch.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await api.get(`/products?search=${encodeURIComponent(localSearch)}&limit=5`);
          if (res.data.success) {
            setSuggestions(res.data.data);
            setShowDropdown(true);
          }
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: localSearch, min_price: minPrice, max_price: maxPrice, page: 1 }));
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
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div ref={searchRef} className="relative w-full md:w-96 z-50">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onFocus={() => { if (localSearch.trim().length > 1) setShowDropdown(true); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all relative z-10"
            />
            <Search className="absolute left-3 top-3 text-gray-400 z-20" size={18} />
            
            {/* Dropdown Suggestions */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 z-50">
                {isSearching ? (
                  <div className="p-4 text-gray-500 text-center text-sm font-medium">Searching...</div>
                ) : suggestions.length > 0 ? (
                  <ul className="max-h-80 overflow-y-auto">
                    {suggestions.map(product => (
                      <li key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <Link 
                          to={`/products/${product.id}`} 
                          className="flex items-center gap-4 p-4"
                          onClick={() => setShowDropdown(false)}
                        >
                          <img 
                            src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded-lg" 
                          />
                          <div className="flex-1 text-left">
                            <h4 className="text-gray-900 font-semibold truncate text-base">{product.name}</h4>
                            <div className="flex items-center gap-2 text-sm mt-1">
                              {product.sale_price ? (
                                <>
                                  <span className="text-primary font-bold">{formatCurrency(parseFloat(product.sale_price))}</span>
                                  <span className="text-gray-400 line-through">{formatCurrency(parseFloat(product.price))}</span>
                                </>
                              ) : (
                                <span className="text-primary font-bold">{formatCurrency(parseFloat(product.price))}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-gray-500 text-center text-sm font-medium">No products found</div>
                )}
              </div>
            )}
          </div>

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

        {/* Price Range */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="number" 
              placeholder="Min Price ($)" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full sm:w-32 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              min="0"
            />
            <span className="text-gray-500">-</span>
            <input 
              type="number" 
              placeholder="Max Price ($)" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full sm:w-32 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              min="0"
            />
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterBar;
