import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table } from 'react-bootstrap';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChefOrders = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status badge colors
  const statusColors = {
    pending: 'warning',
    preparing: 'primary',
    ready: 'success',
    delivered: 'secondary'
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('status', 'in', ['pending', 'preparing']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString() || 'N/A'
      }));
      
      setOrders(ordersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        [`${newStatus}At`]: new Date(),
        [`${newStatus}By`]: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        }
      });
      
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Check user authorization
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'chef')) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
    // Set up real-time updates (you might want to use onSnapshot instead)
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Container className="py-5"><div>Loading...</div></Container>;
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Kitchen Orders</h1>
      
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3 className="mb-0">Active Orders</h3>
            </Card.Header>
            <Card.Body>
              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Table</th>
                    <th>Items</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Modifications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.invoiceNumber}</td>
                      <td>Table {order.tableId}</td>
                      <td>
                        <ul className="list-unstyled mb-0">
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              {item.quantity}x {item.name}
                              {item.notes && <small className="text-muted d-block">Note: {item.notes}</small>}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>{order.createdAt}</td>
                      <td>
                        <Badge bg={statusColors[order.status]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        {order.modifications && order.modifications.length > 0 ? (
                          <ul className="list-unstyled mb-0">
                            {order.modifications.map((mod, idx) => (
                              <li key={idx} className="text-danger">
                                {mod.type}: {mod.reason}
                                <small className="d-block">
                                  by {mod.user.name} at {new Date(mod.timestamp?.seconds * 1000).toLocaleString()}
                                </small>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted">No modifications</span>
                        )}
                      </td>
                      <td>
                        {order.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            Mark Ready
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChefOrders; 