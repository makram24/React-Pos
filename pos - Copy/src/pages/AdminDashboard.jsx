import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Nav, Alert, Spinner, Modal } from 'react-bootstrap';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../constants/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const AdminDashboard = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expenses');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Expenses states
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    vendor: '',
    notes: '',
    isRecurring: false
  });
  const [expenseCategories, setExpenseCategories] = useState([
    'Rent', 'Utilities', 'Ingredients', 'Salaries', 'Marketing', 
    'Maintenance', 'Insurance', 'Equipment', 'Cleaning', 
    'Office Supplies', 'Licenses', 'Other'
  ]);

  // Users states
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Staff',
    isActive: true
  });
  const [userRoles] = useState(['Admin', 'Manager', 'Chef', 'Cashier', 'Waiter', 'Staff']);
  const [userModalShow, setUserModalShow] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Settings states
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Restaurant POS',
      currency: 'USD',
      taxRate: 8.5,
      allowGuestCheckout: false,
      requireTableNumber: true,
      showLowStockAlerts: true
    },
    orders: {
      allowCustomTips: true,
      requireServerAssignment: true,
      printReceiptsAutomatically: false,
      showCookingTimeEstimates: true,
      allowOrderModifications: true,
      trackOrderHistory: true
    },
    inventory: {
      enableLowStockAlerts: true,
      trackInventoryAutomatically: true,
      allowNegativeInventory: false,
      showCostAnalysis: true,
      enableSupplierManagement: true,
      trackWasteManagement: true
    },
    analytics: {
      trackSalesData: true,
      enableCustomerAnalytics: true,
      showFinancialReports: true,
      enableInventoryReports: true,
      showEmployeePerformance: true,
      enableRealtimeDashboard: true
    },
    security: {
      requirePasswordReset: false,
      enforceStrongPasswords: true,
      enableTwoFactorAuth: false,
      restrictIPAccess: false,
      logFailedLoginAttempts: true,
      autoLogoutAfterInactivity: true
    }
  });

  // Check if user is admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Admin') {
      navigate('/');
      return;
    }

    // Fetch expenses
    fetchExpenses();
    
    // Fetch users
    fetchUsers();
    
    // Fetch settings
    fetchSettings();
  }, [currentUser, navigate]);

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const expensesRef = collection(db, 'expenses');
      const querySnapshot = await getDocs(expensesRef);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString().split('T')[0] : ''
      }));
      setExpenses(expensesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setMessage({ type: 'danger', text: 'Error fetching expenses: ' + error.message });
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'danger', text: 'Error fetching users: ' + error.message });
      setLoading(false);
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const settingsRef = collection(db, 'settings');
      const querySnapshot = await getDocs(settingsRef);
      
      if (!querySnapshot.empty) {
        // If settings exist, use them
        const settingsDoc = querySnapshot.docs[0];
        setSettings({ id: settingsDoc.id, ...settingsDoc.data() });
      } else {
        // If no settings exist, create default settings
        await addDoc(collection(db, 'settings'), settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'danger', text: 'Error fetching settings: ' + error.message });
    }
  };

  // Handle expense input change
  const handleExpenseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExpense({
      ...newExpense,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create expense object
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: Timestamp.fromDate(new Date(newExpense.date)),
        createdAt: Timestamp.now(),
        createdBy: currentUser.uid
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'expenses'), expenseData);
      
      // Reset form and refresh list
      setNewExpense({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        vendor: '',
        notes: '',
        isRecurring: false
      });
      
      setMessage({ type: 'success', text: 'Expense added successfully!' });
      fetchExpenses();
      setLoading(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      setMessage({ type: 'danger', text: 'Error adding expense: ' + error.message });
      setLoading(false);
    }
  };

  // Handle user input change
  const handleUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        newUser.password
      );
      
      // Create user document in Firestore
      const userData = {
        uid: userCredential.user.uid,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: Timestamp.now(),
        createdBy: currentUser.uid
      };
      
      await addDoc(collection(db, 'users'), userData);
      
      // Reset form and refresh list
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'Staff',
        isActive: true
      });
      
      setMessage({ type: 'success', text: 'User added successfully!' });
      fetchUsers();
      setLoading(false);
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage({ type: 'danger', text: 'Error adding user: ' + error.message });
      setLoading(false);
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserModalShow(true);
  };

  // Update user
  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      
      // Update user document in Firestore
      await updateDoc(doc(db, 'users', selectedUser.id), {
        name: selectedUser.name,
        role: selectedUser.role,
        isActive: selectedUser.isActive,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid
      });
      
      setMessage({ type: 'success', text: 'User updated successfully!' });
      setUserModalShow(false);
      fetchUsers();
      setLoading(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'danger', text: 'Error updating user: ' + error.message });
      setLoading(false);
    }
  };

  // Handle settings change
  const handleSettingChange = (category, setting, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [category]: {
        ...prevSettings[category],
        [setting]: value
      }
    }));
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      if (settings.id) {
        // Update existing settings
        await updateDoc(doc(db, 'settings', settings.id), settings);
      } else {
        // Create new settings
        await addDoc(collection(db, 'settings'), settings);
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setLoading(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'danger', text: 'Error saving settings: ' + error.message });
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Admin Dashboard</h1>
        <Button 
          variant="outline-danger" 
          size="sm"
          onClick={() => {
            signOut();
            navigate('/');
          }}
          className="d-flex align-items-center"
        >
          <FiLogOut className="me-1" /> Sign Out
        </Button>
      </div>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}
      
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'expenses'} 
            onClick={() => setActiveTab('expenses')}
          >
            Expenses Management
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
          >
            User Management
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          >
            System Settings
          </Nav.Link>
        </Nav.Item>
      </Nav>
      
      {activeTab === 'expenses' && (
        <Row>
          <Col md={5}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Add New Expense</h4>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleAddExpense}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      type="text"
                      name="description"
                      value={newExpense.description}
                      onChange={handleExpenseChange}
                      required
                    />
                  </Form.Group>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Amount</Form.Label>
                        <Form.Control
                          type="number"
                          name="amount"
                          value={newExpense.amount}
                          onChange={handleExpenseChange}
                          step="0.01"
                          min="0"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="date"
                          value={newExpense.date}
                          onChange={handleExpenseChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={newExpense.category}
                          onChange={handleExpenseChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {expenseCategories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                          name="paymentMethod"
                          value={newExpense.paymentMethod}
                          onChange={handleExpenseChange}
                          required
                        >
                          <option value="Cash">Cash</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Check">Check</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Vendor</Form.Label>
                    <Form.Control
                      type="text"
                      name="vendor"
                      value={newExpense.vendor}
                      onChange={handleExpenseChange}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={newExpense.notes}
                      onChange={handleExpenseChange}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Is Recurring Expense"
                      name="isRecurring"
                      checked={newExpense.isRecurring}
                      onChange={handleExpenseChange}
                    />
                  </Form.Group>
                  
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Add Expense'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={7}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Recent Expenses</h4>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Recurring</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3">No expenses found.</td>
                          </tr>
                        ) : (
                          expenses.map(expense => (
                            <tr key={expense.id}>
                              <td>{expense.description}</td>
                              <td>{expense.category}</td>
                              <td>${expense.amount?.toFixed(2)}</td>
                              <td>{expense.date}</td>
                              <td>{expense.isRecurring ? 'Yes' : 'No'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {activeTab === 'users' && (
        <Row>
          <Col md={5}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Add New User</h4>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleAddUser}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={newUser.name}
                      onChange={handleUserChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleUserChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleUserChange}
                      required
                      minLength={6}
                    />
                    <Form.Text className="text-muted">
                      Password must be at least 6 characters long.
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      name="role"
                      value={newUser.role}
                      onChange={handleUserChange}
                      required
                    >
                      {userRoles.map((role, index) => (
                        <option key={index} value={role}>{role}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Active Account"
                      name="isActive"
                      checked={newUser.isActive}
                      onChange={handleUserChange}
                    />
                  </Form.Group>
                  
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Add User'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={7}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">User Accounts</h4>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3">No users found.</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.id}>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.role}</td>
                              <td>
                                <span className={`badge bg-${user.isActive ? 'success' : 'danger'}`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          {/* User Edit Modal */}
          <Modal show={userModalShow} onHide={() => setUserModalShow(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Edit User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedUser && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedUser.name}
                      onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={selectedUser.email}
                      disabled
                    />
                    <Form.Text className="text-muted">
                      Email cannot be changed
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                    >
                      {userRoles.map((role, index) => (
                        <option key={index} value={role}>{role}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Active Account"
                      checked={selectedUser.isActive}
                      onChange={(e) => setSelectedUser({...selectedUser, isActive: e.target.checked})}
                    />
                  </Form.Group>
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setUserModalShow(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateUser} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Modal>
        </Row>
      )}
      
      {activeTab === 'settings' && (
        <Row>
          <Col md={12}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">System Settings</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.entries(settings).filter(([key]) => key !== 'id').map(([category, categorySettings]) => (
                    <Col md={6} key={category} className="mb-4">
                      <Card>
                        <Card.Header className="bg-light">
                          <h5 className="mb-0 text-capitalize">{category} Settings</h5>
                        </Card.Header>
                        <Card.Body>
                          {Object.entries(categorySettings).map(([setting, value]) => (
                            <Form.Group key={setting} className="mb-3">
                              <Form.Check
                                type="switch"
                                id={`${category}-${setting}`}
                                label={setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                checked={value}
                                onChange={(e) => handleSettingChange(category, setting, e.target.checked)}
                              />
                            </Form.Group>
                          ))}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                
                <div className="d-flex justify-content-center mt-3">
                  <Button 
                    variant="success" 
                    size="lg" 
                    onClick={handleSaveSettings}
                    disabled={loading}
                  >
                    {loading ? <Spinner animation="border" size="sm" /> : 'Save All Settings'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default AdminDashboard; 