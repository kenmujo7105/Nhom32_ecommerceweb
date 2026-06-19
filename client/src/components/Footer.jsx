import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">AuraShop</h3>
            <p className="text-sm">Premium e-commerce experience delivered straight to your door. Shop the latest trends with confidence.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/products" className="hover:text-white transition-colors">Shop All</a></li>
              <li><a href="/cart" className="hover:text-white transition-colors">Your Cart</a></li>
              <li><a href="/profile" className="hover:text-white transition-colors">My Account</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>support@aurashop.com</li>
              <li>+1 (800) 123-4567</li>
              <li>123 Commerce St, Tech City</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} AuraShop. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
