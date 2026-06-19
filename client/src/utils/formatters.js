export const formatCurrency = (amount) => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) return '0đ';
  return parsedAmount.toLocaleString('vi-VN') + 'đ';
};
