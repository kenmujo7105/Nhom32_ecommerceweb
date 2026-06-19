const fs = require('fs');
const path = require('path');

const utilsDir = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir);
}

const formatterCode = `export const formatCurrency = (amount) => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) return '0đ';
  return parsedAmount.toLocaleString('vi-VN') + 'đ';
};
`;

fs.writeFileSync(path.join(utilsDir, 'formatters.js'), formatterCode);

const filesToUpdate = [
  'pages/Profile.jsx',
  'pages/ProductDetail.jsx',
  'pages/Home.jsx',
  'pages/Checkout.jsx',
  'pages/Cart.jsx',
  'pages/admin/Products.jsx',
  'pages/admin/Orders.jsx',
  'pages/admin/Dashboard.jsx',
  'components/ProductCard.jsx',
  'components/FilterBar.jsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if not present
  if (!content.includes('formatCurrency')) {
    // figure out relative path
    const depth = file.split('/').length - 1;
    let importPath = depth === 1 ? '../utils/formatters' : (depth === 2 ? '../../utils/formatters' : './utils/formatters');
    content = `import { formatCurrency } from '${importPath}';\n` + content;
  }

  // Regex for >$xxx.toFixed(2)<
  content = content.replace(/>\$\{([^}]+)\.toFixed\(2\)\}</g, '>{formatCurrency($1)}<');
  content = content.replace(/>\$([a-zA-Z0-9_.()]+)\.toFixed\(2\)</g, '>{formatCurrency($1)}<');
  
  // For Checkout.jsx: `Pay $${getCartTotal().toFixed(2)}` -> `Pay ${formatCurrency(getCartTotal())}`
  content = content.replace(/Pay \$\$\{([^}]+)\.toFixed\(2\)\}/g, 'Pay ${formatCurrency($1)}');

  fs.writeFileSync(filePath, content);
});

console.log('Currency replacements done.');
