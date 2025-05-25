import React, { useState } from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import SalesAnalytics from './SalesAnalytics';
import InventoryAnalytics from './InventoryAnalytics';
import CustomerAnalytics from './CustomerAnalytics';
import EmployeeAnalytics from './EmployeeAnalytics';
import FinancialAnalytics from './FinancialAnalytics';
import DashboardAnalytics from './DashboardAnalytics';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardAnalytics />;
      case 'sales':
        return <SalesAnalytics />;
      case 'inventory':
        return <InventoryAnalytics />;
      case 'customers':
        return <CustomerAnalytics />;
      case 'employees':
        return <EmployeeAnalytics />;
      case 'financial':
        return <FinancialAnalytics />;
      default:
        return <DashboardAnalytics />;
    }
  };

  return (
    <Container fluid className="p-3">
      <Row>
        <Col>
          <h2 className="mb-4">Restaurant Analytics</h2>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col>
          <Nav variant="tabs" className="analytics-tabs">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'dashboard'} 
                onClick={() => handleTabChange('dashboard')}
              >
                Dashboard
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'sales'} 
                onClick={() => handleTabChange('sales')}
              >
                Sales
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'inventory'} 
                onClick={() => handleTabChange('inventory')}
              >
                Inventory
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'customers'} 
                onClick={() => handleTabChange('customers')}
              >
                Customers
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'employees'} 
                onClick={() => handleTabChange('employees')}
              >
                Employees
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'financial'} 
                onClick={() => handleTabChange('financial')}
              >
                Financial
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>
      <Row>
        <Col>
          {renderTabContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics; 