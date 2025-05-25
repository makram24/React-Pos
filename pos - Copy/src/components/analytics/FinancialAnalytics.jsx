import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Table, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { getDateRanges, dateToTimestamp, fetchOrdersByDateRange } from './analyticsUtils';
import { fetchInventoryItems, fetchInventoryUsage } from './inventoryUtils';
import { fetchEmployees, fetchEmployeeShifts } from './employeeUtils';
import { 
  fetchExpenses, 
  calculateProfitAndLoss, 
  calculateExpensesByCategory,
  calculateCOGSByMenuItem,
  calculatePayrollCosts,
  calculateTaxes
} from './financialUtils';

const FinancialAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventoryUsage, setInventoryUsage] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  // Analytics states
  const [profitLoss, setProfitLoss] = useState({});
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [cogsByItem, setCogsByItem] = useState([]);
  const [payrollData, setPayrollData] = useState({});
  const [taxData, setTaxData] = useState({});
  
  // Date range state
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  
  // Fetch financial data on component mount or date range change
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
        
        // Fetch expenses
        const expenseData = await fetchExpenses(startDate, endDate);
        setExpenses(expenseData);
        
        // Fetch inventory items and usage
        const inventoryData = await fetchInventoryItems();
        setInventory(inventoryData);
        
        const usageData = await fetchInventoryUsage(startDate, endDate);
        setInventoryUsage(usageData);
        
        // Fetch employees and shifts
        const employeeData = await fetchEmployees();
        setEmployees(employeeData);
        
        const shiftData = await fetchEmployeeShifts(startDate, endDate);
        setShifts(shiftData);
        
        // Calculate P&L
        const profitLossData = calculateProfitAndLoss(orderData, expenseData, usageData);
        setProfitLoss(profitLossData);
        
        // Calculate expense breakdown
        const expenseBreakdownData = calculateExpensesByCategory(expenseData);
        setExpenseBreakdown(expenseBreakdownData);
        
        // Extract menu items from orders
        const menuItems = new Map();
        orderData.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              if (!menuItems.has(item.id)) {
                menuItems.set(item.id, {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  category: item.category,
                  ingredients: item.ingredients || []
                });
              }
            });
          }
        });
        
        // Extract sales data from orders
        const salesData = [];
        orderData.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              salesData.push({
                itemId: item.id,
                price: item.price,
                quantity: item.quantity || 1,
                date: order.createdAt
              });
            });
          }
        });
        
        // Calculate COGS by menu item
        const cogsData = calculateCOGSByMenuItem(Array.from(menuItems.values()), inventoryData, salesData);
        setCogsByItem(cogsData);
        
        // Calculate payroll costs
        const payrollCostData = calculatePayrollCosts(shiftData, employeeData);
        setPayrollData(payrollCostData);
        
        // Calculate tax data
        const taxAnalysisData = calculateTaxes(orderData);
        setTaxData(taxAnalysisData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching financial data:', error);
        setError('Failed to load financial data. Please try again.');
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
        <p className="mt-2">Loading financial data...</p>
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
      <h3>Financial & Expense Analytics</h3>
      <p>Analyze your restaurant's financial performance, track expenses, and monitor profitability.</p>
      
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
      
      {/* Profit and Loss Statement */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Profit and Loss Statement</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h6>Revenue</h6>
                  <h2 className="text-success">{formatCurrency(profitLoss.totalRevenue || 0)}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h6>COGS</h6>
                  <h2 className="text-danger">{formatCurrency(profitLoss.totalCOGS || 0)}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h6>Expenses</h6>
                  <h2 className="text-danger">{formatCurrency(profitLoss.totalExpenses || 0)}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h6>Net Profit</h6>
                  <h2 className={profitLoss.netProfit >= 0 ? 'text-success' : 'text-danger'}>
                    {formatCurrency(profitLoss.netProfit || 0)}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-success">
                <td><strong>Revenue</strong></td>
                <td>{formatCurrency(profitLoss.totalRevenue || 0)}</td>
                <td>100%</td>
              </tr>
              <tr className="table-danger">
                <td>Cost of Goods Sold (COGS)</td>
                <td>{formatCurrency(profitLoss.totalCOGS || 0)}</td>
                <td>{profitLoss.totalRevenue ? ((profitLoss.totalCOGS / profitLoss.totalRevenue) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className="table-success">
                <td><strong>Gross Profit</strong></td>
                <td>{formatCurrency(profitLoss.grossProfit || 0)}</td>
                <td>{profitLoss.grossProfitMargin?.toFixed(1) || 0}%</td>
              </tr>
              <tr className="table-danger">
                <td>Operating Expenses</td>
                <td>{formatCurrency(profitLoss.totalExpenses || 0)}</td>
                <td>{profitLoss.totalRevenue ? ((profitLoss.totalExpenses / profitLoss.totalRevenue) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className={profitLoss.netProfit >= 0 ? 'table-success' : 'table-danger'}>
                <td><strong>Net Profit</strong></td>
                <td>{formatCurrency(profitLoss.netProfit || 0)}</td>
                <td>{profitLoss.netProfitMargin?.toFixed(1) || 0}%</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Expense Breakdown */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Expense Breakdown</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Amount</th>
                <th>% of Expenses</th>
                <th>Count</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {expenseBreakdown.sort((a, b) => b.totalAmount - a.totalAmount).map(category => {
                const percentage = profitLoss.totalExpenses > 0 
                  ? (category.totalAmount / profitLoss.totalExpenses) * 100 
                  : 0;
                
                return (
                  <tr key={category.category}>
                    <td>{category.category}</td>
                    <td>{formatCurrency(category.totalAmount)}</td>
                    <td>{percentage.toFixed(1)}%</td>
                    <td>{category.count}</td>
                    <td>
                      <ProgressBar now={percentage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Cost of Goods Sold (COGS) */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Cost of Goods Sold (COGS) by Menu Item</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Menu Item</th>
                <th>Category</th>
                <th>Sale Price</th>
                <th>COGS</th>
                <th>Profit Margin</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {cogsByItem
                .sort((a, b) => (b.price - b.ingredientCost) - (a.price - a.ingredientCost))
                .slice(0, 10)
                .map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.ingredientCost)}</td>
                  <td>
                    {(item.cogsPercentage <= 70) ? (
                      <span className="text-success">{(100 - item.cogsPercentage).toFixed(1)}%</span>
                    ) : (
                      <span className="text-danger">{(100 - item.cogsPercentage).toFixed(1)}%</span>
                    )}
                  </td>
                  <td>{item.quantitySold}</td>
                  <td>{formatCurrency(item.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Payroll Costs */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Payroll Costs</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Total Payroll</h6>
                  <h3>{formatCurrency(payrollData.totalPayroll || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Regular Pay</h6>
                  <h3>{formatCurrency(payrollData.regularPayroll || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Overtime Pay</h6>
                  <h3>{formatCurrency(payrollData.overtimePayroll || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <h6>Payroll by Role</h6>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Role</th>
                <th>Employees</th>
                <th>Total Hours</th>
                <th>Total Cost</th>
                <th>% of Payroll</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.rolePayroll && payrollData.rolePayroll
                .sort((a, b) => b.totalCost - a.totalCost)
                .map(role => {
                  const percentage = payrollData.totalPayroll > 0 
                    ? (role.totalCost / payrollData.totalPayroll) * 100 
                    : 0;
                  
                  return (
                    <tr key={role.role}>
                      <td>{role.role}</td>
                      <td>{role.employeeCount}</td>
                      <td>{role.totalHours.toFixed(1)}</td>
                      <td>{formatCurrency(role.totalCost)}</td>
                      <td>{percentage.toFixed(1)}%</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Tax Analysis */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Tax Analysis</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Total Taxes</h6>
                  <h3>{formatCurrency(taxData.totalTaxes || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Sales Tax</h6>
                  <h3>{formatCurrency(taxData.totalSalesTax || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Service Charges</h6>
                  <h3>{formatCurrency(taxData.totalServiceCharges || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h6>Tax Rate</h6>
                  <h3>{taxData.taxPercentage?.toFixed(1) || 0}%</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Base Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sales Tax</td>
                <td>{formatCurrency(taxData.totalSalesTax || 0)}</td>
                <td>{taxData.salesTaxPercentage?.toFixed(1) || 0}%</td>
                <td>{formatCurrency(taxData.beforeTaxTotal || 0)}</td>
              </tr>
              <tr>
                <td>Service Charges</td>
                <td>{formatCurrency(taxData.totalServiceCharges || 0)}</td>
                <td>{taxData.serviceChargePercentage?.toFixed(1) || 0}%</td>
                <td>{formatCurrency(taxData.beforeTaxTotal || 0)}</td>
              </tr>
              <tr className="table-info">
                <td><strong>Total Taxes & Charges</strong></td>
                <td>{formatCurrency(taxData.totalTaxes || 0)}</td>
                <td>{taxData.taxPercentage?.toFixed(1) || 0}%</td>
                <td>{formatCurrency(taxData.beforeTaxTotal || 0)}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default FinancialAnalytics; 