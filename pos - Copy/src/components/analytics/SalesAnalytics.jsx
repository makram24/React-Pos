import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { 
  fetchOrdersByDateRange, 
  getDateRanges,
  calculateTotalSales,
  groupSalesByCategory,
  getTopSellingItems,
  getLeastSellingItems,
  groupSalesByHour,
  groupSalesByTable,
  groupSalesByOrderType,
  getDiscountImpact
} from './analyticsUtils';

const SalesAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range state
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  
  // Sales metrics
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0,
    categorySales: {},
    topSellingItems: [],
    leastSellingItems: [],
    hourlyDistribution: [],
    tableSales: [],
    orderTypeSales: {},
    discountImpact: {}
  });
  
  // Fetch orders on component mount or date range change
  useEffect(() => {
    const fetchOrders = async () => {
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
        
        // Calculate metrics
        const totalSales = calculateTotalSales(orderData);
        const categorySales = groupSalesByCategory(orderData);
        const topSellingItems = getTopSellingItems(orderData, 10);
        const leastSellingItems = getLeastSellingItems(orderData, 10);
        const hourlyDistribution = groupSalesByHour(orderData);
        const tableSales = groupSalesByTable(orderData);
        const orderTypeSales = groupSalesByOrderType(orderData);
        const discountImpact = getDiscountImpact(orderData);
        
        setSalesMetrics({
          totalSales,
          categorySales,
          topSellingItems,
          leastSellingItems,
          hourlyDistribution,
          tableSales,
          orderTypeSales,
          discountImpact
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        setError('Failed to load sales data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [dateRange, customDateRange]);
  
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
  
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading sales data...</p>
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
      <h3>Sales Analytics</h3>
      <p>View and analyze sales data to identify trends and make informed business decisions.</p>
      
      {/* Date Range Selector */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Form.Select value={dateRange} onChange={handleDateRangeChange}>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            {dateRange === 'custom' && (
              <>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={customDateRange.startDate.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
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
          </Row>
        </Card.Body>
      </Card>
      
      {/* Total Sales Summary */}
      <Row className="mb-4">
        <Col>
          <Card className="h-100">
            <Card.Body>
              <h5>Total Sales</h5>
              <h2 className="text-primary">{formatCurrency(salesMetrics.totalSales)}</h2>
              <p className="text-muted">
                Based on {orders.length} orders during the selected period
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col>
          <Card className="h-100">
            <Card.Body>
              <h5>Average Order Value</h5>
              <h2 className="text-success">
                {formatCurrency(orders.length > 0 ? salesMetrics.totalSales / orders.length : 0)}
              </h2>
              <p className="text-muted">
                Average amount spent per order
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col>
          <Card className="h-100">
            <Card.Body>
              <h5>Orders</h5>
              <h2 className="text-info">{orders.length}</h2>
              <p className="text-muted">
                Total number of orders in this period
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Sales by Category */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Sales by Category</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Category</th>
                <th>Items Sold</th>
                <th>Total Sales</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(salesMetrics.categorySales).map(([category, data]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{data.itemCount}</td>
                  <td>{formatCurrency(data.totalSales)}</td>
                  <td>
                    {salesMetrics.totalSales > 0 
                      ? ((data.totalSales / salesMetrics.totalSales) * 100).toFixed(2) 
                      : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Top Selling Items */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Top Selling Items</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {salesMetrics.topSellingItems.map(item => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.category || 'Uncategorized'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Least Selling Items</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {salesMetrics.leastSellingItems.map(item => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.category || 'Uncategorized'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Sales by Time Period */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Sales by Time Period</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Hour</th>
                <th>Orders</th>
                <th>Sales</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {salesMetrics.hourlyDistribution.map(hour => (
                <tr key={hour.hour}>
                  <td>{`${hour.hour}:00 - ${hour.hour + 1}:00`}</td>
                  <td>{hour.orderCount}</td>
                  <td>{formatCurrency(hour.totalSales)}</td>
                  <td>
                    {salesMetrics.totalSales > 0 
                      ? ((hour.totalSales / salesMetrics.totalSales) * 100).toFixed(2) 
                      : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Sales by Table & Floor */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Sales by Table</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Table</th>
                <th>Orders</th>
                <th>Sales</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {salesMetrics.tableSales.map(table => (
                <tr key={table.id}>
                  <td>{table.name}</td>
                  <td>{table.orderCount}</td>
                  <td>{formatCurrency(table.totalSales)}</td>
                  <td>
                    {salesMetrics.totalSales > 0 
                      ? ((table.totalSales / salesMetrics.totalSales) * 100).toFixed(2) 
                      : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Sales by Order Type */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Sales by Order Type</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Order Type</th>
                <th>Orders</th>
                <th>Sales</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(salesMetrics.orderTypeSales).map(([type, data]) => (
                <tr key={type}>
                  <td>{type.charAt(0).toUpperCase() + type.slice(1)}</td>
                  <td>{data.orderCount}</td>
                  <td>{formatCurrency(data.totalSales)}</td>
                  <td>
                    {salesMetrics.totalSales > 0 
                      ? ((data.totalSales / salesMetrics.totalSales) * 100).toFixed(2) 
                      : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Discount & Promotion Performance */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Discount & Promotion Performance</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Total Discount Amount</h6>
                  <h3>{formatCurrency(salesMetrics.discountImpact.totalDiscountAmount || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Orders with Discounts</h6>
                  <h3>{salesMetrics.discountImpact.orderCountWithDiscount || 0}</h3>
                  <small>({salesMetrics.discountImpact.discountPercentage?.toFixed(1) || 0}% of all orders)</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Avg. Discount per Order</h6>
                  <h3>
                    {formatCurrency(
                      salesMetrics.discountImpact.orderCountWithDiscount
                        ? salesMetrics.discountImpact.totalDiscountAmount / salesMetrics.discountImpact.orderCountWithDiscount
                        : 0
                    )}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Discount Name</th>
                <th>Usage Count</th>
                <th>Total Discount</th>
                <th>Avg. Order Value</th>
              </tr>
            </thead>
            <tbody>
              {salesMetrics.discountImpact.discounts && salesMetrics.discountImpact.discounts.map(discount => (
                <tr key={discount.name}>
                  <td>{discount.name}</td>
                  <td>{discount.useCount}</td>
                  <td>{formatCurrency(discount.totalAmount)}</td>
                  <td>{formatCurrency(discount.avgOrderValue)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SalesAnalytics; 