import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, Table, Spinner, Alert, Modal, Badge
} from 'react-bootstrap';
import { getDateRanges, dateToTimestamp, fetchOrdersByDateRange } from './analyticsUtils';
import { fetchInventoryItems, fetchInventoryUsage } from './inventoryUtils';
import { fetchEmployees } from './employeeUtils';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';

const DashboardAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Dashboard metrics
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSales: 0,
    orderCount: 0,
    avgOrderValue: 0,
    topSellingItems: [],
    lowStockItems: [],
    activeOrders: []
  });
  
  // Date range state
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  
  // Refresh interval (in minutes) - default 5 minutes
  const [refreshInterval, setRefreshInterval] = useState(5);
  const intervalRef = useRef(null);
  
  // Custom report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    title: '',
    dateRange: 'month',
    customStartDate: new Date(),
    customEndDate: new Date(),
    metrics: ['sales', 'orders', 'inventory'],
    groupBy: 'day'
  });
  
  // Fetch dashboard data on component mount or date range change
  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh interval
    intervalRef.current = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dateRange, customDateRange, refreshInterval]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const ranges = getDateRanges();
      let startDate, endDate;
      
      if (dateRange === 'custom') {
        startDate = customDateRange.startDate;
        endDate = customDateRange.endDate;
      } else {
        startDate = ranges[dateRange].start;
        endDate = ranges[dateRange].end;
      }
      
      // Fetch orders
      const orderData = await fetchOrdersByDateRange(startDate, endDate);
      setOrders(orderData);
      
      // Fetch inventory
      const inventoryData = await fetchInventoryItems();
      setInventory(inventoryData);
      
      // Fetch employees
      const employeeData = await fetchEmployees();
      setEmployees(employeeData);
      
      // Fetch active orders (orders with status 'pending' or 'processing')
      const activeOrdersRef = collection(db, 'orders');
      const activeOrdersQuery = query(
        activeOrdersRef,
        where('status', 'in', ['pending', 'processing']),
        orderBy('createdAt', 'desc')
      );
      const activeOrdersSnapshot = await getDocs(activeOrdersQuery);
      const activeOrders = activeOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate dashboard metrics
      calculateDashboardMetrics(orderData, inventoryData, activeOrders);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };
  
  const calculateDashboardMetrics = (orders, inventory, activeOrders) => {
    // Total sales
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Order count
    const orderCount = orders.length;
    
    // Average order value
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
    
    // Extract menu items and calculate item counts
    const menuItemCounts = new Map();
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemId = item.id;
          const quantity = item.quantity || 1;
          const currentCount = menuItemCounts.get(itemId) || { 
            id: itemId, 
            name: item.name, 
            count: 0, 
            total: 0,
            price: item.price || 0,
            category: item.category || 'Uncategorized'
          };
          
          currentCount.count += quantity;
          currentCount.total += (item.price || 0) * quantity;
          menuItemCounts.set(itemId, currentCount);
        });
      }
    });
    
    // Calculate top selling items
    const topSellingItems = Array.from(menuItemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate low stock items
    const lowStockItems = inventory
      .filter(item => (item.currentStock || 0) < (item.minStockLevel || 5))
      .sort((a, b) => (a.currentStock || 0) - (b.currentStock || 0))
      .slice(0, 5);
    
    setDashboardMetrics({
      totalSales,
      orderCount,
      avgOrderValue,
      topSellingItems,
      lowStockItems,
      activeOrders
    });
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Handle date range change
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };
  
  // Handle custom date change
  const handleCustomDateChange = (type, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [type]: new Date(value)
    }));
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value, 10);
    setRefreshInterval(newInterval);
    
    // Reset interval timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      fetchDashboardData();
    }, newInterval * 60 * 1000);
  };
  
  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchDashboardData();
  };
  
  // Handle report configuration changes
  const handleReportConfigChange = (field, value) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle report metrics selection
  const handleMetricSelection = (metric) => {
    setReportConfig(prev => {
      const currentMetrics = [...prev.metrics];
      
      if (currentMetrics.includes(metric)) {
        return {
          ...prev,
          metrics: currentMetrics.filter(m => m !== metric)
        };
      } else {
        return {
          ...prev,
          metrics: [...currentMetrics, metric]
        };
      }
    });
  };
  
  // Generate custom report
  const generateReport = () => {
    // Here you would generate a custom report based on the reportConfig
    console.log('Generating report with config:', reportConfig);
    
    // Close the modal after generating the report
    setShowReportModal(false);
    
    // You can add logic here to download the report or display it in a new view
  };
  
  if (loading && orders.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading dashboard data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger">{error}</Alert>
    );
  }
  
  return (
    <div>
      <h3>Dashboard Analytics</h3>
      <p>Real-time overview of your restaurant's performance metrics and custom reporting.</p>
      
      {/* Controls */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Form.Select value={dateRange} onChange={handleDateRangeChange}>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            {dateRange === 'custom' && (
              <>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={customDateRange.startDate.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={customDateRange.endDate.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </>
            )}
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Auto-refresh (minutes)</Form.Label>
                <Form.Select value={refreshInterval} onChange={handleRefreshIntervalChange}>
                  <option value="1">1 minute</option>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3} className="d-flex justify-content-end">
              <Button 
                variant="primary" 
                className="me-2" 
                onClick={handleManualRefresh}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Refreshing...
                  </>
                ) : 'Refresh Now'}
              </Button>
              
              <Button 
                variant="outline-primary" 
                onClick={() => setShowReportModal(true)}
              >
                Create Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6>Total Sales</h6>
              <h2 className="text-success">{formatCurrency(dashboardMetrics.totalSales)}</h2>
              <small className="text-muted">
                {dateRange === 'today' ? 'Today' : 
                 dateRange === 'week' ? 'This Week' : 
                 dateRange === 'month' ? 'This Month' : 
                 dateRange === 'year' ? 'This Year' : 'Selected Period'}
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6>Order Count</h6>
              <h2>{dashboardMetrics.orderCount}</h2>
              <small className="text-muted">
                Avg. {formatCurrency(dashboardMetrics.avgOrderValue)} per order
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6>Active Orders</h6>
              <h2>{dashboardMetrics.activeOrders.length}</h2>
              <small className="text-muted">
                Orders currently in progress
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Main Dashboard Content */}
      <Row>
        {/* Top Selling Items */}
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Top Selling Items</h5>
              <Badge bg="info">{dateRange}</Badge>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardMetrics.topSellingItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.count}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                  
                  {dashboardMetrics.topSellingItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center">No sales data available</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Low Stock Alerts */}
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Low Stock Alerts</h5>
              <Badge bg="warning" text="dark">Attention Needed</Badge>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Current Stock</th>
                    <th>Min Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardMetrics.lowStockItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.currentStock || 0}</td>
                      <td>{item.minStockLevel || 5}</td>
                      <td>
                        <Badge bg={
                          (item.currentStock || 0) === 0 ? 'danger' :
                          (item.currentStock || 0) < (item.minStockLevel || 5) * 0.5 ? 'warning' :
                          'info'
                        }>
                          {(item.currentStock || 0) === 0 ? 'Out of Stock' :
                           (item.currentStock || 0) < (item.minStockLevel || 5) * 0.5 ? 'Critical' :
                           'Low'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  
                  {dashboardMetrics.lowStockItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center">All inventory items at sufficient levels</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Active Orders */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Active Orders</h5>
        </Card.Header>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Time</th>
                <th>Table/Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardMetrics.activeOrders.slice(0, 5).map(order => (
                <tr key={order.id}>
                  <td>{order.orderNumber || order.id.substring(0, 8)}</td>
                  <td>
                    {order.createdAt && order.createdAt.toDate
                      ? order.createdAt.toDate().toLocaleTimeString()
                      : 'N/A'}
                  </td>
                  <td>
                    {order.tableName 
                      ? `Table ${order.tableName}` 
                      : order.customer?.name || 'Guest'}
                  </td>
                  <td>
                    {order.items && Array.isArray(order.items)
                      ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}`
                      : '0 items'}
                  </td>
                  <td>{formatCurrency(order.total || 0)}</td>
                  <td>
                    <Badge bg={
                      order.status === 'pending' ? 'warning' :
                      order.status === 'processing' ? 'primary' :
                      'secondary'
                    }>
                      {order.status || 'Unknown'}
                    </Badge>
                  </td>
                </tr>
              ))}
              
              {dashboardMetrics.activeOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">No active orders</td>
                </tr>
              )}
            </tbody>
          </Table>
          
          {dashboardMetrics.activeOrders.length > 5 && (
            <div className="text-center mt-3">
              <Button variant="outline-secondary" size="sm">
                View All ({dashboardMetrics.activeOrders.length}) Orders
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Custom Report Modal */}
      <Modal 
        show={showReportModal} 
        onHide={() => setShowReportModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Custom Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Report Title</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter report title"
                value={reportConfig.title}
                onChange={(e) => handleReportConfigChange('title', e.target.value)}
              />
            </Form.Group>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date Range</Form.Label>
                  <Form.Select
                    value={reportConfig.dateRange}
                    onChange={(e) => handleReportConfigChange('dateRange', e.target.value)}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              {reportConfig.dateRange === 'custom' && (
                <Col md={6}>
                  <Row>
                    <Col>
                      <Form.Group>
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={reportConfig.customStartDate.toISOString().split('T')[0]}
                          onChange={(e) => handleReportConfigChange('customStartDate', new Date(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label>End Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={reportConfig.customEndDate.toISOString().split('T')[0]}
                          onChange={(e) => handleReportConfigChange('customEndDate', new Date(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Include Metrics</Form.Label>
              <div>
                <Form.Check 
                  inline
                  type="checkbox"
                  label="Sales"
                  checked={reportConfig.metrics.includes('sales')}
                  onChange={() => handleMetricSelection('sales')}
                />
                <Form.Check 
                  inline
                  type="checkbox"
                  label="Orders"
                  checked={reportConfig.metrics.includes('orders')}
                  onChange={() => handleMetricSelection('orders')}
                />
                <Form.Check 
                  inline
                  type="checkbox"
                  label="Inventory"
                  checked={reportConfig.metrics.includes('inventory')}
                  onChange={() => handleMetricSelection('inventory')}
                />
                <Form.Check 
                  inline
                  type="checkbox"
                  label="Menu Items"
                  checked={reportConfig.metrics.includes('menu')}
                  onChange={() => handleMetricSelection('menu')}
                />
                <Form.Check 
                  inline
                  type="checkbox"
                  label="Staff"
                  checked={reportConfig.metrics.includes('staff')}
                  onChange={() => handleMetricSelection('staff')}
                />
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Group By</Form.Label>
              <Form.Select
                value={reportConfig.groupBy}
                onChange={(e) => handleReportConfigChange('groupBy', e.target.value)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="category">Category</option>
                <option value="employee">Employee</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={generateReport}
            disabled={!reportConfig.title || reportConfig.metrics.length === 0}
          >
            Generate Report
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardAnalytics; 