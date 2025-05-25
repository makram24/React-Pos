import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Table, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { getDateRanges, dateToTimestamp, fetchOrdersByDateRange } from './analyticsUtils';
import { fetchCustomerFeedback, analyzeFeedbackRatings, analyzeFeedbackComments, analyzeOrderPreferences } from './customerUtils';

const CustomerAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  
  // Analytics states
  const [customerMetrics, setCustomerMetrics] = useState({
    feedbackRatings: {},
    feedbackComments: {},
    orderPreferences: {}
  });
  
  // Date range state
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  
  // Fetch customer data on component mount or date range change
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Fetch feedback
        const feedbackData = await fetchCustomerFeedback(startDate, endDate);
        setFeedback(feedbackData);
        
        // Calculate metrics
        const feedbackRatings = analyzeFeedbackRatings(feedbackData);
        const feedbackComments = analyzeFeedbackComments(feedbackData);
        const orderPreferences = analyzeOrderPreferences(orderData);
        
        setCustomerMetrics({
          feedbackRatings,
          feedbackComments,
          orderPreferences
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        setError('Failed to load customer data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
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
        <p className="mt-2">Loading customer data...</p>
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
      <h3>Customer & Loyalty Analytics</h3>
      <p>Understand customer preferences and analyze feedback to improve customer satisfaction.</p>
      
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
      
      {/* Customer Feedback Summary */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Customer Feedback Summary</h5>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center mb-4">
            <Col md={4} className="text-center">
              <h6>Average Rating</h6>
              <h1 className="display-4 mb-0">{customerMetrics.feedbackRatings.averageRating?.toFixed(1) || 0}</h1>
              <div className="text-muted">out of 5</div>
              <div>Based on {customerMetrics.feedbackRatings.totalRatings || 0} ratings</div>
            </Col>
            
            <Col md={8}>
              <h6>Rating Distribution</h6>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = customerMetrics.feedbackRatings.ratingCounts?.[rating] || 0;
                const percentage = customerMetrics.feedbackRatings.ratingPercentages?.[rating] || 0;
                
                return (
                  <div key={rating} className="mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>{rating} Stars</div>
                      <div>{count} ratings ({percentage.toFixed(1)}%)</div>
                    </div>
                    <ProgressBar 
                      now={percentage} 
                      variant={
                        rating >= 4 ? 'success' : 
                        rating === 3 ? 'info' : 
                        rating === 2 ? 'warning' : 'danger'
                      }
                    />
                  </div>
                );
              })}
            </Col>
          </Row>
          
          <h6>Feedback Sentiment Analysis</h6>
          <Row>
            {Object.entries(customerMetrics.feedbackComments).map(([category, data]) => {
              const total = data.positive + data.negative + data.neutral;
              if (total === 0) return null;
              
              const positivePercent = (data.positive / total) * 100;
              const negativePercent = (data.negative / total) * 100;
              const neutralPercent = (data.neutral / total) * 100;
              
              return (
                <Col md={4} key={category} className="mb-3">
                  <Card>
                    <Card.Header className="text-capitalize">{category}</Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-2">
                        <Badge bg="success">Positive: {data.positive}</Badge>
                        <Badge bg="danger">Negative: {data.negative}</Badge>
                        <Badge bg="secondary">Neutral: {data.neutral}</Badge>
                      </div>
                      <ProgressBar>
                        <ProgressBar variant="success" now={positivePercent} key={1} />
                        <ProgressBar variant="warning" now={neutralPercent} key={2} />
                        <ProgressBar variant="danger" now={negativePercent} key={3} />
                      </ProgressBar>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card.Body>
      </Card>
      
      {/* Recent Customer Feedback */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Recent Customer Feedback</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {feedback.slice(0, 10).map(item => {
                let sentiment;
                if (item.rating >= 4) sentiment = 'positive';
                else if (item.rating <= 2) sentiment = 'negative';
                else sentiment = 'neutral';
                
                const date = item.createdAt?.toDate ? 
                  item.createdAt.toDate().toLocaleDateString() : 
                  new Date().toLocaleDateString();
                
                return (
                  <tr key={item.id}>
                    <td>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < item.rating ? 'text-warning' : 'text-muted'}>★</span>
                      ))}
                    </td>
                    <td>{item.comment}</td>
                    <td>{date}</td>
                    <td>
                      <Badge bg={
                        sentiment === 'positive' ? 'success' :
                        sentiment === 'negative' ? 'danger' : 'secondary'
                      }>
                        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Order Preferences */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Customer Order Preferences</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h6>Most Popular Items</h6>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {customerMetrics.orderPreferences.items?.slice(0, 5).map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category || 'Uncategorized'}</td>
                      <td>{item.count}</td>
                      <td>{formatCurrency(item.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
            
            <Col md={6}>
              <h6>Most Popular Categories</h6>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Items Ordered</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {customerMetrics.orderPreferences.categories?.slice(0, 5).map(category => (
                    <tr key={category.name}>
                      <td>{category.name}</td>
                      <td>{category.count}</td>
                      <td>{formatCurrency(category.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
          
          <h6>Dietary Preferences</h6>
          <Row>
            {customerMetrics.orderPreferences.dietaryPreferences && 
              Object.entries(customerMetrics.orderPreferences.dietaryPreferences)
                .filter(([_, count]) => count > 0)
                .map(([preference, count]) => (
                  <Col md={4} key={preference} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h6 className="text-capitalize">{preference.replace(/([A-Z])/g, ' $1').trim()}</h6>
                        <h3>{count}</h3>
                        <p className="mb-0">orders</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
            }
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CustomerAnalytics; 