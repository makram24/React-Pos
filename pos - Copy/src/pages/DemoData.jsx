import React, { useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert, Card, ProgressBar, ListGroup } from 'react-bootstrap';
import { 
  generateAllAnalyticsData,
  generateInventoryItemsData,
  generateMenuItemsData, 
  generateEmployeesData,
  generateOrdersData,
  generateEmployeeShiftsData,
  generateInventoryUsageData,
  generateCustomerFeedbackData,
  generateExpenseData,
  generateWasteData,
  generateSupplierRecords
} from '../utils/analyticsDataGenerator';

const DemoData = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedItems, setGeneratedItems] = useState([]);

  // Sample categories data
  const sampleCategories = [
    { id: 1, name: 'Main Course' },
    { id: 2, name: 'Appetizers' },
    { id: 3, name: 'Desserts' },
    { id: 4, name: 'Beverages' },
    { id: 5, name: 'Side Dishes' }
  ];

  // Sample inventory data
  const sampleInventory = [
    { name: 'Rice', quantity: 50, unit: 'kg' },
    { name: 'Chicken', quantity: 30, unit: 'kg' },
    { name: 'Tomatoes', quantity: 20, unit: 'kg' },
    { name: 'Onions', quantity: 25, unit: 'kg' },
    { name: 'Cooking Oil', quantity: 40, unit: 'L' },
    { name: 'Spices', quantity: 15, unit: 'kg' },
    { name: 'Flour', quantity: 35, unit: 'kg' },
    { name: 'Sugar', quantity: 20, unit: 'kg' },
    { name: 'Milk', quantity: 30, unit: 'L' },
    { name: 'Eggs', quantity: 100, unit: 'pcs' }
  ];

  // Sample dishes data with categories
  const sampleDishes = [
    {
      name: 'Chicken Curry',
      description: 'Spicy chicken curry with rice',
      price: 12.99,
      categoryId: 1, // Main Course
      ingredients: [
        { name: 'Chicken', quantity: 0.3, unit: 'kg' },
        { name: 'Rice', quantity: 0.2, unit: 'kg' },
        { name: 'Spices', quantity: 0.05, unit: 'kg' },
        { name: 'Cooking Oil', quantity: 0.1, unit: 'L' }
      ]
    },
    {
      name: 'Spring Rolls',
      description: 'Crispy vegetable spring rolls',
      price: 6.99,
      categoryId: 2, // Appetizers
      ingredients: [
        { name: 'Flour', quantity: 0.1, unit: 'kg' },
        { name: 'Cooking Oil', quantity: 0.2, unit: 'L' },
        { name: 'Vegetables', quantity: 0.15, unit: 'kg' }
      ]
    },
    {
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake with frosting',
      price: 8.99,
      categoryId: 3, // Desserts
      ingredients: [
        { name: 'Flour', quantity: 0.25, unit: 'kg' },
        { name: 'Sugar', quantity: 0.2, unit: 'kg' },
        { name: 'Eggs', quantity: 4, unit: 'pcs' },
        { name: 'Milk', quantity: 0.2, unit: 'L' }
      ]
    },
    {
      name: ' 7up',
      description: 'Rich chocolate cake with frosting',
      price: 8.99,
      categoryId: 3,
    },
    {
      name: 'Pepsi',
      description: 'Rich chocolate cake with frosting',
      price: 8.99,
      categoryId: 3
    }
    ,
    {
      name: 'Coca Cola',
      description: 'Rich chocolate cake with frosting',
      price: 8.99,
      categoryId: 3
    }
  ];

  // Check user authorization
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== 'Admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Function to clear existing data
  const clearExistingData = async (collectionName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setMessage({ type: 'success', text: `Existing ${collectionName} data cleared successfully` });
    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
      setMessage({ type: 'danger', text: `Error clearing ${collectionName} data` });
    }
  };

  // Function to insert categories demo data
  const insertCategoriesDemoData = async () => {
    try {
      await clearExistingData('Categories');
      const categoriesRef = collection(db, 'Categories');
      const addPromises = sampleCategories.map(category => addDoc(categoriesRef, category));
      await Promise.all(addPromises);
      setMessage({ type: 'success', text: 'Demo categories data inserted successfully' });
    } catch (error) {
      console.error('Error inserting categories demo data:', error);
      setMessage({ type: 'danger', text: 'Error inserting categories demo data' });
    }
  };

  // Function to insert inventory demo data
  const insertInventoryDemoData = async () => {
    try {
      await clearExistingData('inventory');
      const inventoryRef = collection(db, 'inventory');
      const addPromises = sampleInventory.map(item => addDoc(inventoryRef, item));
      await Promise.all(addPromises);
      setMessage({ type: 'success', text: 'Demo inventory data inserted successfully' });
    } catch (error) {
      console.error('Error inserting inventory demo data:', error);
      setMessage({ type: 'danger', text: 'Error inserting inventory demo data' });
    }
  };

  // Function to insert dishes demo data
  const insertDishesDemoData = async () => {
    try {
      await clearExistingData('items');
      
      // First, get the inventory items to link them with dishes
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const inventoryItems = {};
      inventorySnapshot.docs.forEach(doc => {
        const data = doc.data();
        inventoryItems[data.name] = { id: doc.id, ...data };
      });

      // Create dishes with linked inventory items
      const dishesRef = collection(db, 'items');
      const dishPromises = sampleDishes.map(dish => {
        const dishData = {
          name: dish.name,
          description: dish.description,
          price: dish.price,
          categoryId: dish.categoryId,
          ingredients:  dish.ingredients ? dish.ingredients.map(ing => ({
            itemId: inventoryItems[ing.name]?.id || '',
            itemName: ing.name,
            quantity: ing.quantity,
            unit: ing.unit
          })) : [],
          createdAt: new Date().toISOString()
        };
        return addDoc(dishesRef, dishData);
      });

      await Promise.all(dishPromises);
      setMessage({ type: 'success', text: 'Demo dishes data inserted successfully' });
    } catch (error) {
      console.error('Error inserting dishes demo data:', error);
      setMessage({ type: 'danger', text: 'Error inserting dishes demo data' });
    }
  };

  // Function to insert all basic demo data
  const insertAllBasicDemoData = async () => {
    try {
      await insertCategoriesDemoData();
      await insertInventoryDemoData();
      await insertDishesDemoData();
      setMessage({ type: 'success', text: 'All basic demo data inserted successfully' });
    } catch (error) {
      console.error('Error inserting basic demo data:', error);
      setMessage({ type: 'danger', text: 'Error inserting basic demo data' });
    }
  };

  // Function to generate analytics data
  const generateAllData = async () => {
    try {
      setLoading(true);
      setProgress(0);
      setGeneratedItems([]);
      setMessage({ type: 'info', text: 'Generating data... This may take a few minutes.' });
      
      // First, ensure categories exist
      await insertCategoriesDemoData();
      setProgress(10);
      updateGeneratedItems('Categories', sampleCategories.length);
      
      // Generate inventory items
      const inventoryItems = await generateInventoryItemsData(30);
      setProgress(20);
      updateGeneratedItems('Inventory Items', inventoryItems.length);
      
      // Generate menu items
      const menuItems = await generateMenuItemsData(20);
      setProgress(30);
      updateGeneratedItems('Menu Items', menuItems.length);
      
      // Generate employees
      const employees = await generateEmployeesData(15);
      setProgress(40);
      updateGeneratedItems('Employees', employees.length);
      
      // Generate orders
      const orders = await generateOrdersData(200);
      setProgress(50);
      updateGeneratedItems('Orders', orders.length);
      
      // Generate employee shifts
      const shifts = await generateEmployeeShiftsData(150);
      setProgress(60);
      updateGeneratedItems('Employee Shifts', shifts.length);
      
      // Generate inventory usage
      const inventoryUsage = await generateInventoryUsageData(200);
      setProgress(70);
      updateGeneratedItems('Inventory Usage', inventoryUsage.length);
      
      // Generate customer feedback
      const feedback = await generateCustomerFeedbackData(100);
      setProgress(75);
      updateGeneratedItems('Customer Feedback', feedback.length);
      
      // Generate expenses
      const expenses = await generateExpenseData(100);
      setProgress(80);
      updateGeneratedItems('Expenses', expenses.length);
      
      // Generate waste records
      const waste = await generateWasteData(50);
      setProgress(90);
      updateGeneratedItems('Waste Records', waste.length);
      
      // Generate supplier records
      const suppliers = await generateSupplierRecords(50);
      setProgress(100);
      updateGeneratedItems('Supplier Records', suppliers.length);
      
      setMessage({ 
        type: 'success', 
        text: 'All analytics demo data generated successfully! You can now use the analytics components with this data.'
      });
      setLoading(false);
    } catch (error) {
      console.error('Error generating analytics data:', error);
      setMessage({ type: 'danger', text: `Error generating analytics data: ${error.message}` });
      setLoading(false);
    }
  };
  
  // Helper function to update generated items
  const updateGeneratedItems = (itemType, count) => {
    setGeneratedItems(prev => [...prev, { type: itemType, count }]);
  };

  if (!currentUser) return null;

  return (
    <Container className="py-5">
      <h1 className="mb-4">Demo Data Management</h1>
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}
      
      <Row className="mb-5">
        <Col md={6}>
          <div className="p-4 border rounded">
            <h3>Categories Demo Data</h3>
            <p>Insert sample categories including:</p>
            <ul>
              {sampleCategories.map((category, index) => (
                <li key={index}>ID: {category.id} - {category.name}</li>
              ))}
            </ul>
            <Button 
              variant="primary" 
              onClick={insertCategoriesDemoData}
              className="mt-3"
              disabled={loading}
            >
              Insert Categories Demo Data
            </Button>
          </div>
        </Col>

        <Col md={6}>
          <div className="p-4 border rounded">
            <h3>Inventory Demo Data</h3>
            <p>Insert sample inventory items including:</p>
            <ul>
              {sampleInventory.slice(0, 5).map((item, index) => (
                <li key={index}>{item.name} - {item.quantity} {item.unit}</li>
              ))}
              <li>... and more</li>
            </ul>
            <Button 
              variant="primary" 
              onClick={insertInventoryDemoData}
              className="mt-3"
              disabled={loading}
            >
              Insert Inventory Demo Data
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col md={12}>
          <div className="p-4 border rounded">
            <h3>Dishes Demo Data</h3>
            <p>Insert sample dishes including:</p>
            <Row>
              {sampleDishes.map((dish, index) => (
                <Col md={4} key={index}>
                  <div className="mb-3">
                    <strong>{dish.name}</strong> (Category ID: {dish.categoryId})
                    <br />
                    Price: ${dish.price}
                    {dish.ingredients && (
                      <small className="d-block text-muted">
                        {dish.ingredients.length} ingredients
                      </small>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
            <Button 
              variant="primary" 
              onClick={insertDishesDemoData}
              className="mt-3"
              disabled={loading}
            >
              Insert Dishes Demo Data
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col md={12}>
          <Card className="p-0 shadow-sm">
            <Card.Header as="h3" className="bg-primary text-white">
              Analytics Demo Data Generator
            </Card.Header>
            <Card.Body>
              <p>Generate comprehensive demo data for the analytics components, including:</p>
              <Row>
                <Col md={6}>
                  <ListGroup variant="flush">
                    <ListGroup.Item>30 Inventory Items with detailed attributes</ListGroup.Item>
                    <ListGroup.Item>20 Menu Items with ingredient relationships</ListGroup.Item>
                    <ListGroup.Item>15 Employees with roles and pay rates</ListGroup.Item>
                    <ListGroup.Item>200 Orders with items, payment details, and server assignments</ListGroup.Item>
                    <ListGroup.Item>150 Employee Shifts with hours worked and pay calculations</ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <ListGroup variant="flush">
                    <ListGroup.Item>200 Inventory Usage records tracking consumption</ListGroup.Item>
                    <ListGroup.Item>100 Customer Feedback records with ratings and comments</ListGroup.Item>
                    <ListGroup.Item>100 Expense records across various categories</ListGroup.Item>
                    <ListGroup.Item>50 Food Waste records with reasons and costs</ListGroup.Item>
                    <ListGroup.Item>50 Supplier delivery records with performance metrics</ListGroup.Item>
                  </ListGroup>
                </Col>
              </Row>
              
              {loading && (
                <div className="my-4">
                  <ProgressBar 
                    now={progress} 
                    label={`${progress}%`} 
                    variant="info" 
                    animated 
                    className="mb-3" 
                  />
                  <p className="text-center">Generating demo data... This may take a few minutes.</p>
                </div>
              )}
              
              {generatedItems.length > 0 && (
                <div className="mt-4">
                  <h5>Generated Items:</h5>
                  <div className="border p-3 bg-light rounded">
                    <Row>
                      {generatedItems.map((item, index) => (
                        <Col md={4} key={index}>
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2">✓</span>
                            <strong>{item.type}:</strong> {item.count} records
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </div>
              )}
              
              <div className="d-grid gap-2 col-md-6 mx-auto mt-4">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={generateAllData}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate All Analytics Demo Data'}
                </Button>
                <p className="text-muted text-center mt-2">
                  <strong>Note:</strong> This process may take several minutes as it creates
                  hundreds of records with complex relationships.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12} className="text-center">
          <Button 
            variant="outline-primary" 
            size="lg"
            onClick={insertAllBasicDemoData}
            className="mt-3"
            disabled={loading}
          >
            Insert Basic Demo Data Only
          </Button>
          <p className="text-muted mt-2">
            This will only insert categories, inventory, and menu items without analytics data.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default DemoData; 