import { collection, query, where, getDocs, orderBy, limit, startAt, endAt, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';

// Function to get date ranges
export const getDateRanges = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
  
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  
  const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
  
  return {
    today: {
      start: today,
      end: tomorrow
    },
    yesterday: {
      start: yesterday,
      end: today
    },
    week: {
      start: firstDayOfWeek,
      end: lastDayOfWeek
    },
    month: {
      start: firstDayOfMonth,
      end: new Date(lastDayOfMonth.getTime() + 24 * 60 * 60 * 1000)
    },
    year: {
      start: firstDayOfYear,
      end: new Date(lastDayOfYear.getTime() + 24 * 60 * 60 * 1000)
    }
  };
};

// Convert date to Firestore timestamp
export const dateToTimestamp = (date) => {
  return Timestamp.fromDate(date);
};

// Fetch orders by date range
export const fetchOrdersByDateRange = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching orders by date range:', error);
    return [];
  }
};

// Calculate total sales from orders
export const calculateTotalSales = (orders) => {
  return orders.reduce((total, order) => {
    return total + (order.totalAmount || 0);
  }, 0);
};

// Group sales by category
export const groupSalesByCategory = (orders) => {
  const categories = {};
  
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const category = item.category || 'Uncategorized';
        
        if (!categories[category]) {
          categories[category] = {
            totalSales: 0,
            itemCount: 0
          };
        }
        
        categories[category].totalSales += (item.price * item.quantity) || 0;
        categories[category].itemCount += item.quantity || 0;
      });
    }
  });
  
  return categories;
};

// Get top selling items
export const getTopSellingItems = (orders, limit = 10) => {
  const itemsSold = {};
  
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const itemName = item.name;
        
        if (!itemsSold[itemName]) {
          itemsSold[itemName] = {
            name: itemName,
            quantity: 0,
            totalSales: 0,
            category: item.category
          };
        }
        
        itemsSold[itemName].quantity += item.quantity || 0;
        itemsSold[itemName].totalSales += (item.price * item.quantity) || 0;
      });
    }
  });
  
  return Object.values(itemsSold)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};

// Get least selling items
export const getLeastSellingItems = (orders, limit = 10) => {
  const itemsSold = {};
  
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const itemName = item.name;
        
        if (!itemsSold[itemName]) {
          itemsSold[itemName] = {
            name: itemName,
            quantity: 0,
            totalSales: 0,
            category: item.category
          };
        }
        
        itemsSold[itemName].quantity += item.quantity || 0;
        itemsSold[itemName].totalSales += (item.price * item.quantity) || 0;
      });
    }
  });
  
  return Object.values(itemsSold)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, limit);
};

// Group sales by hour of day
export const groupSalesByHour = (orders) => {
  const hours = Array(24).fill(0).map((_, index) => ({
    hour: index,
    totalSales: 0,
    orderCount: 0
  }));
  
  orders.forEach(order => {
    if (order.createdAt && order.createdAt.toDate) {
      const date = order.createdAt.toDate();
      const hour = date.getHours();
      
      hours[hour].totalSales += order.totalAmount || 0;
      hours[hour].orderCount += 1;
    }
  });
  
  return hours;
};

// Group sales by table
export const groupSalesByTable = (orders) => {
  const tables = {};
  
  orders.forEach(order => {
    if (order.table) {
      const tableId = order.table.id || order.table;
      const tableName = order.table.name || `Table ${tableId}`;
      
      if (!tables[tableId]) {
        tables[tableId] = {
          id: tableId,
          name: tableName,
          totalSales: 0,
          orderCount: 0
        };
      }
      
      tables[tableId].totalSales += order.totalAmount || 0;
      tables[tableId].orderCount += 1;
    }
  });
  
  return Object.values(tables);
};

// Group sales by order type (dine-in, takeaway, delivery)
export const groupSalesByOrderType = (orders) => {
  const orderTypes = {
    'dine-in': { totalSales: 0, orderCount: 0 },
    'takeaway': { totalSales: 0, orderCount: 0 },
    'delivery': { totalSales: 0, orderCount: 0 }
  };
  
  orders.forEach(order => {
    const type = order.orderType || 'dine-in';
    
    if (!orderTypes[type]) {
      orderTypes[type] = { totalSales: 0, orderCount: 0 };
    }
    
    orderTypes[type].totalSales += order.totalAmount || 0;
    orderTypes[type].orderCount += 1;
  });
  
  return orderTypes;
};

// Get discount usage and impact
export const getDiscountImpact = (orders) => {
  const discounts = {};
  let totalDiscountAmount = 0;
  let orderCountWithDiscount = 0;
  
  orders.forEach(order => {
    if (order.discount && order.discount.amount > 0) {
      const discountName = order.discount.name || 'Unnamed discount';
      const discountAmount = order.discount.amount || 0;
      
      if (!discounts[discountName]) {
        discounts[discountName] = {
          name: discountName,
          totalAmount: 0,
          useCount: 0,
          avgOrderValue: 0
        };
      }
      
      discounts[discountName].totalAmount += discountAmount;
      discounts[discountName].useCount += 1;
      discounts[discountName].avgOrderValue += order.totalAmount || 0;
      
      totalDiscountAmount += discountAmount;
      orderCountWithDiscount += 1;
    }
  });
  
  // Calculate average order value for each discount
  Object.values(discounts).forEach(discount => {
    if (discount.useCount > 0) {
      discount.avgOrderValue = discount.avgOrderValue / discount.useCount;
    }
  });
  
  return {
    discounts: Object.values(discounts),
    totalDiscountAmount,
    orderCountWithDiscount,
    discountPercentage: orders.length > 0 ? (orderCountWithDiscount / orders.length) * 100 : 0
  };
}; 