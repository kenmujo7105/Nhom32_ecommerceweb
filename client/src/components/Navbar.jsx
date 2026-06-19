import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { getCartCount } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-dark tracking-tight">
              Aura<span className="text-primary">Shop</span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/products" className="text-gray-600 hover:text-primary transition-colors font-medium">
              Products
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
                  <User size={20} />
                  <span className="hidden md:inline font-medium">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-gray-600 hover:text-primary font-medium transition-colors flex items-center gap-1">
                <User size={20} />
                <span className="hidden md:inline">Login</span>
              </Link>
            )}

            <Link to="/cart" className="relative text-gray-600 hover:text-primary transition-colors group">
              <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
