# Cashfree Payment Integration - Complete Setup Guide

## Current Status: ✅ FULLY IMPLEMENTED

The Kavithedal Publications project already has a complete Cashfree payment integration. This document provides the setup checklist to get it working.

---

## 1. Backend Configuration (Django) ✅ Already Done

### Already Implemented:
- **Cashfree API Integration**: `backend/apps/orders/views.py`
  - `_cf_create_order()` - Creates Cashfree orders
  - `_cf_get_order()` - Fetches order status
  - `CreateOrderView` - Creates orders for physical/ebook
  - `EbookPurchaseView` - Dedicated ebook checkout
  - `CartCheckoutView` - Multi-item cart checkout
  - `CashfreeVerifyPaymentView` - Verifies payment after redirect
  - `CashfreeWebhookView` - Webhook handler with signature verification

- **Settings**: `backend/config/settings.py` (lines 354-363)
  ```python
  CASHFREE_APP_ID = os.environ.get('CASHFREE_APP_ID', '')
  CASHFREE_SECRET_KEY = os.environ.get('CASHFREE_SECRET_KEY', '')
  CASHFREE_ENV = os.environ.get('CASHFREE_ENV', 'sandbox')
  FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
  ```

- **CORS Configuration**: Already configured with:
  - `https://www.kavithedalpublication.store`
  - `https://kavithedalpublication.store`
  - `https://kavithedal-frontend-sgki.onrender.com`

- **ALLOWED_HOSTS**: Already configured with:
  - `kavithedal-backend.onrender.com` (or the Render hostname)
  - `www.kavithedalpublication.store`

### What You Need To Do (Backend):

1. **Set Cashfree Credentials in Render Dashboard**:
   - Go to: https://dashboard.render.com
   - Find your `kavithedal-web` service
   - Add these environment variables:
     - `CASHFREE_APP_ID` = Your Cashfree App ID (from https://merchant.cashfree.com)
     - `CASHFREE_SECRET_KEY` = Your Cashfree Secret Key
     - `CASHFREE_ENV` = `production` (or `sandbox` for testing)
     - `FRONTEND_URL` = `https://www.kavithedalpublication.store`

---

## 2. Frontend Configuration (React) ✅ Already Done

### Already Implemented:
- **Cashfree SDK**: Loaded in `frontend/index.html` (line 23)
  ```html
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js" defer></script>
  ```

- **Payment API**: `frontend/src/api/orders.js`
  - `initiateCashfreeCheckout()` - Opens Cashfree checkout
  - `verifyCashfreePayment()` - Verifies payment status
  - `createOrder()`, `createEbookPurchase()`, `createCartCheckout()`

- **Payment Pages**:
  - `frontend/src/pages/PurchaseSuccess.jsx` - Success page
  - `frontend/src/pages/PaymentFailure.jsx` - Failure page

- **Environment Variables**: `frontend/.env`
  ```
  VITE_API_URL=https://kavithedal-web.onrender.com
  VITE_CASHFREE_ENV=production
  ```

---

## 3. Cashfree Dashboard Configuration (Critical Step)

### You MUST configure these in Cashfree Dashboard:

1. **Go to**: https://merchant.cashfree.com

2. **API Keys** (for production):
   - Navigate to Developers → API Keys
   - Copy your App ID and Secret Key
   - Add them to Render dashboard

3. **Webhook Setup** (Critical for payment confirmation):
   - Navigate to Developers → Webhooks
   - Add new webhook:
     - **URL**: `https://kavithedal-web.onrender.com/api/payment/webhook/`
     - **Events**: 
       - `PAYMENT_SUCCESS_WEBHOOK`
       - `PAYMENT_FAILED_WEBHOOK`
   - Copy the Webhook Secret Key
   - Add to Render: `CASHFREE_WEBHOOK_SECRET` (if using custom verification)

4. **App Configuration**:
   - Ensure your Cashfree account is activated for production
   - If testing, use sandbox credentials and set `CASHFREE_ENV=sandbox`

---

## 4. Testing Checklist

### Pre-Production Testing:

1. **Test with Sandbox**:
   - Set `CASHFREE_ENV=sandbox` in Render
   - Use Cashfree sandbox test credentials
   - Test a small purchase

2. **Verify Flow**:
   - [ ] User clicks "Buy Now"
   - [ ] Backend creates Cashfree order
   - [ ] Cashfree checkout opens
   - [ ] Payment completes
   - [ ] Redirect to /payment-success
   - [ ] Verification via API
   - [ ] eBook added to library

3. **Test Failed Payment**:
   - [ ] Cancel payment mid-flow
   - [ ] Redirect to /payment-failure

---

## 5. Production Deployment Checklist

- [ ] Set `CASHFREE_ENV=production` in Render
- [ ] Add production Cashfree API keys
- [ ] Configure webhook in Cashfree dashboard
- [ ] Test with real payment (small amount)
- [ ] Verify eBook access after purchase
- [ ] Check database updated correctly

---

## 6. Common Issues & Solutions

### Issue: Payment Not Initiating
**Check**:
- Cashfree SDK is loaded in browser console: `window.Cashfree`
- API is returning `payment_session_id`
- Console shows no CORS errors

### Issue: CORS Errors
**Solution**:
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check backend logs for blocked origins

### Issue: Webhook Not Working
**Solution**:
- Verify webhook URL is publicly accessible
- Check Cashfree dashboard for webhook delivery logs
- Ensure signature verification passes (already implemented)

### Issue: Payment Success But No eBook Access
**Solution**:
- Check webhook was triggered
- Verify `UserLibrary` has entry
- Check payment verification returned success

---

## 7. Environment Variables Summary

### Backend (Render):
| Variable | Value |
|----------|-------|
| CASHFREE_APP_ID | (from Cashfree dashboard) |
| CASHFREE_SECRET_KEY | (from Cashfree dashboard) |
| CASHFREE_ENV | `production` or `sandbox` |
| FRONTEND_URL | `https://www.kavithedalpublication.store` |
| CORS_ALLOWED_ORIGINS | `https://www.kavithedalpublication.store,https://kavithedalpublication.store,https://kavithedal-frontend-sgki.onrender.com` |

### Frontend (Build Time):
| Variable | Value |
|----------|-------|
| VITE_API_URL | `https://kavithedal-web.onrender.com` |
| VITE_CASHFREE_ENV | `production` or `sandbox` |

---

## 8. Code Flow Diagram

```
User clicks "Buy Now"
    ↓
Frontend calls /api/orders/create-order/ (or ebook-purchase/)
    ↓
Backend creates Cashfree order via Cashfree API
    ↓
Backend returns payment_session_id
    ↓
Frontend: cashfree.checkout({ paymentSessionId, redirectTarget: '_self' })
    ↓
User completes payment on Cashfree
    ↓
Cashfree redirects to FRONTEND_URL/payment-success?order_id=xxx
    ↓
Frontend calls /api/orders/verify-cashfree-payment/
    ↓
Backend verifies with Cashfree API
    ↓
Backend marks order as paid, adds to UserLibrary
    ↓
User can now access eBook
```

---

## Need Help?

If payments are still failing after following this checklist:

1. Check browser console (F12) for errors
2. Check Render logs for backend errors
3. Check Cashfree dashboard for payment status
4. Verify all environment variables are set correctly

---

**Last Updated**: 2026-03-31
**Project**: Kavithedal Publications
**Integration**: Cashfree PG v2023-08-01
