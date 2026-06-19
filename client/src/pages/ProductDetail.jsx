import { formatCurrency } from '../utils/formatters';
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.data);
          const imgUrl = res.data.data.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
          setMainImage(imgUrl);
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
  
  let parsedGallery = [];
  try {
    if (typeof product.gallery_images === 'string') {
      parsedGallery = JSON.parse(product.gallery_images);
    } else if (Array.isArray(product.gallery_images)) {
      parsedGallery = product.gallery_images;
    }
  } catch (e) {
    console.error("Failed to parse gallery images");
  }

  const galleryImages = parsedGallery.length > 0 ? parsedGallery : [imageUrl];

  const handleNextImage = () => {
    const currentIndex = galleryImages.indexOf(mainImage);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setMainImage(galleryImages[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = galleryImages.indexOf(mainImage);
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setMainImage(galleryImages[prevIndex]);
  };

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
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square relative group">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover transition-opacity duration-300" />
              {salePrice && (
                <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
                  SALE
                </div>
              )}
              {galleryImages.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevImage} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={handleNextImage} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {galleryImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                      mainImage === img ? 'border-primary scale-105' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              {salePrice ? (
                <>
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(salePrice)}</span>
                  <span className="text-xl text-gray-400 line-through">{formatCurrency(price)}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">{formatCurrency(price)}</span>
              )}
            </div>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed line-clamp-3">
              {product.description || "Premium product with exceptional build quality. Click below to read more details."}
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

        {/* Detailed Product Description Section */}
        <div className="mt-20">
          <div className="border-b border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 pb-4 inline-block border-b-2 border-primary">
              Product Description
            </h2>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm leading-relaxed text-gray-700 text-lg">
            <p className="whitespace-pre-line mb-6">
              {product.description || "Discover the perfect blend of innovation and style with this premium product. Designed with meticulous attention to detail, it offers unparalleled performance and durability. Whether you're upgrading your lifestyle or looking for a reliable companion, this product exceeds expectations on every front."}
            </p>
            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>High-quality premium materials</li>
                  <li>Sleek, modern, and ergonomic design</li>
                  <li>Built for durability and long-term use</li>
                  <li>100% authentic and factory tested</li>
                  <li>Includes 1-year standard warranty</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Specifications</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-medium text-gray-900">AuraShop Exclusive</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-900">{product.category_id ? 'Categorized' : 'General'}</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Stock Status</span>
                    <span className="font-medium text-gray-900">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium text-gray-900">2-4 Business Days</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
