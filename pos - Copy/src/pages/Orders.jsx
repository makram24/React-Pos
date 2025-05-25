import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Tab, Tabs, Button, Modal } from 'react-bootstrap';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaCheck } from 'react-icons/fa';

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { currentUser } = useAuth();

  // Function to get today's date at midnight
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Function to get current date
  const getTodayEnd = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };
  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date bounds
      const todayStart = getTodayStart();
      const todayEnd = getTodayEnd();

      // Create query to get today's orders
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('createdAt', '>=', Timestamp.fromDate(todayStart)),
        where('createdAt', '<=', Timestamp.fromDate(todayEnd)),
        orderBy('createdAt', 'desc')
      );
      console.log(orders);

      // Execute query
      const querySnapshot = await getDocs(q);
      
      // Process results
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate() || null
      }));

      setOrders(fetchedOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    console.log(currentUser);
  }, []);

  // Function to mark an order as completed
  const markAsCompleted = async (order) => {
    if (!currentUser) {
      setError("You must be logged in to perform this action");
      return;
    }

    try {
      setUpdateLoading(true);
      setError(null);

      // Reference to the order document
      const orderRef = doc(db, 'orders', order.id);

      // Update data
      const updateData = {
        status: 'completed',
        completedAt: Timestamp.now(),
        completedBy: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role,
        }
      };

      // Update the document
      await updateDoc(orderRef, updateData);

      // Show success message
      setSuccessMessage(`Order #${order.id} marked as completed successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh orders
      await fetchOrders();
      
      // Close modal if open
      setShowConfirmModal(false);
      setSelectedOrder(null);
      setUpdateLoading(false);
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order status. Please try again.");
      setUpdateLoading(false);
    }
  };

  // Handle confirm dialog open
  const handleConfirmComplete = (order) => {
    setSelectedOrder(order);
    setShowConfirmModal(true);
  };

  // Filter orders by status - update to be case-insensitive and trim whitespace
  const doneOrders = orders.filter(order => 
    order.status && 
    order.status.toString().toLowerCase().trim() === 'completed'
  );

  const readyOrders = orders.filter(order => 
    order.status && 
    order.status.toString().toLowerCase().trim() === 'ready'
  );

  const preparingOrders = orders.filter(order => 
    order.status && 
    (order.status.toString().toLowerCase().trim() === 'preparing' || 
     order.status.toString().toLowerCase().trim() === 'pending')
  );

  // Add debugging to check what status values actually exist
  useEffect(() => {
    if (orders.length > 0) {
      // Log the orders and their status values
      console.log('All orders:', orders);
      
      // Count orders by status
      const statusCounts = {};
      orders.forEach(order => {
        const status = order.status ? order.status.toString().toLowerCase().trim() : 'undefined';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('Order status counts:', statusCounts);
    }
  }, [orders]);

  // Format time
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return '$0.00';
    return `$${Number(price).toFixed(2)}`;
  };

  // Render order card
  const renderOrderCard = (order) => {
    const isReady = order.status && order.status.toString().toLowerCase().trim() === 'ready';
    const isCompleted = order.status && order.status.toString().toLowerCase().trim() === 'completed';

    return (
      <Card key={order.id} className="mb-3 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Order #{order.id}</strong>
            <span className="ms-2 text-muted">
              {formatTime(order.createdAt)}
            </span>
          </div>
          <div className="d-flex align-items-center">
            <Badge 
              bg={
                isCompleted 
                  ? 'success' 
                  : isReady
                    ? 'warning' 
                    : 'info'
              }
              className="me-2"
            >
              {order.status}
            </Badge>
            
            {isReady && (
              <Button 
                variant="success" 
                size="sm"
                onClick={() => handleConfirmComplete(order)}
                disabled={updateLoading}
                className="d-flex align-items-center"
              >
                <FaCheck className="me-1" /> Mark Completed
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-2">
            <Col xs={8}>
              <strong>Items:</strong>
              <ul className="ps-3 mb-0">
                {order.items && order.items.map((item, idx) => (
                  <li key={idx}>{item.name} x{item.quantity}</li>
                ))}
              </ul>
            </Col>
            <Col xs={4} className="text-end">
              <div>
                <strong>Table:</strong> {order.tableName || order.tableNumber || order.tableid || 'N/A'}
              </div>
              <div>
                <strong>Type:</strong> {order.type || 'Dine-in'}
              </div>
              {/* <div className="mt-2">
                <strong>Total:</strong> {formatPrice(order.total)}
              </div> */}
            </Col>
          </Row>
          
          <div className="text-muted small">
            {order.serverName && (
              <div>Server: {order.serverName}</div>
            )}
            
            {isCompleted && order.completedAt && (
              <div>
                Completed at: {formatTime(order.completedAt)}
                {order.completedBy && ` by ${order.completedBy.name}`}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading orders...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Today's Orders</h1>
      
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      
      <Tabs defaultActiveKey="preparing" className="mb-4">
        <Tab 
          eventKey="preparing" 
          title={`Preparing (${preparingOrders.length})`}
          className="pt-3"
        >
          {preparingOrders.length === 0 ? (
            <Alert variant="info">No orders being prepared at the moment.</Alert>
          ) : (
            preparingOrders.map(order => renderOrderCard(order))
          )}
        </Tab>
        
        <Tab 
          eventKey="ready" 
          title={`Ready (${readyOrders.length})`}
          className="pt-3"
        >
          {readyOrders.length === 0 ? (
            <Alert variant="info">No orders ready for service.</Alert>
          ) : (
            readyOrders.map(order => renderOrderCard(order))
          )}
        </Tab>
        
        <Tab 
          eventKey="completed" 
          title={`Completed (${doneOrders.length})`}
          className="pt-3"
        >
          {doneOrders.length === 0 ? (
            <Alert variant="info">No completed orders today.</Alert>
          ) : (
            doneOrders.map(order => renderOrderCard(order))
          )}
        </Tab>
      </Tabs>
      
      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to mark order #{selectedOrder?.id} as completed?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={() => markAsCompleted(selectedOrder)}
            disabled={updateLoading}
          >
            {updateLoading ? 
              <><Spinner animation="border" size="sm" /> Processing...</> : 
              'Yes, Mark as Completed'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Orders;