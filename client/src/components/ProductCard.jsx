import { formatCurrency } from '../utils/formatters';
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const ProductCard = ({ product }) => {
  const price = parseFloat(product.price);
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'; // fallback placeholder

  return (
    <Link to={`/products/${product.id}`} className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {salePrice && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            SALE
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {salePrice ? (
              <>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(salePrice)}</span>
                <span className="text-sm text-gray-400 line-through">{formatCurrency(price)}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-gray-900">{formatCurrency(price)}</span>
            )}
          </div>
          <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <ShoppingBag size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
