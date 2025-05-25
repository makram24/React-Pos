import { collection, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../constants/firebase';

// Helper function to generate random dates
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate orders data
export const generateOrdersData = async (count = 100) => {
  try {
    const batch = writeBatch(db);
    const ordersRef = collection(db, 'orders');
    const generated = [];
    
    // Get existing menu items
    const menuItemsSnapshot = await getCollectionData('items');
    const menuItems = menuItemsSnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (menuItems.length === 0) {
      console.error('No menu items found. Please generate menu items first.');
      return [];
    }
    
    // Get employees for server assignment
    const employeesSnapshot = await getCollectionData('employees');
    const employees = employeesSnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const tables = Array.from({ length: 15 }, (_, i) => `Table ${i + 1}`);
    const orderTypes = ['Dine In', 'Takeout', 'Delivery'];
    const statuses = ['completed', 'processing', 'pending', 'cancelled'];
    const discountTypes = [null, 'percentage', 'fixed'];
    
    // Create multiple batches as Firestore has a limit of 500 operations per batch
    const batchSize = 400; // Leaving room for other operations
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (let i = 0; i < count; i++) {
      const orderDate = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
      const orderItems = [];
      const itemCount = Math.floor(Math.random() * 5) + 1;
      
      let subtotal = 0;
      
      // Add random items to the order
      for (let j = 0; j < itemCount; j++) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = item.price * quantity;
        subtotal += itemTotal;
        
        orderItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity,
          category: item.categoryId,
          ingredients: item.ingredients || []
        });
      }
      
      // Apply random discount
      let discount = 0;
      let discountType = discountTypes[Math.floor(Math.random() * discountTypes.length)];
      
      if (discountType) {
        if (discountType === 'percentage') {
          const percentage = Math.floor(Math.random() * 20) + 5;
          discount = (subtotal * percentage) / 100;
        } else if (discountType === 'fixed') {
          discount = Math.floor(Math.random() * 10) + 5;
        }
      }
      
      // Calculate tax (assuming 8.5% tax rate)
      const taxRate = 0.085;
      const tax = (subtotal - discount) * taxRate;
      
      // Calculate total
      const total = subtotal - discount + tax;
      
      // Assign a random server
      const server = employees.length > 0 ? 
        employees[Math.floor(Math.random() * employees.length)] : 
        { id: 'emp1', name: 'Default Server' };
      
      // Create order object
      const orderData = {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}-${i}`,
        items: orderItems,
        subtotal,
        discount,
        discountType,
        tax,
        total,
        paymentMethod: Math.random() > 0.7 ? 'Credit Card' : 'Cash',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: orderTypes[Math.floor(Math.random() * orderTypes.length)],
        tableName: tables[Math.floor(Math.random() * tables.length)],
        serverId: server.id,
        serverName: server.name,
        createdAt: Timestamp.fromDate(orderDate),
        updatedAt: Timestamp.fromDate(orderDate)
      };
      
      // Add to batch
      const newOrderRef = doc(ordersRef);
      currentBatch.set(newOrderRef, orderData);
      generated.push({ id: newOrderRef.id, ...orderData });
      
      operationCount++;
      
      // If batch is full, commit it and start a new one
      if (operationCount >= batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`Generated ${count} orders`);
    return generated;
  } catch (error) {
    console.error('Error generating orders:', error);
    return [];
  }
};

// Generate inventory items data
export const generateInventoryItemsData = async (count = 30) => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const generated = [];
    
    const ingredients = [
      { name: 'Flour', unit: 'kg', costPerUnit: 2.5 },
      { name: 'Sugar', unit: 'kg', costPerUnit: 3.0 },
      { name: 'Salt', unit: 'kg', costPerUnit: 1.5 },
      { name: 'Chicken', unit: 'kg', costPerUnit: 8.0 },
      { name: 'Beef', unit: 'kg', costPerUnit: 12.0 },
      { name: 'Fish', unit: 'kg', costPerUnit: 15.0 },
      { name: 'Rice', unit: 'kg', costPerUnit: 4.0 },
      { name: 'Pasta', unit: 'kg', costPerUnit: 3.5 },
      { name: 'Tomatoes', unit: 'kg', costPerUnit: 4.0 },
      { name: 'Lettuce', unit: 'kg', costPerUnit: 3.0 },
      { name: 'Cheese', unit: 'kg', costPerUnit: 10.0 },
      { name: 'Milk', unit: 'L', costPerUnit: 2.0 },
      { name: 'Cream', unit: 'L', costPerUnit: 4.0 },
      { name: 'Butter', unit: 'kg', costPerUnit: 8.0 },
      { name: 'Eggs', unit: 'dozen', costPerUnit: 3.0 },
      { name: 'Potatoes', unit: 'kg', costPerUnit: 2.0 },
      { name: 'Onions', unit: 'kg', costPerUnit: 1.5 },
      { name: 'Garlic', unit: 'kg', costPerUnit: 6.0 },
      { name: 'Cooking Oil', unit: 'L', costPerUnit: 5.0 },
      { name: 'Spices', unit: 'kg', costPerUnit: 20.0 },
      { name: 'Coffee Beans', unit: 'kg', costPerUnit: 18.0 },
      { name: 'Tea Leaves', unit: 'kg', costPerUnit: 12.0 },
      { name: 'Chocolate', unit: 'kg', costPerUnit: 12.0 },
      { name: 'Flour Tortillas', unit: 'dozen', costPerUnit: 3.5 },
      { name: 'Corn Tortillas', unit: 'dozen', costPerUnit: 3.0 },
      { name: 'Bacon', unit: 'kg', costPerUnit: 14.0 },
      { name: 'Ham', unit: 'kg', costPerUnit: 10.0 },
      { name: 'Sausages', unit: 'kg', costPerUnit: 9.0 },
      { name: 'Mushrooms', unit: 'kg', costPerUnit: 7.0 },
      { name: 'Bell Peppers', unit: 'kg', costPerUnit: 6.0 }
    ];
    
    // Use a batch for efficiency
    const batch = writeBatch(db);
    
    for (let i = 0; i < count && i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      const quantity = Math.floor(Math.random() * 100) + 20;
      const minQuantity = Math.floor(quantity * 0.2);
      
      const inventoryData = {
        name: ingredient.name,
        quantity,
        unit: ingredient.unit,
        costPerUnit: ingredient.costPerUnit,
        minQuantity,
        supplier: `Supplier ${Math.floor(Math.random() * 5) + 1}`,
        lastRestocked: Timestamp.fromDate(randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()))
      };
      
      const docRef = doc(inventoryRef);
      batch.set(docRef, inventoryData);
      generated.push({ id: docRef.id, ...inventoryData });
    }
    
    await batch.commit();
    console.log(`Generated ${count} inventory items`);
    return generated;
  } catch (error) {
    console.error('Error generating inventory items:', error);
    return [];
  }
};

// Generate menu items with ingredients
export const generateMenuItemsData = async (count = 20) => {
  try {
    const itemsRef = collection(db, 'items');
    const generated = [];
    
    // Get existing inventory items
    const inventorySnapshot = await getCollectionData('inventory');
    const inventoryItems = inventorySnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (inventoryItems.length === 0) {
      console.error('No inventory items found. Please generate inventory items first.');
      return [];
    }
    
    // Get categories
    const categoriesSnapshot = await getCollectionData('Categories');
    const categories = categoriesSnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (categories.length === 0) {
      console.error('No categories found. Please generate categories first.');
      return [];
    }
    
    const menuItems = [
      { name: 'Grilled Chicken Sandwich', price: 12.99, categoryId: 1 },
      { name: 'Caesar Salad', price: 9.99, categoryId: 2 },
      { name: 'Beef Burger', price: 14.99, categoryId: 1 },
      { name: 'Vegetable Pasta', price: 13.99, categoryId: 1 },
      { name: 'Chocolate Cake', price: 7.99, categoryId: 3 },
      { name: 'Fried Rice', price: 10.99, categoryId: 1 },
      { name: 'French Fries', price: 4.99, categoryId: 5 },
      { name: 'Ice Cream Sundae', price: 6.99, categoryId: 3 },
      { name: 'Chicken Wings', price: 11.99, categoryId: 2 },
      { name: 'Fish and Chips', price: 15.99, categoryId: 1 },
      { name: 'Vegetable Soup', price: 5.99, categoryId: 2 },
      { name: 'Steak', price: 24.99, categoryId: 1 },
      { name: 'Cheesecake', price: 8.99, categoryId: 3 },
      { name: 'Coffee', price: 3.99, categoryId: 4 },
      { name: 'Tea', price: 2.99, categoryId: 4 },
      { name: 'Soda', price: 2.99, categoryId: 4 },
      { name: 'Milkshake', price: 5.99, categoryId: 4 },
      { name: 'Garlic Bread', price: 4.99, categoryId: 5 },
      { name: 'Onion Rings', price: 5.99, categoryId: 5 },
      { name: 'Apple Pie', price: 7.99, categoryId: 3 }
    ];
    
    // Use a batch for efficiency
    const batch = writeBatch(db);
    
    for (let i = 0; i < count && i < menuItems.length; i++) {
      const item = menuItems[i];
      
      // Assign 2-5 random ingredients
      const ingredients = [];
      const ingredientCount = Math.floor(Math.random() * 4) + 2;
      
      // Shuffled inventory items to pick random ones
      const shuffled = [...inventoryItems].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < ingredientCount && j < shuffled.length; j++) {
        const ingredient = shuffled[j];
        const quantity = Math.random() * 0.5 + 0.1; // Random quantity between 0.1 and 0.6 units
        
        ingredients.push({
          itemId: ingredient.id,
          itemName: ingredient.name,
          quantity,
          unit: ingredient.unit
        });
      }
      
      const menuItemData = {
        name: item.name,
        description: `Delicious ${item.name.toLowerCase()}`,
        price: item.price,
        categoryId: item.categoryId,
        ingredients,
        createdAt: Timestamp.fromDate(new Date())
      };
      
      const docRef = doc(itemsRef);
      batch.set(docRef, menuItemData);
      generated.push({ id: docRef.id, ...menuItemData });
    }
    
    await batch.commit();
    console.log(`Generated ${count} menu items`);
    return generated;
  } catch (error) {
    console.error('Error generating menu items:', error);
    return [];
  }
};

// Generate employee data
export const generateEmployeesData = async (count = 15) => {
  try {
    const employeesRef = collection(db, 'employees');
    const generated = [];
    
    const roles = ['Server', 'Chef', 'Host', 'Manager', 'Bartender', 'Dishwasher'];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'Daniel', 'Jessica'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
    
    // Use a batch for efficiency
    const batch = writeBatch(db);
    
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      // Hourly rate based on role
      let hourlyRate;
      switch (role) {
        case 'Manager':
          hourlyRate = 25 + Math.random() * 5;
          break;
        case 'Chef':
          hourlyRate = 20 + Math.random() * 5;
          break;
        case 'Bartender':
          hourlyRate = 15 + Math.random() * 5;
          break;
        case 'Server':
          hourlyRate = 12 + Math.random() * 3;
          break;
        case 'Host':
          hourlyRate = 12 + Math.random() * 2;
          break;
        case 'Dishwasher':
          hourlyRate = 10 + Math.random() * 2;
          break;
        default:
          hourlyRate = 12;
      }
      
      const hireDate = randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      
      const employeeData = {
        name: `${firstName} ${lastName}`,
        role,
        hourlyRate,
        hourlyOvertimeRate: hourlyRate * 1.5, // 1.5x for overtime
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        hireDate: Timestamp.fromDate(hireDate),
        isActive: Math.random() > 0.1 // 90% are active
      };
      
      const docRef = doc(employeesRef);
      batch.set(docRef, employeeData);
      generated.push({ id: docRef.id, ...employeeData });
    }
    
    await batch.commit();
    console.log(`Generated ${count} employees`);
    return generated;
  } catch (error) {
    console.error('Error generating employees:', error);
    return [];
  }
};

// Generate employee shift data
export const generateEmployeeShiftsData = async (count = 100) => {
  try {
    const shiftsRef = collection(db, 'employeeShifts');
    const generated = [];
    
    // Get existing employees
    const employeesSnapshot = await getCollectionData('employees');
    const employees = employeesSnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (employees.length === 0) {
      console.error('No employees found. Please generate employees first.');
      return [];
    }
    
    const shifts = ['Morning', 'Afternoon', 'Evening'];
    const startTimes = ['08:00', '12:00', '16:00'];
    const endTimes = ['12:00', '16:00', '22:00'];
    
    // Create multiple batches as Firestore has a limit of 500 operations per batch
    const batchSize = 400;
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (let i = 0; i < count; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const shiftIndex = Math.floor(Math.random() * shifts.length);
      const shiftName = shifts[shiftIndex];
      
      // Random date within the last 90 days
      const shiftDate = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
      
      // Slightly randomize start and end times
      const startVariation = Math.floor(Math.random() * 60) - 30; // -30 to +30 minutes
      const endVariation = Math.floor(Math.random() * 60) - 30; // -30 to +30 minutes
      
      const startTime = new Date(shiftDate);
      const [startHour, startMinute] = startTimes[shiftIndex].split(':').map(Number);
      startTime.setHours(startHour, startMinute + startVariation, 0);
      
      const endTime = new Date(shiftDate);
      const [endHour, endMinute] = endTimes[shiftIndex].split(':').map(Number);
      endTime.setHours(endHour, endMinute + endVariation, 0);
      
      // Calculate hours worked
      const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
      
      // Randomly determine if employee was on time or late
      const isLate = Math.random() < 0.1; // 10% chance of being late
      const lateBy = isLate ? Math.floor(Math.random() * 20) + 5 : 0; // 5-25 minutes late
      
      // Randomly determine if it's overtime (more than 8 hours)
      const isOvertime = hoursWorked > 8;
      
      // Calculate pay based on hours worked
      const overtimeHours = isOvertime ? hoursWorked - 8 : 0;
      const regularHours = isOvertime ? 8 : hoursWorked;
      
      const regularPay = regularHours * (employee.hourlyRate || 15);
      const overtimePay = overtimeHours * (employee.hourlyOvertimeRate || employee.hourlyRate * 1.5 || 22.5);
      const totalPay = regularPay + overtimePay;
      
      const shiftData = {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeRole: employee.role,
        date: Timestamp.fromDate(shiftDate),
        shift: shiftName,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        hoursWorked,
        isLate,
        lateBy,
        isOvertime,
        regularHours,
        overtimeHours,
        regularPay,
        overtimePay,
        totalPay,
        notes: isLate ? `Employee was ${lateBy} minutes late` : ''
      };
      
      const docRef = doc(shiftsRef);
      currentBatch.set(docRef, shiftData);
      generated.push({ id: docRef.id, ...shiftData });
      
      operationCount++;
      
      // If batch is full, commit it and start a new one
      if (operationCount >= batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`Generated ${count} employee shifts`);
    return generated;
  } catch (error) {
    console.error('Error generating employee shifts:', error);
    return [];
  }
};

// Generate inventory usage data
export const generateInventoryUsageData = async (count = 200) => {
  try {
    const usageRef = collection(db, 'inventoryUsage');
    const generated = [];
    
    // Get existing inventory items
    const inventorySnapshot = await getCollectionData('inventory');
    const inventoryItems = inventorySnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (inventoryItems.length === 0) {
      console.error('No inventory items found. Please generate inventory items first.');
      return [];
    }
    
    // Create multiple batches as Firestore has a limit
    const batchSize = 400;
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (let i = 0; i < count; i++) {
      const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
      const usageDate = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
      const quantity = Math.random() * 5 + 0.5; // Random quantity between 0.5 and 5.5 units
      const cost = quantity * (item.costPerUnit || 1);
      
      const usageData = {
        itemId: item.id,
        itemName: item.name,
        quantity,
        unit: item.unit,
        cost,
        date: Timestamp.fromDate(usageDate),
        reason: Math.random() > 0.7 ? 'Recipe' : 'Prep',
        notes: ''
      };
      
      const docRef = doc(usageRef);
      currentBatch.set(docRef, usageData);
      generated.push({ id: docRef.id, ...usageData });
      
      operationCount++;
      
      // If batch is full, commit it and start a new one
      if (operationCount >= batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`Generated ${count} inventory usage records`);
    return generated;
  } catch (error) {
    console.error('Error generating inventory usage:', error);
    return [];
  }
};

// Generate customer feedback data
export const generateCustomerFeedbackData = async (count = 100) => {
  try {
    const feedbackRef = collection(db, 'customerFeedback');
    const generated = [];
    
    // Get existing orders to link feedback
    const ordersSnapshot = await getCollectionData('orders');
    const orders = ordersSnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (orders.length === 0) {
      console.error('No orders found. Please generate orders first.');
      return [];
    }
    
    const positiveComments = [
      'Great service and food!',
      'The staff was very friendly and attentive.',
      'Food was delicious and served quickly.',
      'Excellent experience overall.',
      'Will definitely come back again!',
      'The atmosphere was wonderful.',
      'Best restaurant in town!',
      'Very satisfied with my meal.',
      'Loved the menu variety.',
      'Food presentation was beautiful.'
    ];
    
    const neutralComments = [
      'Food was okay, service was good.',
      'Average experience.',
      'Nothing special but no complaints.',
      'Decent meal for the price.',
      'Service was a bit slow but food was good.',
      'Would try again but not in a hurry.',
      'Some dishes were better than others.',
      'Food was good but portions were small.',
      'Acceptable service and food quality.',
      'Menu could use more variety.'
    ];
    
    const negativeComments = [
      'Service was slow and inattentive.',
      'Food was cold when served.',
      'Overpriced for the quality.',
      'Waited too long for our order.',
      'Staff was not friendly.',
      'Food did not meet expectations.',
      'Too noisy and crowded.',
      'Would not recommend.',
      'Several menu items were unavailable.',
      'Food was bland and uninspired.'
    ];
    
    // Create multiple batches
    const batchSize = 400;
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (let i = 0; i < count; i++) {
      const order = orders[Math.floor(Math.random() * orders.length)];
      const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
      
      let comment;
      if (rating >= 4) {
        comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
      } else if (rating === 3) {
        comment = neutralComments[Math.floor(Math.random() * neutralComments.length)];
      } else {
        comment = negativeComments[Math.floor(Math.random() * negativeComments.length)];
      }
      
      // Feedback date is after the order date
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
      const feedbackDate = new Date(orderDate.getTime() + Math.random() * 48 * 60 * 60 * 1000); // 0-48 hours after order
      
      const feedbackData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        rating,
        comment,
        categories: {
          food: Math.floor(Math.random() * 5) + 1,
          service: Math.floor(Math.random() * 5) + 1,
          ambience: Math.floor(Math.random() * 5) + 1,
          value: Math.floor(Math.random() * 5) + 1
        },
        createdAt: Timestamp.fromDate(feedbackDate),
        customerName: 'Anonymous'
      };
      
      const docRef = doc(feedbackRef);
      currentBatch.set(docRef, feedbackData);
      generated.push({ id: docRef.id, ...feedbackData });
      
      operationCount++;
      
      // If batch is full, commit it and start a new one
      if (operationCount >= batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`Generated ${count} customer feedback records`);
    return generated;
  } catch (error) {
    console.error('Error generating customer feedback:', error);
    return [];
  }
};

// Generate expense data
export const generateExpenseData = async (count = 100) => {
  try {
    const expensesRef = collection(db, 'expenses');
    const generated = [];
    
    const categories = [
      'Rent',
      'Utilities',
      'Ingredients',
      'Salaries',
      'Marketing',
      'Maintenance',
      'Insurance',
      'Equipment',
      'Cleaning',
      'Office Supplies',
      'Licenses',
      'Other'
    ];
    
    const paymentMethods = ['Credit Card', 'Bank Transfer', 'Cash', 'Check'];
    const vendors = [
      'ABC Suppliers',
      'City Electric',
      'Metro Water',
      'Johnson Cleaning',
      'Smith Insurance',
      'Office Depot',
      'Restaurant Supply Co.',
      'Maintenance Services',
      'Marketing Agency',
      'Property Management'
    ];
    
    // Create multiple batches
    const batchSize = 400;
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const expenseDate = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
      
      // Amount depends on category
      let amount;
      switch (category) {
        case 'Rent':
          amount = 1500 + Math.random() * 1000;
          break;
        case 'Utilities':
          amount = 200 + Math.random() * 300;
          break;
        case 'Salaries':
          amount = 1000 + Math.random() * 2000;
          break;
        case 'Ingredients':
          amount = 300 + Math.random() * 700;
          break;
        default:
          amount = 50 + Math.random() * 500;
      }
      
      const expenseData = {
        description: `${category} expense`,
        category,
        amount,
        date: Timestamp.fromDate(expenseDate),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        notes: '',
        receipt: '',
        isRecurring: category === 'Rent' || category === 'Utilities' || category === 'Insurance'
      };
      
      const docRef = doc(expensesRef);
      currentBatch.set(docRef, expenseData);
      generated.push({ id: docRef.id, ...expenseData });
      
      operationCount++;
      
      // If batch is full, commit it and start a new one
      if (operationCount >= batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`Generated ${count} expense records`);
    return generated;
  } catch (error) {
    console.error('Error generating expenses:', error);
    return [];
  }
};

// Generate food waste data
export const generateWasteData = async (count = 50) => {
  try {
    const wasteRef = collection(db, 'waste');
    const generated = [];
    
    // Get existing inventory items
    const inventorySnapshot = await getCollectionData('inventory');
    const inventoryItems = inventorySnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (inventoryItems.length === 0) {
      console.error('No inventory items found. Please generate inventory items first.');
      return [];
    }
    
    const wasteReasons = [
      'Expired',
      'Overproduction',
      'Preparation Error',
      'Quality Issues',
      'Storage Issues',
      'Spoilage',
      'Customer Return'
    ];
    
    // Create a batch for efficiency
    const batch = writeBatch(db);
    
    for (let i = 0; i < count; i++) {
      const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
      const quantity = Math.random() * 3 + 0.5; // Random quantity between 0.5 and 3.5 units
      const cost = quantity * (item.costPerUnit || 1);
      const wasteDate = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
      const reason = wasteReasons[Math.floor(Math.random() * wasteReasons.length)];
      
      const wasteData = {
        itemId: item.id,
        itemName: item.name,
        quantity,
        unit: item.unit,
        cost,
        date: Timestamp.fromDate(wasteDate),
        reason,
        notes: `${quantity} ${item.unit} wasted due to ${reason.toLowerCase()}`
      };
      
      const docRef = doc(wasteRef);
      batch.set(docRef, wasteData);
      generated.push({ id: docRef.id, ...wasteData });
    }
    
    await batch.commit();
    console.log(`Generated ${count} waste records`);
    return generated;
  } catch (error) {
    console.error('Error generating waste records:', error);
    return [];
  }
};

// Generate supplier records
export const generateSupplierRecords = async (count = 50) => {
  try {
    const suppliersRef = collection(db, 'suppliers');
    const generated = [];
    
    // Get existing inventory items
    const inventorySnapshot = await getCollectionData('inventory');
    const inventoryItems = inventorySnapshot.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (inventoryItems.length === 0) {
      console.error('No inventory items found. Please generate inventory items first.');
      return [];
    }
    
    const supplierNames = [
      'Metro Food Suppliers',
      'Fresh Produce Co.',
      'Wholesale Meats',
      'City Bakery Suppliers',
      'Dairy Direct',
      'Quality Foods Inc.',
      'Restaurant Supply Co.',
      'Farm Fresh Distributors',
      'Prime Grocery Wholesale',
      'Gourmet Ingredients Ltd.'
    ];
    
    // Create a batch for efficiency
    const batch = writeBatch(db);
    
    for (let i = 0; i < count; i++) {
      const supplierName = supplierNames[Math.floor(Math.random() * supplierNames.length)];
      const deliveryDate = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date());
      
      // Pick 1-5 random items from inventory
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const shuffledItems = [...inventoryItems].sort(() => 0.5 - Math.random());
      const items = [];
      let totalCost = 0;
      
      for (let j = 0; j < itemCount && j < shuffledItems.length; j++) {
        const item = shuffledItems[j];
        const quantity = Math.floor(Math.random() * 20) + 5;
        const cost = quantity * (item.costPerUnit || 1);
        totalCost += cost;
        
        items.push({
          itemId: item.id,
          itemName: item.name,
          quantity,
          unit: item.unit,
          unitCost: item.costPerUnit || 1,
          totalCost: cost
        });
      }
      
      // Random delivery performance metrics
      const isOnTime = Math.random() > 0.2; // 80% on time
      const isComplete = Math.random() > 0.15; // 85% complete
      const isCorrect = Math.random() > 0.1; // 90% correct
      
      const supplierData = {
        supplierName,
        deliveryDate: Timestamp.fromDate(deliveryDate),
        orderDate: Timestamp.fromDate(new Date(deliveryDate.getTime() - (24 * 60 * 60 * 1000) * (Math.floor(Math.random() * 5) + 1))),
        items,
        totalCost,
        isOnTime,
        isComplete,
        isCorrect,
        notes: !isOnTime ? 'Delivery was late' : !isComplete ? 'Order was incomplete' : !isCorrect ? 'Order had errors' : 'Delivery successful'
      };
      
      const docRef = doc(suppliersRef);
      batch.set(docRef, supplierData);
      generated.push({ id: docRef.id, ...supplierData });
    }
    
    await batch.commit();
    console.log(`Generated ${count} supplier records`);
    return generated;
  } catch (error) {
    console.error('Error generating supplier records:', error);
    return [];
  }
};

// Generate all data
export const generateAllAnalyticsData = async () => {
  try {
    console.log('Starting to generate all analytics data...');
    
    // Generate data in sequence to maintain proper references
    const inventoryItems = await generateInventoryItemsData(30);
    console.log(`Generated ${inventoryItems.length} inventory items`);
    
    const menuItems = await generateMenuItemsData(20);
    console.log(`Generated ${menuItems.length} menu items`);
    
    const employees = await generateEmployeesData(15);
    console.log(`Generated ${employees.length} employees`);
    
    const orders = await generateOrdersData(200);
    console.log(`Generated ${orders.length} orders`);
    
    const shifts = await generateEmployeeShiftsData(150);
    console.log(`Generated ${shifts.length} employee shifts`);
    
    const inventoryUsage = await generateInventoryUsageData(200);
    console.log(`Generated ${inventoryUsage.length} inventory usage records`);
    
    const feedback = await generateCustomerFeedbackData(100);
    console.log(`Generated ${feedback.length} customer feedback records`);
    
    const expenses = await generateExpenseData(100);
    console.log(`Generated ${expenses.length} expense records`);
    
    const waste = await generateWasteData(50);
    console.log(`Generated ${waste.length} waste records`);
    
    const suppliers = await generateSupplierRecords(50);
    console.log(`Generated ${suppliers.length} supplier records`);
    
    return {
      inventoryItems,
      menuItems,
      employees,
      orders,
      shifts,
      inventoryUsage,
      feedback,
      expenses,
      waste,
      suppliers
    };
  } catch (error) {
    console.error('Error generating all analytics data:', error);
    throw error;
  }
};

// Helper function to get collection data
const getCollectionData = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const docs = [];
    const querySnapshot = await getDocs(collectionRef);
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    return docs;
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    return [];
  }
}; 