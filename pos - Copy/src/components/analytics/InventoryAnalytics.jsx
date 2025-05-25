import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { getDateRanges, dateToTimestamp, fetchOrdersByDateRange } from './analyticsUtils';
import { 
  fetchInventoryItems, 
  fetchMenuItems, 
  fetchInventoryUsage,
  calculateDepletionRate,
  analyzeFoodWaste,
  analyzeSupplierPerformance,
  calculateMenuItemProfitability
} from './inventoryUtils';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';

const InventoryAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [inventory, setInventory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [supplierRecords, setSupplierRecords] = useState([]);
  const [salesData, setSalesData] = useState([]);
  
  // Analytics states
  const [lowStockItems, setLowStockItems] = useState([]);
  const [depletionRates, setDepletionRates] = useState({});
  const [wasteAnalysis, setWasteAnalysis] = useState({});
  const [supplierPerformance, setSupplierPerformance] = useState([]);
  const [menuProfitability, setMenuProfitability] = useState([]);
  
  // Date range state
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  
  // Fetch inventory data on component mount or date range change
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
        
        // Fetch inventory items
        const inventoryData = await fetchInventoryItems();
        setInventory(inventoryData);
        
        // Fetch menu items
        const menuItemsData = await fetchMenuItems();
        setMenuItems(menuItemsData);
        
        // Fetch inventory usage history
        const usageData = await fetchInventoryUsage(startDate, endDate);
        setUsageHistory(usageData);
        
        // Fetch waste records
        const wasteData = await fetchWasteRecords(startDate, endDate);
        setWasteRecords(wasteData);
        
        // Fetch supplier records
        const supplierData = await fetchSupplierRecords(startDate, endDate);
        setSupplierRecords(supplierData);
        
        // Fetch order data for sales analysis
        const ordersData = await fetchOrdersByDateRange(startDate, endDate);
        const itemSales = [];
        
        // Extract item sales from orders
        ordersData.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              itemSales.push({
                itemId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                category: item.category,
                date: order.createdAt
              });
            });
          }
        });
        
        setSalesData(itemSales);
        
        // Calculate low stock items
        const lowStockData = inventoryData
          .filter(item => item.quantity <= (item.minQuantity || 10))
          .sort((a, b) => {
            const aRatio = a.quantity / (a.minQuantity || 10);
            const bRatio = b.quantity / (b.minQuantity || 10);
            return aRatio - bRatio;
          });
        
        setLowStockItems(lowStockData);
        
        // Calculate depletion rates
        const depletionData = {};
        inventoryData.forEach(item => {
          depletionData[item.id] = calculateDepletionRate(item, usageData);
        });
        
        setDepletionRates(depletionData);
        
        // Analyze waste
        const wasteResults = analyzeFoodWaste(wasteData);
        setWasteAnalysis(wasteResults);
        
        // Calculate supplier performance
        const supplierResults = analyzeSupplierPerformance(supplierData);
        setSupplierPerformance(supplierResults);
        
        // Calculate menu profitability
        const profitabilityData = calculateMenuItemProfitability(menuItemsData, inventoryData, itemSales);
        setMenuProfitability(profitabilityData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setError('Failed to load inventory data. Please try again.');
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
  
  // Fetch waste records from Firestore
  const fetchWasteRecords = async (startDate, endDate) => {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      const wasteRef = collection(db, 'waste');
      const q = query(
        wasteRef,
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching waste records:', error);
      return [];
    }
  };
  
  // Fetch supplier records from Firestore
  const fetchSupplierRecords = async (startDate, endDate) => {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      const supplierRef = collection(db, 'suppliers');
      const q = query(
        supplierRef,
        where('deliveryDate', '>=', startTimestamp),
        where('deliveryDate', '<=', endTimestamp),
        orderBy('deliveryDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching supplier records:', error);
      return [];
    }
  };
  
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading inventory data...</p>
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
      <h3>Inventory & Waste Management Analytics</h3>
      <p>Monitor inventory levels, track usage, and identify waste reduction opportunities.</p>
      
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
      
      {/* Low Stock Alerts */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Low Stock Alerts</h5>
        </Card.Header>
        <Card.Body>
          {lowStockItems.length === 0 ? (
            <Alert variant="success">All inventory items are at healthy stock levels.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Current Quantity</th>
                  <th>Min. Quantity</th>
                  <th>Status</th>
                  <th>Estimated Days Left</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => {
                  const ratio = item.quantity / (item.minQuantity || 10);
                  const status = ratio < 0.5 ? 'critical' : 'low';
                  const daysLeft = depletionRates[item.id]?.estimatedDaysLeft || 0;
                  
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity.toFixed(2)} {item.unit}</td>
                      <td>{item.minQuantity || 10} {item.unit}</td>
                      <td>
                        <Badge bg={status === 'critical' ? 'danger' : 'warning'}>
                          {status === 'critical' ? 'Critical' : 'Low Stock'}
                        </Badge>
                      </td>
                      <td>{Math.round(daysLeft)} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Stock Usage Report */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Stock Usage Report</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Item</th>
                <th>Current Stock</th>
                <th>Daily Usage</th>
                <th>Weekly Usage</th>
                <th>Estimated Days Left</th>
              </tr>
            </thead>
            <tbody>
              {inventory.slice(0, 10).map(item => {
                const depletion = depletionRates[item.id] || { dailyRate: 0, weeklyRate: 0, estimatedDaysLeft: 0 };
                
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity.toFixed(2)} {item.unit}</td>
                    <td>{depletion.dailyRate.toFixed(2)} {item.unit}</td>
                    <td>{depletion.weeklyRate.toFixed(2)} {item.unit}</td>
                    <td>{Math.round(depletion.estimatedDaysLeft)} days</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Food Waste Analysis */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Food Waste Analysis</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Total Waste Value</h6>
                  <h2>{formatCurrency(wasteAnalysis.totalWasteValue || 0)}</h2>
                  <div className="text-muted">During selected period</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Total Waste Items</h6>
                  <h2>{wasteAnalysis.itemCount || 0}</h2>
                  <div className="text-muted">Unique items wasted</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Total Records</h6>
                  <h2>{wasteRecords.length}</h2>
                  <div className="text-muted">Waste incidents recorded</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <h6>Top Wasted Items</h6>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity Wasted</th>
                <th>Value Lost</th>
                <th>Primary Reason</th>
              </tr>
            </thead>
            <tbody>
              {wasteAnalysis.wasteByItem?.slice(0, 5).map(item => {
                // Find the primary reason (mode)
                let primaryReason = 'Unknown';
                let maxOccurrences = 0;
                
                Object.entries(item.reasons).forEach(([reason, count]) => {
                  if (count > maxOccurrences) {
                    primaryReason = reason;
                    maxOccurrences = count;
                  }
                });
                
                return (
                  <tr key={item.itemId}>
                    <td>{item.itemName}</td>
                    <td>{item.totalQuantity.toFixed(2)}</td>
                    <td>{formatCurrency(item.totalValue)}</td>
                    <td>{primaryReason}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Supplier Performance */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Supplier Performance Analysis</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Deliveries</th>
                <th>On-Time Rate</th>
                <th>Complete Rate</th>
                <th>Total Value</th>
                <th>Performance Score</th>
              </tr>
            </thead>
            <tbody>
              {supplierPerformance.map(supplier => (
                <tr key={supplier.supplierId}>
                  <td>{supplier.supplierName}</td>
                  <td>{supplier.deliveries}</td>
                  <td>{supplier.onTimeRate.toFixed(1)}%</td>
                  <td>{supplier.completeRate.toFixed(1)}%</td>
                  <td>{formatCurrency(supplier.totalValue)}</td>
                  <td>
                    <Badge bg={
                      supplier.performanceScore >= 90 ? 'success' : 
                      supplier.performanceScore >= 70 ? 'info' : 
                      supplier.performanceScore >= 50 ? 'warning' : 'danger'
                    }>
                      {supplier.performanceScore.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Menu Engineering */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Menu Engineering</h5>
        </Card.Header>
        <Card.Body>
          <h6>Menu Item Profitability</h6>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Sale Price</th>
                <th>Ingredient Cost</th>
                <th>Profit Margin</th>
                <th>Items Sold</th>
                <th>Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {menuProfitability.slice(0, 10).map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.ingredientCost)}</td>
                  <td>{item.profitMargin.toFixed(1)}%</td>
                  <td>{item.totalQuantitySold}</td>
                  <td>{formatCurrency(item.totalProfit)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default InventoryAnalytics; 