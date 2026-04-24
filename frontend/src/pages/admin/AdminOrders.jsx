import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import { useTranslation } from "../../context/LanguageContext";
import "../../styles/admin.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AdminOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = "/api/orders/orders/";
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (deliveryFilter) params.append("delivery_status", deliveryFilter);
      if (params.toString()) url += "?" + params.toString();
      
      const res = await api.get(url);
      const data = res.data.results || res.data;
      setOrders(data);
      
      // Calculate stats
      const allOrders = res.data.results || res.data;
      setStats({
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'pending').length,
        processing: allOrders.filter(o => o.status === 'processing').length,
        shipped: allOrders.filter(o => o.delivery_status === 'shipped').length,
        delivered: allOrders.filter(o => o.delivery_status === 'delivered').length
      });
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, deliveryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const updateOrderStatus = async (orderId, newStatus, newDeliveryStatus = null) => {
    setUpdating(true);
    try {
      const updateData = { status: newStatus };
      if (newDeliveryStatus) {
        updateData.delivery_status = newDeliveryStatus;
      }
      await api.patch(`/api/orders/orders/${orderId}/`, updateData);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to update order:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#FFA000",
      processing: "#1976D2",
      completed: "#388E3C",
      cancelled: "#D32F2F",
      refunded: "#7B1FA2"
    };
    return colors[status] || "#757575";
  };

  const getDeliveryColor = (status) => {
    const colors = {
      pending: "#FFA000",
      packed: "#1976D2",
      shipped: "#7B1FA2",
      delivered: "#388E3C"
    };
    return colors[status] || "#757575";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>{t("orders", "title") || "Orders"}</h1>
          <p>{t("orders", "manageAllOrders") || "Manage all book orders"}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="stat-card-admin" style={{ background: "#E3F2FD", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#1565C0" }}>{stats.total}</h3>
          <p style={{ margin: "4px 0 0", color: "#1565C0", fontSize: "14px" }}>Total Orders</p>
        </div>
        <div className="stat-card-admin" style={{ background: "#FFF3E0", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#E65100" }}>{stats.pending}</h3>
          <p style={{ margin: "4px 0 0", color: "#E65100", fontSize: "14px" }}>Pending</p>
        </div>
        <div className="stat-card-admin" style={{ background: "#E8F5E9", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#2E7D32" }}>{stats.processing}</h3>
          <p style={{ margin: "4px 0 0", color: "#2E7D32", fontSize: "14px" }}>Processing</p>
        </div>
        <div className="stat-card-admin" style={{ background: "#F3E5F5", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#7B1FA2" }}>{stats.shipped}</h3>
          <p style={{ margin: "4px 0 0", color: "#7B1FA2", fontSize: "14px" }}>Shipped</p>
        </div>
        <div className="stat-card-admin" style={{ background: "#E0F2F1", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#00695C" }}>{stats.delivered}</h3>
          <p style={{ margin: "4px 0 0", color: "#00695C", fontSize: "14px" }}>Delivered</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-toolbar">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", flex: 1, flexWrap: "wrap" }}>
            <input
              className="admin-search"
              placeholder="Search by order ID or book title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: "200px" }}
            />
            <select
              className="admin-search"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "150px" }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="admin-search"
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              style={{ width: "150px" }}
            >
              <option value="">All Delivery</option>
              <option value="pending">Pending</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
            <button className="admin-btn admin-btn-secondary" type="submit">
              {t("common", "search") || "Search"}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="admin-empty"><div className="admin-spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="admin-empty"><p>No orders found</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Book</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                      {order.id.slice(0, 8)}...
                    </td>
                    <td>
                      <div style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {order.book_title}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px" }}>
                        <div>{order.full_name}</div>
                        <div style={{ color: "#666", fontSize: "11px" }}>{order.shipping_pincode}</div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge" style={{ 
                        background: order.order_type === 'ebook' ? '#E3F2FD' : '#FFF3E0',
                        color: order.order_type === 'ebook' ? '#1565C0' : '#E65100'
                      }}>
                        {order.order_type === 'ebook' ? 'eBook' : 'Physical'}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600" }}>₹{order.total_price}</td>
                    <td>
                      <span className="admin-badge" style={{ backgroundColor: getStatusColor(order.status), color: "white" }}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.order_type === 'physical' && (
                        <span className="admin-badge" style={{ backgroundColor: getDeliveryColor(order.delivery_status), color: "white" }}>
                          {order.delivery_status}
                        </span>
                      )}
                      {order.order_type === 'ebook' && (
                        <span style={{ color: "#999", fontSize: "12px" }}>N/A</span>
                      )}
                    </td>
                    <td style={{ fontSize: "12px" }}>{formatDate(order.ordered_at)}</td>
                    <td>
                      <button 
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Order Details</h3>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <h4 style={{ marginBottom: "8px", color: "#333" }}>Order Information</h4>
                  <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                  <p><strong>Book:</strong> {selectedOrder.book_title}</p>
                  <p><strong>Type:</strong> {selectedOrder.order_type === 'ebook' ? 'eBook' : 'Physical Book'}</p>
                  <p><strong>Price:</strong> ₹{selectedOrder.book_price}</p>
                  {selectedOrder.order_type === 'physical' && (
                    <p><strong>Delivery:</strong> ₹{selectedOrder.delivery_charge}</p>
                  )}
                  <p><strong>Total:</strong> ₹{selectedOrder.total_price}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.ordered_at)}</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: "8px", color: "#333" }}>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.full_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                  {selectedOrder.order_type === 'physical' && (
                    <>
                      <p><strong>Address:</strong></p>
                      <p style={{ marginLeft: "8px", fontSize: "13px", color: "#666" }}>
                        {selectedOrder.shipping_address}<br />
                        {selectedOrder.shipping_city}, {selectedOrder.shipping_state}<br />
                        PIN: {selectedOrder.shipping_pincode}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {selectedOrder.order_type === 'physical' && (
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ marginBottom: "12px", color: "#333" }}>Update Order Status</h4>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      className="admin-btn admin-btn-sm"
                      style={{ background: selectedOrder.status === 'pending' ? '#FFA000' : '#f5f5f5',
                        color: selectedOrder.status === 'pending' ? 'white' : '#333',
                        border: "1px solid #ddd" }}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'pending', 'pending')}
                      disabled={updating}
                    >
                      Pending
                    </button>
                    <button
                      className="admin-btn admin-btn-sm"
                      style={{ background: selectedOrder.status === 'processing' ? '#1976D2' : '#f5f5f5',
                        color: selectedOrder.status === 'processing' ? 'white' : '#333',
                        border: "1px solid #ddd" }}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'processing', 'packed')}
                      disabled={updating}
                    >
                      Packed
                    </button>
                    <button
                      className="admin-btn admin-btn-sm"
                      style={{ background: selectedOrder.delivery_status === 'shipped' ? '#7B1FA2' : '#f5f5f5',
                        color: selectedOrder.delivery_status === 'shipped' ? 'white' : '#333',
                        border: "1px solid #ddd" }}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'processing', 'shipped')}
                      disabled={updating}
                    >
                      Shipped
                    </button>
                    <button
                      className="admin-btn admin-btn-sm"
                      style={{ background: selectedOrder.delivery_status === 'delivered' ? '#388E3C' : '#f5f5f5',
                        color: selectedOrder.delivery_status === 'delivered' ? 'white' : '#333',
                        border: "1px solid #ddd" }}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed', 'delivered')}
                      disabled={updating}
                    >
                      Delivered
                    </button>
                    <button
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled', 'pending')}
                      disabled={updating}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.order_type === 'ebook' && (
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ marginBottom: "12px", color: "#333" }}>Update Order Status</h4>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      className="admin-btn admin-btn-sm"
                      style={{ background: selectedOrder.status === 'pending' ? '#FFA000' : '#f5f5f5',
                        color: selectedOrder.status === 'pending' ? 'white' : '#333',
                        border: "1px solid #ddd" }}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'pending')}
                      disabled={updating}
                    >
                      Pending
                    </button>
                    <button
                      className="admin-btn admin-btn-sm"
                      style={{ background: selectedOrder.status === 'completed' ? '#388E3C' : '#f5f5f5',
                        color: selectedOrder.status === 'completed' ? 'white' : '#333',
                        border: "1px solid #ddd" }}
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      disabled={updating}
                    >
                      Completed
                    </button>
                    <button
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      disabled={updating}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
