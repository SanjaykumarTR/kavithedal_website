import api from './axios';

// Create order with simulated purchase (default)
export const createOrder = async (bookId, orderType, shippingData = {}) => {
  const response = await api.post('/api/orders/create-order/', {
    book_id: bookId,
    order_type: orderType,
    simulate: true,  // Enable simulated purchase
    ...shippingData
  });
  return response.data;
};

// Verify payment (simulated - kept for backward compatibility)
export const verifyPayment = async (orderId, razorpayPaymentId = null, razorpaySignature = null) => {
  const response = await api.post('/api/orders/verify-payment/', {
    order_id: orderId,
    razorpay_payment_id: razorpayPaymentId || `simulated_${orderId}`,
    razorpay_signature: razorpaySignature || `simulated_signature_${orderId}`,
    simulate: true
  });
  return response.data;
};

// Get user's library
export const getUserLibrary = async () => {
  const response = await api.get('/api/orders/library/');
  return response.data;
};

// Check if user has access to a book
export const checkBookAccess = async (bookId) => {
  const response = await api.get(`/api/books/${bookId}/check-access/`);
  return response.data;
};

// Get user's orders
export const getUserOrders = async () => {
  const response = await api.get('/api/orders/orders/');
  return response.data;
};

// Get secure PDF URL
export const getSecurePdfUrl = (bookId) => {
  return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/books/${bookId}/pdf/`;
};
