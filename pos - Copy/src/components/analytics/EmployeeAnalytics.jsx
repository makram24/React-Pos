import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Table, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { getDateRanges, dateToTimestamp, fetchOrdersByDateRange } from './analyticsUtils';
import { 
  fetchEmployees, 
  fetchEmployeeShifts,
  calculateEmployeeSalesPerformance,
  calculateTableTurnoverRate,
  calculateLaborCosts,
  calculateAttendanceStats,
  calculateOrderHandlingTime
} from './employeeUtils';

const EmployeeAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Analytics states
  const [salesPerformance, setSalesPerformance] = useState([]);
  const [tableTurnover, setTableTurnover] = useState({});
  const [laborCosts, setLaborCosts] = useState({});
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [orderHandlingTime, setOrderHandlingTime] = useState([]);
  
  // Date range state
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  
  // Fetch employee data on component mount or date range change
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
        
        // Fetch employees
        const employeeData = await fetchEmployees();
        setEmployees(employeeData);
        
        // Fetch shifts
        const shiftData = await fetchEmployeeShifts(startDate, endDate);
        setShifts(shiftData);
        
        // Fetch orders
        const orderData = await fetchOrdersByDateRange(startDate, endDate);
        setOrders(orderData);
        
        // Calculate metrics
        const performanceData = calculateEmployeeSalesPerformance(orderData, employeeData);
        setSalesPerformance(performanceData);
        
        const turnoverData = calculateTableTurnoverRate(orderData, employeeData);
        setTableTurnover(turnoverData);
        
        const costData = calculateLaborCosts(shiftData, orderData, employeeData);
        setLaborCosts(costData);
        
        const attendanceData = calculateAttendanceStats(shiftData, employeeData);
        setAttendanceStats(attendanceData);
        
        const handlingTimeData = calculateOrderHandlingTime(orderData, employeeData);
        setOrderHandlingTime(handlingTimeData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employee data:', error);
        setError('Failed to load employee data. Please try again.');
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
        <p className="mt-2">Loading employee data...</p>
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
      <h3>Employee Performance & Shift Analytics</h3>
      <p>Monitor employee productivity, track performance metrics, and optimize labor costs.</p>
      
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
      
      {/* Key Performance Indicators */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6>Total Employees</h6>
              <h2>{employees.length}</h2>
              <p className="text-muted mb-0">Active employees</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6>Labor Costs</h6>
              <h2>{formatCurrency(laborCosts.totalLaborCost || 0)}</h2>
              <p className="text-muted mb-0">For selected period</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6>Labor Cost %</h6>
              <h2>{laborCosts.laborCostPercentage ? laborCosts.laborCostPercentage.toFixed(1) : 0}%</h2>
              <p className="text-muted mb-0">Of total revenue</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6>Avg Table Turnover</h6>
              <h2>{tableTurnover.overallAverageTurnover ? Math.round(tableTurnover.overallAverageTurnover) : 0} min</h2>
              <p className="text-muted mb-0">Time to complete service</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Employee Sales Performance */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Employee Sales Performance</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Total Sales</th>
                <th>Avg Order Value</th>
                <th>Items Sold</th>
              </tr>
            </thead>
            <tbody>
              {salesPerformance
                .filter(emp => emp.totalOrders > 0)
                .sort((a, b) => b.totalSales - a.totalSales)
                .map(employee => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.totalOrders}</td>
                  <td>{formatCurrency(employee.totalSales)}</td>
                  <td>{formatCurrency(employee.averageOrderValue)}</td>
                  <td>{employee.itemsSold}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Table Turnover Rate */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Table Turnover Rate by Employee</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Tables Served</th>
                <th>Avg Turnover Time</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {tableTurnover.employeeStats &&
                tableTurnover.employeeStats
                  .filter(emp => emp.tablesServed > 0)
                  .sort((a, b) => a.averageTurnoverTime - b.averageTurnoverTime)
                  .map(employee => {
                    const avgTurnover = employee.averageTurnoverTime;
                    const overallAvg = tableTurnover.overallAverageTurnover || 1;
                    const performance = (overallAvg / avgTurnover) * 100; // Above 100% is better than average
                    
                    return (
                      <tr key={employee.id}>
                        <td>{employee.name}</td>
                        <td>{employee.tablesServed}</td>
                        <td>{Math.round(avgTurnover)} minutes</td>
                        <td>
                          <ProgressBar 
                            now={Math.min(performance, 150)}
                            variant={performance > 110 ? 'success' : performance >= 90 ? 'info' : 'warning'}
                            label={`${Math.round(performance)}%`}
                          />
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Labor Cost vs Revenue */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Labor Cost vs Revenue</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <h6>Regular Labor Cost</h6>
                  <h3>{formatCurrency(laborCosts.regularPayroll || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <h6>Overtime Labor Cost</h6>
                  <h3>{formatCurrency(laborCosts.overtimePayroll || 0)}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <h6>Labor Cost by Role</h6>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Role</th>
                <th>Employee Count</th>
                <th>Total Hours</th>
                <th>Total Cost</th>
                <th>% of Labor Cost</th>
              </tr>
            </thead>
            <tbody>
              {laborCosts.rolePayroll && laborCosts.rolePayroll.map(role => {
                const percentage = (role.totalCost / (laborCosts.totalLaborCost || 1)) * 100;
                
                return (
                  <tr key={role.role}>
                    <td>{role.role}</td>
                    <td>{role.employeeCount}</td>
                    <td>{role.totalHours.toFixed(1)}</td>
                    <td>{formatCurrency(role.totalCost)}</td>
                    <td>{percentage.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          
          <h6>Employee Sales to Cost Ratio</h6>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Total Sales</th>
                <th>Labor Cost</th>
                <th>Sales/Cost Ratio</th>
              </tr>
            </thead>
            <tbody>
              {laborCosts.employeeCosts &&
                laborCosts.employeeCosts
                  .filter(emp => emp.totalCost > 0)
                  .map(employee => {
                    const salesData = salesPerformance.find(e => e.id === employee.id) || { totalSales: 0 };
                    const ratio = salesData.totalSales / employee.totalCost;
                    
                    return (
                      <tr key={employee.id}>
                        <td>{employee.name}</td>
                        <td>{employee.role}</td>
                        <td>{formatCurrency(salesData.totalSales)}</td>
                        <td>{formatCurrency(employee.totalCost)}</td>
                        <td>
                          <Badge bg={ratio > 5 ? 'success' : ratio > 3 ? 'info' : 'warning'}>
                            {ratio.toFixed(1)}x
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Attendance & Punctuality */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Attendance & Punctuality</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Total Shifts</th>
                <th>Attendance Rate</th>
                <th>Punctuality Rate</th>
                <th>Avg Lateness</th>
              </tr>
            </thead>
            <tbody>
              {attendanceStats
                .filter(emp => emp.totalShifts > 0)
                .sort((a, b) => (b.attendanceRate + b.punctualityRate) - (a.attendanceRate + a.punctualityRate))
                .map(employee => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.totalShifts}</td>
                  <td>
                    <ProgressBar 
                      now={employee.attendanceRate} 
                      variant={employee.attendanceRate > 95 ? 'success' : employee.attendanceRate > 85 ? 'info' : 'warning'}
                      label={`${employee.attendanceRate.toFixed(0)}%`}
                    />
                  </td>
                  <td>
                    <ProgressBar 
                      now={employee.punctualityRate} 
                      variant={employee.punctualityRate > 95 ? 'success' : employee.punctualityRate > 85 ? 'info' : 'warning'}
                      label={`${employee.punctualityRate.toFixed(0)}%`}
                    />
                  </td>
                  <td>{employee.lateShifts > 0 ? `${employee.averageLateness.toFixed(0)} min` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Order Handling Time */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Order Handling Time</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Orders Handled</th>
                <th>Avg Preparation Time</th>
                <th>Avg Service Time</th>
                <th>Avg Total Time</th>
              </tr>
            </thead>
            <tbody>
              {orderHandlingTime
                .filter(emp => emp.totalOrders > 0)
                .sort((a, b) => a.averageTotalTime - b.averageTotalTime)
                .map(employee => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.totalOrders}</td>
                  <td>{Math.round(employee.averagePreparationTime)} min</td>
                  <td>{Math.round(employee.averageServiceTime)} min</td>
                  <td>{Math.round(employee.averageTotalTime)} min</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EmployeeAnalytics; 