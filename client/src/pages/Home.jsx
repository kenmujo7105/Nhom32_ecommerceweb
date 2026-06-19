import { formatCurrency } from '../utils/formatters';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products?limit=4&sort_by=created_at&sort_order=DESC'),
          api.get('/categories')
        ]);
        
        if (productsRes.data.success) setFeaturedProducts(productsRes.data.data);
        if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      } catch (error) {
        console.error("Failed to fetch home data", error);
      }
    };
    fetchInitialData();
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
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await api.get(`/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
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
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 flex flex-col items-center text-center">
          <span className="text-primary font-bold tracking-wider uppercase mb-4 drop-shadow-md">New Collection 2026</span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
            Discover Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Aura</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-300 max-w-3xl mb-10 drop-shadow">
            Experience premium quality with our curated selection of top-tier products designed to elevate your lifestyle.
          </p>

          <form ref={searchRef} onSubmit={handleSearch} className="relative w-full max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-full flex items-center mb-8 border border-white/20 shadow-2xl z-50">
            <input 
              type="text" 
              placeholder="Search for products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.trim().length > 1) setShowDropdown(true); }}
              className="flex-1 bg-transparent border-none px-6 py-3 text-white placeholder-gray-300 focus:outline-none text-lg"
            />
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-bold transition-colors">
              Search
            </button>

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
          </form>

          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium hover:underline transition-all duration-300"
          >
            <ShoppingBag size={20} />
            Or browse all products
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight size={18} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category, idx) => (
              <Link 
                key={category.id} 
                to={`/products?category_id=${category.id}`}
                className={`relative rounded-2xl overflow-hidden group aspect-[4/5] bg-gray-100 ${idx % 2 === 0 ? 'mt-0' : 'md:mt-8'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                <img 
                  src={
                    category.slug === 'dien-thoai' ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80' :
                    category.slug === 'laptop' ? 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80' :
                    category.slug === 'am-thanh' ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' :
                    category.slug === 'phu-kien' ? 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80' :
                    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80'
                  }
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-6 left-6 z-20">
                  <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                  <span className="text-white/80 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending Now</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Handpicked favorites that our customers are loving right now.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
