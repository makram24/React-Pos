import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Table, Alert } from 'react-bootstrap';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Ingredient types and their buffer rates
const INGREDIENT_TYPES = {
  HIGHLY_PERISHABLE: {
    name: 'Highly Perishable',
    buffer: 0.15, // 15% buffer
    examples: 'vegetables, dairy, fresh meat, seafood',
    minBuffer: 10,
    maxBuffer: 15
  },
  DRY_GOODS: {
    name: 'Dry Goods',
    buffer: 0.10, // 10% buffer
    examples: 'rice, pasta, flour, spices',
    minBuffer: 5,
    maxBuffer: 10
  },
  PACKAGED_FROZEN: {
    name: 'Packaged & Frozen',
    buffer: 0.05, // 5% buffer
    examples: 'frozen chicken, canned goods, sauces',
    minBuffer: 5,
    maxBuffer: 5
  },
  BEVERAGES_CONDIMENTS: {
    name: 'Beverages & Condiments',
    buffer: 0.05, // 5% buffer
    examples: 'drinks, sauces, condiments',
    minBuffer: 3,
    maxBuffer: 5
  }
};

const InventoryManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddDish, setShowAddDish] = useState(false);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [showUpdateInventory, setShowUpdateInventory] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  // New inventory form state
  const [newInventory, setNewInventory] = useState({
    name: '',
    quantity: '',
    unit: '',
    type: ''
  });

  // New dish form state
  const [newDish, setNewDish] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    ingredients: [{ itemId: '', quantity: '', unit: '' }]
  });

  // Calculate buffer quantity for an inventory item
  const calculateBuffer = (quantity, type) => {
    const typeInfo = INGREDIENT_TYPES[type];
    if (!typeInfo) return 0;
    return quantity * typeInfo.buffer;
  };

  // Calculate recommended reorder point
  const calculateReorderPoint = (item) => {
    if (!item.type || !INGREDIENT_TYPES[item.type]) return 0;
    const buffer = calculateBuffer(item.quantity, item.type);
    return item.quantity - buffer;
  };

  // Check user authorization
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Manager')) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch inventory, dishes, and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inventory
        const inventorySnapshot = await getDocs(collection(db, 'inventory'));
        const inventoryData = inventorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(inventoryData);

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'Categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);

        // Fetch dishes
        const dishesSnapshot = await getDocs(collection(db, 'items'));
        const dishesData = dishesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDishes(dishesData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'danger', text: 'Error loading data' });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle inventory creation
  const handleCreateInventory = async (e) => {
    e.preventDefault();
    try {
      const newInventoryData = {
        name: newInventory.name,
        quantity: parseFloat(newInventory.quantity),
        unit: newInventory.unit,
        type: newInventory.type,
        buffer: calculateBuffer(parseFloat(newInventory.quantity), newInventory.type),
        createdAt: new Date().toISOString(),
        createdBy: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        },
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        },
        history: [{
          action: 'created',
          quantity: parseFloat(newInventory.quantity),
          timestamp: new Date().toISOString(),
          user: {
            id: currentUser.uid,
            name: currentUser.name,
            role: currentUser.role
          }
        }]
      };

      await addDoc(collection(db, 'inventory'), newInventoryData);
      
      setNewInventory({
        name: '',
        quantity: '',
        unit: '',
        type: ''
      });
      setShowAddInventory(false);
      setMessage({ type: 'success', text: 'Inventory Item created successfully' });

      const refreshedInventorySnapshot = await getDocs(collection(db, 'inventory'));
      const refreshedInventoryData = refreshedInventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(refreshedInventoryData);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      setMessage({ type: 'danger', text: 'Error creating inventory item' });
    }
  };

  // Handle inventory update
  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    try {
      const newQuantity = parseFloat(newInventory.quantity);
      const updateData = {
        quantity: newQuantity,
        buffer: calculateBuffer(newQuantity, selectedInventory.type),
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        }
      };

      const historyEntry = {
        action: 'updated',
        quantity: newQuantity,
        previousQuantity: selectedInventory.quantity,
        timestamp: new Date().toISOString(),
        user: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        }
      };

      const inventoryRef = doc(db, 'inventory', selectedInventory.id);
      await updateDoc(inventoryRef, {
        ...updateData,
        history: [...(selectedInventory.history || []), historyEntry]
      });

      setNewInventory({
        name: '',
        quantity: '',
        unit: '',
        type: ''
      });
      setSelectedInventory(null);
      setShowUpdateInventory(false);
      setMessage({ type: 'success', text: 'Inventory quantity updated successfully' });

      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const inventoryData = inventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error updating inventory:', error);
      setMessage({ type: 'danger', text: 'Error updating inventory' });
    }
  };

  // Handle opening update modal
  const handleShowUpdateModal = (item) => {
    setSelectedInventory(item);
    setNewInventory({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      type: item.type
    });
    setShowUpdateInventory(true);
  };

  // Add new ingredient field
  const addIngredient = () => {
    setNewDish(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { itemId: '', quantity: '', unit: '' }]
    }));
  };

  // Remove ingredient field
  const removeIngredient = (index) => {
    setNewDish(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Update ingredient field
  const updateIngredient = (index, field, value) => {
    setNewDish(prev => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: value
      };
      if (field === 'itemId') {
        const selectedItem = inventory.find(item => item.id === value);
        if (selectedItem) {
          newIngredients[index].unit = selectedItem.unit;
        }
      }
      return {
        ...prev,
        ingredients: newIngredients
      };
    });
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Handle dish creation
  const handleCreateDish = async (e) => {
    e.preventDefault();
    try {
      // Validate ingredients and category
      const validIngredients = newDish.ingredients.every(ing => 
        ing.itemId && ing.quantity && parseFloat(ing.quantity) > 0
      );

      if (!validIngredients || !newDish.categoryId) {
        setMessage({ type: 'danger', text: 'Please fill all fields correctly including category and ingredients' });
        return;
      }

      // Create new dish document
      const dishData = {
        name: newDish.name,
        description: newDish.description,
        price: parseFloat(newDish.price),
        categoryId: parseInt(newDish.categoryId),
        ingredients: newDish.ingredients.map(ing => ({
          itemId: ing.itemId,
          itemName: inventory.find(item => item.id === ing.itemId)?.name || '',
          quantity: parseFloat(ing.quantity),
          unit: ing.unit
        })),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'items'), dishData);
      
      // Reset form and close modal
      setNewDish({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        ingredients: [{ itemId: '', quantity: '', unit: '' }]
      });
      setShowAddDish(false);
      setMessage({ type: 'success', text: 'Item created successfully' });

      // Refresh dishes list
      const dishesSnapshot = await getDocs(collection(db, 'items'));
      const dishesData = dishesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDishes(dishesData);
    } catch (error) {
      console.error('Error creating dish:', error);
      setMessage({ type: 'danger', text: 'Error creating dish' });
    }
  };

  if (loading) {
    return <Container className="py-5"><div>Loading...</div></Container>;
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Inventory Management</h1>
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Current Inventory</h3>
              <Button variant="primary" onClick={() => setShowAddInventory(true)}>
                Add New Item
              </Button>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Buffer</th>
                    <th>Reorder Point</th>
                    <th>Unit</th>
                    <th>Last Updated</th>
                    <th>Updated By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const buffer = item.buffer || calculateBuffer(item.quantity, item.type);
                    const reorderPoint = calculateReorderPoint(item);
                    const isLow = item.quantity <= reorderPoint;

                    return (
                      <tr key={item.id} className={isLow ? 'table-warning' : ''}>
                        <td>{item.name}</td>
                        <td>{INGREDIENT_TYPES[item.type]?.name || 'Not specified'}</td>
                        <td>{item.quantity}</td>
                        <td>{buffer.toFixed(2)} ({INGREDIENT_TYPES[item.type]?.minBuffer}-{INGREDIENT_TYPES[item.type]?.maxBuffer}%)</td>
                        <td>{reorderPoint.toFixed(2)}</td>
                        <td>{item.unit}</td>
                        <td>{new Date(item.lastUpdatedAt).toLocaleString()}</td>
                        <td>{item.lastUpdatedBy?.name} ({item.lastUpdatedBy?.role})</td>
                        <td>
                          <Button 
                            variant={isLow ? "warning" : "outline-primary"}
                            size="sm"
                            onClick={() => handleShowUpdateModal(item)}
                          >
                            Update Quantity
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Items</h3>
              <Button variant="primary" onClick={() => setShowAddDish(true)}>
                Create New Item
              </Button>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Ingredients</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes?.map(dish => (
                    <tr key={dish.id}>
                      <td>{dish.name}</td>
                      <td>{getCategoryName(dish.categoryId)}</td>
                      <td>{dish.description}</td>
                      <td>${dish.price}</td>
                      <td>
                        <ul className="mb-0">
                          {dish.ingredients.map((ing, idx) => (
                            <li key={idx}>
                              {ing.itemName}: {ing.quantity} {ing.unit}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Inventory Modal */}
      <Modal show={showAddInventory} onHide={() => setShowAddInventory(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Inventory Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateInventory}>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.name}
                onChange={(e) => setNewInventory(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Item Type</Form.Label>
              <Form.Select
                value={newInventory.type}
                onChange={(e) => setNewInventory(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                <option value="">Select type</option>
                {Object.entries(INGREDIENT_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.name} ({type.examples}) - Buffer: {type.minBuffer}-{type.maxBuffer}%
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={newInventory.quantity}
                onChange={(e) => setNewInventory(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Unit</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.unit}
                onChange={(e) => setNewInventory(prev => ({ ...prev, unit: e.target.value }))}
                required
              />
            </Form.Group>

            {newInventory.quantity && newInventory.type && (
              <Alert variant="info">
                Buffer Quantity: {calculateBuffer(parseFloat(newInventory.quantity), newInventory.type).toFixed(2)} {newInventory.unit}
                <br />
                Reorder Point: {(parseFloat(newInventory.quantity) - calculateBuffer(parseFloat(newInventory.quantity), newInventory.type)).toFixed(2)} {newInventory.unit}
              </Alert>
            )}

            <Button variant="primary" type="submit">
              Create Item
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Update Inventory Modal */}
      <Modal show={showUpdateInventory} onHide={() => setShowUpdateInventory(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Inventory Quantity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateInventory}>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.name}
                disabled
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Quantity</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={newInventory.quantity}
                onChange={(e) => setNewInventory(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Unit</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.unit}
                disabled
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Update Quantity
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Dish Modal */}
      <Modal show={showAddDish} onHide={() => setShowAddDish(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateDish}>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={newDish.name}
                onChange={(e) => setNewDish(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={newDish.categoryId}
                onChange={(e) => setNewDish(prev => ({ ...prev, categoryId: e.target.value }))}
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newDish.description}
                onChange={(e) => setNewDish(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={newDish.price}
                onChange={(e) => setNewDish(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </Form.Group>

            <h5 className="mt-4">Ingredients</h5>
            {newDish.ingredients.map((ingredient, index) => (
              <Row key={index} className="mb-3 align-items-end">
                <Col md={5}>
                  <Form.Label>Ingredient</Form.Label>
                  <Form.Select
                    value={ingredient.itemId}
                    onChange={(e) => updateIngredient(index, 'itemId', e.target.value)}
                    required
                  >
                    <option value="">Select ingredient</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit})
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    required
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Unit</Form.Label>
                  <Form.Control
                    type="text"
                    value={ingredient.unit}
                    disabled
                  />
                </Col>
                <Col md={2}>
                  <Button
                    variant="danger"
                    onClick={() => removeIngredient(index)}
                    disabled={index === 0 && newDish.ingredients.length === 1}
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}

            <Button variant="secondary" onClick={addIngredient} className="mt-2">
              Add Ingredient
            </Button>

            <div className="mt-4">
              <Button variant="primary" type="submit">
                Create Item
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default InventoryManagement; 