import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Badge, Button, Table, Nav, Alert, Form } from 'react-bootstrap';

const KitchenManagement = () => {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [timeFilter, setTimeFilter] = useState('today');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status badge colors
  const statusColors = {
    pending: 'warning',
    preparing: 'primary',
    ready: 'success',
    delivered: 'secondary',
    done: 'info'
  };

  // Time filter options
  const timeFilterOptions = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    all: 'All Time'
  };

  // Get start date based on time filter
  const getStartDate = (filter) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return new Date(0); // beginning of time for 'all'
    }
  };

  // Check if user has required role
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (currentUser.role !== 'Admin' && currentUser.role !== 'Chef') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch active orders in real-time
  useEffect(() => {
    if (!currentUser) return;

    const ordersRef = collection(db, 'orders');
    let unsubscribe;

    try {
      const q = query(
        ordersRef,
        where('status', 'in', ['pending', 'preparing']),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt instanceof Date 
                ? data.createdAt.toLocaleString()
                : data.createdAt?.seconds 
                  ? new Date(data.createdAt.seconds * 1000).toLocaleString()
                  : 'N/A'
            };
          });
          setOrders(ordersData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Error in snapshot listener:', error);
          if (error.code === 'failed-precondition') {
            const indexUrl = error.message.includes('https://console.firebase.google.com') 
              ? error.message.substring(error.message.indexOf('https://console.firebase.google.com'))
              : null;

            setError(
              <div>
                <Alert variant="info">
                  <p className="mb-0">After creating the index, please wait a few minutes and refresh the page.</p>
                </Alert>
              </div>
            );
            
            // Fall back to a simpler query without ordering
            const fallbackQuery = query(
              ordersRef,
              where('status', 'in', ['pending', 'preparing'])
            );

            unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
              const ordersData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt instanceof Date 
                    ? data.createdAt.toLocaleString()
                    : data.createdAt?.seconds 
                      ? new Date(data.createdAt.seconds * 1000).toLocaleString()
                      : 'N/A'
                };
              })
              // Sort manually on client side as fallback
              .sort((a, b) => {
                const dateA = a.createdAt === 'N/A' ? 0 : new Date(a.createdAt).getTime();
                const dateB = b.createdAt === 'N/A' ? 0 : new Date(b.createdAt).getTime();
                return dateB - dateA;
              });
              
              setOrders(ordersData);
              setLoading(false);
            });
          }
        }
      );
    } catch (error) {
      console.error('Error setting up orders listener:', error);
      setError('Error loading orders. Please try refreshing the page.');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Fetch completed orders with time filter
  useEffect(() => {
    if (!currentUser) return;

    const ordersRef = collection(db, 'orders');
    let unsubscribe;

    try {
      const startDate = getStartDate(timeFilter);
      console.log('Fetching orders with startDate:', startDate);
      
      // First try without the readyAt filter to see if we get any data
      const q = query(
        ordersRef,
        where('status', 'in', ['ready', 'delivered', 'done']),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Raw snapshot data:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          
          const ordersData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Processing order:', doc.id, data);

            // Convert Firestore timestamp to Date
            const createdAt = data.createdAt?.seconds 
              ? new Date(data.createdAt.seconds * 1000)
              : null;

            // Get the completion timestamp based on status
            let completionTimestamp = null;
            let completedByUser = null;

            // Check timestamps in order of priority
            if (data.readyAt?.seconds) {
              completionTimestamp = new Date(data.readyAt.seconds * 1000);
              completedByUser = data.readyBy;
            } else if (data.deliveredAt?.seconds) {
              completionTimestamp = new Date(data.deliveredAt.seconds * 1000);
              completedByUser = data.deliveredBy;
            } else if (data.doneAt?.seconds) {
              completionTimestamp = new Date(data.doneAt.seconds * 1000);
              completedByUser = data.doneBy;
            }

            // Filter out orders if they don't meet the time criteria
            if (timeFilter !== 'all' && completionTimestamp) {
              if (completionTimestamp < startDate) {
                return null;
              }
            }

            return {
              id: doc.id,
              ...data,
              createdAt: createdAt ? createdAt.toLocaleString() : 'N/A',
              completedAt: completionTimestamp ? completionTimestamp.toLocaleString() : 'N/A',
              completedBy: completedByUser?.name || 'N/A'
            };
          })
          .filter(Boolean) // Remove null entries
          .sort((a, b) => {
            // Sort by completion date
            const dateA = a.completedAt === 'N/A' ? 0 : new Date(a.completedAt).getTime();
            const dateB = b.completedAt === 'N/A' ? 0 : new Date(b.completedAt).getTime();
            return dateB - dateA;
          });

          console.log('Processed orders data:', ordersData);
          setCompletedOrders(ordersData);
        },
        (error) => {
          console.error('Detailed error in completed orders listener:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          
          if (error.code === 'failed-precondition') {
            setError(
              <div>
                <Alert variant="info">
                  <Alert.Heading>Action Required: Create Firestore Index</Alert.Heading>
                  <p>This query requires a Firestore index to be created. To fix this:</p>
                  <ol>
                    <li>Go to your Firebase Console</li>
                    <li>Navigate to Firestore Database</li>
                    <li>Click on the "Indexes" tab</li>
                    <li>Add a composite index for the collection "orders" with these fields:
                      <ul>
                        <li>status (Ascending)</li>
                        <li>createdAt (Descending)</li>
                      </ul>
                    </li>
                  </ol>
                  <p className="mb-0">After creating the index, please wait a few minutes and refresh the page.</p>
                </Alert>
              </div>
            );
          } else {
            setError(
              <Alert variant="danger">
                <Alert.Heading>Error Loading Orders</Alert.Heading>
                <p>{error.message}</p>
              </Alert>
            );
          }
        }
      );
    } catch (error) {
      console.error('Error setting up completed orders listener:', error);
      setError(
        <Alert variant="danger">
          <Alert.Heading>Error Setting Up Orders Listener</Alert.Heading>
          <p>{error.message}</p>
        </Alert>
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, timeFilter]);

  // Fetch inventory
  useEffect(() => {
    if (!currentUser) return;

    const fetchInventory = async () => {
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const inventoryData = inventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(inventoryData);
    };
    fetchInventory();
  }, [currentUser]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        [`${newStatus}At`]: serverTimestamp(),
        [`${newStatus}By`]: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const renderOrdersTable = (ordersData, showActions = true) => (
    <Table responsive striped bordered hover>
      <thead>
        <tr>
          <th>Order #</th>
          <th>Table</th>
          <th>Items</th>
          <th>Created At</th>
          {!showActions && <th>Completed At</th>}
          {!showActions && <th>Completed By</th>}
          <th>Status</th>
          <th>Modifications</th>
          {showActions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {ordersData.length === 0 ? (
          <tr>
            <td colSpan={showActions ? 8 : 9} className="text-center">
              No orders found for the selected time period
            </td>
          </tr>
        ) : (
          ordersData.map(order => (
            <tr key={order.id}>
              <td>{order.invoiceNumber}</td>
              <td>Table {order.tableNumber}</td>
              <td>
                <ul className="list-unstyled mb-0">
                  {order.items?.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}x {item.name}
                      {item.notes && (
                        <small className="text-muted d-block">
                          Note: {item.notes}
                        </small>
                      )}
                    </li>
                  ))}
                </ul>
              </td>
              <td>{order.createdAt}</td>
              {!showActions && <td>{order.completedAt}</td>}
              {!showActions && <td>{order.completedBy}</td>}
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
              {showActions && (
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
              )}
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );

  if (!currentUser || loading) {
    return <Container className="py-5"><div>Loading...</div></Container>;
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Kitchen Management</h1>

      {error && (
        <Alert variant="warning" className="mb-4">
          {error}
        </Alert>
      )}

      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
          >
            Active Orders
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            Order History
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'orders' && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h3 className="mb-0">Active Orders</h3>
              </Card.Header>
              <Card.Body>
                {renderOrdersTable(orders)}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'history' && (
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Order History</h3>
                <Form.Select 
                  style={{ width: 'auto' }}
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  {Object.entries(timeFilterOptions).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Form.Select>
              </Card.Header>
              <Card.Body>
                {renderOrdersTable(completedOrders, false)}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'inventory' && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h3 className="mb-0">Kitchen Inventory</h3>
              </Card.Header>
              <Card.Body>
                <Table responsive striped bordered hover>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Last Updated</th>
                      <th>Updated by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td>{item.lastUpdatedAt ? new Date(item.lastUpdatedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                        <td>{item.lastUpdatedBy?.name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default KitchenManagement; 