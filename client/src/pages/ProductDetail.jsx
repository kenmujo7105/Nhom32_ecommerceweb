import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button onClick={() => navigate('/products')} className="text-primary hover:underline">Return to products</button>
      </div>
    );
  }

  const price = parseFloat(product.price);
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

  const handleAddToCart = () => {
    setAdding(true);
    addToCart(product, quantity);
    setTimeout(() => setAdding(false), 500);
  };

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-500 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={20} className="mr-2" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square relative">
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            {salePrice && (
              <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
                SALE
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              {salePrice ? (
                <>
                  <span className="text-3xl font-bold text-gray-900">${salePrice.toFixed(2)}</span>
                  <span className="text-xl text-gray-400 line-through">${price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">${price.toFixed(2)}</span>
              )}
            </div>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed whitespace-pre-line">
              {product.description || "No description available for this product."}
            </p>

            <div className="mb-8">
              <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            <div className="flex items-center gap-6 mb-8 border-t border-b border-gray-100 py-6">
              <div className="flex items-center border border-gray-300 rounded-full">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-3 text-gray-600 hover:text-primary transition-colors disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus size={20} />
                </button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="p-3 text-gray-600 hover:text-primary transition-colors disabled:opacity-50"
                  disabled={quantity >= product.stock}
                >
                  <Plus size={20} />
                </button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex justify-center items-center gap-2 py-4 rounded-full font-bold text-lg transition-all ${
                  adding 
                    ? 'bg-green-500 text-white' 
                    : product.stock === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-dark text-white shadow-lg hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                <ShoppingCart size={22} />
                {adding ? 'Added!' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
