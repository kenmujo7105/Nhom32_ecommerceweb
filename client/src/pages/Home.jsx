import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

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
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-lg font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30"
          >
            <ShoppingBag size={20} />
            Shop Now
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
                  src={`https://images.unsplash.com/photo-${1500000000000 + idx * 100000}?w=500&q=80`} // placeholder images
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
