import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Tab } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SalesAnalytics from '../components/analytics/SalesAnalytics';
import InventoryAnalytics from '../components/analytics/InventoryAnalytics';
import CustomerAnalytics from '../components/analytics/CustomerAnalytics';
import EmployeeAnalytics from '../components/analytics/EmployeeAnalytics';
import FinancialAnalytics from '../components/analytics/FinancialAnalytics';
import DashboardAnalytics from '../components/analytics/DashboardAnalytics';

const Analytics = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [key, setKey] = useState('sales');

  // Check if user is authorized
  React.useEffect(() => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Manager')) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Restaurant Analytics Dashboard</h2>
      
      <Tab.Container id="analytics-tabs" activeKey={key} onSelect={(k) => setKey(k)}>
        <Row>
          <Col md={3}>
            <Card className="mb-4">
              <Card.Header>Analytics Categories</Card.Header>
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="sales">Sales Analytics</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="inventory">Inventory & Waste Management</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="customers">Customer & Loyalty</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="employees">Employee Performance</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="financial">Financial & Expense</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="dashboard">Real-Time Dashboard</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={9}>
            <Card>
              <Card.Body>
                <Tab.Content>
                  <Tab.Pane eventKey="sales">
                    <SalesAnalytics />
                  </Tab.Pane>
                  <Tab.Pane eventKey="inventory">
                    <InventoryAnalytics />
                  </Tab.Pane>
                  <Tab.Pane eventKey="customers">
                    <CustomerAnalytics />
                  </Tab.Pane>
                  <Tab.Pane eventKey="employees">
                    <EmployeeAnalytics />
                  </Tab.Pane>
                  <Tab.Pane eventKey="financial">
                    <FinancialAnalytics />
                  </Tab.Pane>
                  <Tab.Pane eventKey="dashboard">
                    <DashboardAnalytics />
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default Analytics; 