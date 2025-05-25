import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';

// Fetch expenses
export const fetchExpenses = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('date', '>=', startTimestamp),
      where('date', '<', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
};

// Calculate profit and loss
export const calculateProfitAndLoss = (orders, expenses, inventoryUsage) => {
  try {
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Calculate total COGS (Cost of Goods Sold)
    const totalCOGS = inventoryUsage.reduce((sum, usage) => sum + (usage.cost || 0), 0);
    
    // Calculate gross profit
    const grossProfit = totalRevenue - totalCOGS;
    
    // Calculate gross profit margin
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    // Calculate net profit
    const netProfit = grossProfit - totalExpenses;
    
    // Calculate net profit margin
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossProfitMargin,
      totalExpenses,
      netProfit,
      netProfitMargin
    };
  } catch (error) {
    console.error('Error calculating profit and loss:', error);
    return {
      totalRevenue: 0,
      totalCOGS: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
      totalExpenses: 0,
      netProfit: 0,
      netProfitMargin: 0
    };
  }
};

// Calculate expenses by category
export const calculateExpensesByCategory = (expenses) => {
  try {
    const categories = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      
      if (!categories[category]) {
        categories[category] = {
          category,
          totalAmount: 0,
          count: 0
        };
      }
      
      categories[category].totalAmount += expense.amount || 0;
      categories[category].count++;
    });
    
    return Object.values(categories);
  } catch (error) {
    console.error('Error calculating expenses by category:', error);
    return [];
  }
};

// Calculate COGS by menu item
export const calculateCOGSByMenuItem = (menuItems, inventoryItems, salesData) => {
  try {
    // Create map of inventory items for easier lookup
    const inventoryMap = {};
    inventoryItems.forEach(item => {
      inventoryMap[item.id] = item;
    });
    
    // Calculate COGS for each menu item
    return menuItems.map(item => {
      // Calculate ingredient cost
      let ingredientCost = 0;
      
      if (item.ingredients && Array.isArray(item.ingredients)) {
        item.ingredients.forEach(ingredient => {
          const inventoryItem = inventoryMap[ingredient.itemId];
          if (inventoryItem) {
            ingredientCost += (ingredient.quantity || 0) * (inventoryItem.costPerUnit || 0);
          }
        });
      }
      
      // Count sales for this item
      const itemSales = salesData.filter(sale => sale.itemId === item.id);
      const quantitySold = itemSales.reduce((sum, sale) => sum + (sale.quantity || 1), 0);
      const totalRevenue = (item.price || 0) * quantitySold;
      
      // Calculate COGS percentage
      const cogsPercentage = item.price > 0 ? (ingredientCost / item.price) * 100 : 0;
      
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price || 0,
        ingredientCost,
        cogsPercentage,
        quantitySold,
        totalRevenue,
        totalCOGS: ingredientCost * quantitySold
      };
    });
  } catch (error) {
    console.error('Error calculating COGS by menu item:', error);
    return [];
  }
};

// Calculate payroll costs
export const calculatePayrollCosts = (shifts, employees) => {
  try {
    // Calculate total payroll
    const totalPayroll = shifts.reduce((sum, shift) => sum + (shift.totalPay || 0), 0);
    
    // Calculate regular and overtime payroll
    const regularPayroll = shifts.reduce((sum, shift) => sum + (shift.regularPay || 0), 0);
    const overtimePayroll = shifts.reduce((sum, shift) => sum + (shift.overtimePay || 0), 0);
    
    // Calculate payroll by role
    const rolePayroll = {};
    
    shifts.forEach(shift => {
      const role = shift.employeeRole || 'Unknown';
      
      if (!rolePayroll[role]) {
        rolePayroll[role] = {
          role,
          employeeCount: 0,
          totalHours: 0,
          totalCost: 0
        };
      }
      
      // Only count unique employees
      if (!rolePayroll[role].employees) {
        rolePayroll[role].employees = new Set();
      }
      rolePayroll[role].employees.add(shift.employeeId);
      
      rolePayroll[role].totalHours += shift.hoursWorked || 0;
      rolePayroll[role].totalCost += shift.totalPay || 0;
    });
    
    // Convert to array and calculate employee counts
    const rolePayrollArray = Object.values(rolePayroll).map(role => {
      return {
        ...role,
        employeeCount: role.employees ? role.employees.size : 0
      };
    });
    
    // Remove the Set objects
    rolePayrollArray.forEach(role => {
      delete role.employees;
    });
    
    return {
      totalPayroll,
      regularPayroll,
      overtimePayroll,
      rolePayroll: rolePayrollArray
    };
  } catch (error) {
    console.error('Error calculating payroll costs:', error);
    return {
      totalPayroll: 0,
      regularPayroll: 0,
      overtimePayroll: 0,
      rolePayroll: []
    };
  }
};

// Calculate taxes
export const calculateTaxes = (orders) => {
  try {
    // Calculate totals
    let totalSalesTax = 0;
    let totalServiceCharges = 0;
    let beforeTaxTotal = 0;
    let afterTaxTotal = 0;
    
    orders.forEach(order => {
      // Add tax
      totalSalesTax += order.tax || 0;
      
      // For demo, assume service charge is 0 unless specified
      totalServiceCharges += order.serviceCharge || 0;
      
      // Before tax total (subtotal - discount)
      beforeTaxTotal += (order.subtotal || 0) - (order.discount || 0);
      
      // After tax total
      afterTaxTotal += order.total || 0;
    });
    
    // Calculate total taxes
    const totalTaxes = totalSalesTax + totalServiceCharges;
    
    // Calculate tax percentages
    const salesTaxPercentage = beforeTaxTotal > 0 ? (totalSalesTax / beforeTaxTotal) * 100 : 0;
    const serviceChargePercentage = beforeTaxTotal > 0 ? (totalServiceCharges / beforeTaxTotal) * 100 : 0;
    const taxPercentage = beforeTaxTotal > 0 ? (totalTaxes / beforeTaxTotal) * 100 : 0;
    
    return {
      totalSalesTax,
      totalServiceCharges,
      totalTaxes,
      beforeTaxTotal,
      totalRevenue: afterTaxTotal,
      salesTaxPercentage,
      serviceChargePercentage,
      taxPercentage
    };
  } catch (error) {
    console.error('Error calculating taxes:', error);
    return {
      totalSalesTax: 0,
      totalServiceCharges: 0,
      totalTaxes: 0,
      beforeTaxTotal: 0,
      totalRevenue: 0,
      salesTaxPercentage: 0,
      serviceChargePercentage: 0,
      taxPercentage: 0
    };
  }
}; 