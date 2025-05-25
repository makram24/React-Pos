import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';

// Fetch inventory items
export const fetchInventoryItems = async () => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const querySnapshot = await getDocs(inventoryRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }
};

// Fetch all menu items
export const fetchMenuItems = async () => {
  try {
    const menuRef = collection(db, 'items');
    const querySnapshot = await getDocs(menuRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

// Fetch inventory usage history
export const fetchInventoryUsage = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const usageRef = collection(db, 'inventoryUsage');
    const q = query(
      usageRef,
      where('date', '>=', startTimestamp),
      where('date', '<', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching inventory usage:', error);
    return [];
  }
};

// Calculate inventory depletion rate
export const calculateDepletionRate = (item, usageData) => {
  try {
    const itemUsage = usageData.filter(usage => usage.itemId === item.id);
    
    // No usage data
    if (itemUsage.length === 0) {
      return {
        dailyRate: 0,
        weeklyRate: 0,
        monthlyRate: 0,
        estimatedDaysLeft: item.quantity > 0 ? Infinity : 0
      };
    }
    
    // Calculate total usage
    const totalUsage = itemUsage.reduce((sum, usage) => sum + usage.quantity, 0);
    
    // Get date range
    const dates = itemUsage.map(usage => usage.date?.toDate ? usage.date.toDate() : new Date());
    const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));
    
    // Calculate days in range
    const daysInRange = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)));
    
    // Calculate rates
    const dailyRate = totalUsage / daysInRange;
    const weeklyRate = dailyRate * 7;
    const monthlyRate = dailyRate * 30;
    
    // Calculate days left
    const estimatedDaysLeft = dailyRate > 0 ? item.quantity / dailyRate : Infinity;
    
    return {
      dailyRate,
      weeklyRate,
      monthlyRate,
      estimatedDaysLeft
    };
  } catch (error) {
    console.error('Error calculating depletion rate:', error);
    return {
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      estimatedDaysLeft: 0
    };
  }
};

// Analyze food waste
export const analyzeFoodWaste = (wasteData) => {
  try {
    // Total waste value
    const totalWasteValue = wasteData.reduce((sum, waste) => sum + (waste.cost || 0), 0);
    
    // Waste by item
    const wasteByItem = {};
    
    wasteData.forEach(waste => {
      if (!wasteByItem[waste.itemId]) {
        wasteByItem[waste.itemId] = {
          itemId: waste.itemId,
          itemName: waste.itemName,
          totalQuantity: 0,
          totalValue: 0,
          reasons: {}
        };
      }
      
      wasteByItem[waste.itemId].totalQuantity += waste.quantity || 0;
      wasteByItem[waste.itemId].totalValue += waste.cost || 0;
      
      // Track reasons
      if (waste.reason) {
        if (!wasteByItem[waste.itemId].reasons[waste.reason]) {
          wasteByItem[waste.itemId].reasons[waste.reason] = 0;
        }
        wasteByItem[waste.itemId].reasons[waste.reason]++;
      }
    });
    
    // Convert to array and sort by value
    const wasteByItemArray = Object.values(wasteByItem).sort((a, b) => b.totalValue - a.totalValue);
    
    // Waste by reason
    const wasteByReason = {};
    
    wasteData.forEach(waste => {
      if (waste.reason) {
        if (!wasteByReason[waste.reason]) {
          wasteByReason[waste.reason] = {
            reason: waste.reason,
            totalQuantity: 0,
            totalValue: 0,
            count: 0
          };
        }
        
        wasteByReason[waste.reason].totalQuantity += waste.quantity || 0;
        wasteByReason[waste.reason].totalValue += waste.cost || 0;
        wasteByReason[waste.reason].count++;
      }
    });
    
    // Convert to array and sort by value
    const wasteByReasonArray = Object.values(wasteByReason).sort((a, b) => b.totalValue - a.totalValue);
    
    return {
      totalWasteValue,
      itemCount: Object.keys(wasteByItem).length,
      wasteByItem: wasteByItemArray,
      wasteByReason: wasteByReasonArray
    };
  } catch (error) {
    console.error('Error analyzing food waste:', error);
    return {
      totalWasteValue: 0,
      itemCount: 0,
      wasteByItem: [],
      wasteByReason: []
    };
  }
};

// Analyze supplier performance
export const analyzeSupplierPerformance = (supplierData) => {
  try {
    const supplierPerformance = {};
    
    supplierData.forEach(delivery => {
      if (!supplierPerformance[delivery.supplierName]) {
        supplierPerformance[delivery.supplierName] = {
          supplierId: delivery.id,
          supplierName: delivery.supplierName,
          deliveries: 0,
          onTimeDeliveries: 0,
          completeDeliveries: 0,
          correctDeliveries: 0,
          totalValue: 0
        };
      }
      
      supplierPerformance[delivery.supplierName].deliveries++;
      if (delivery.isOnTime) supplierPerformance[delivery.supplierName].onTimeDeliveries++;
      if (delivery.isComplete) supplierPerformance[delivery.supplierName].completeDeliveries++;
      if (delivery.isCorrect) supplierPerformance[delivery.supplierName].correctDeliveries++;
      supplierPerformance[delivery.supplierName].totalValue += delivery.totalCost || 0;
    });
    
    // Calculate performance metrics
    const performanceData = Object.values(supplierPerformance).map(supplier => {
      const onTimeRate = (supplier.onTimeDeliveries / supplier.deliveries) * 100;
      const completeRate = (supplier.completeDeliveries / supplier.deliveries) * 100;
      const correctRate = (supplier.correctDeliveries / supplier.deliveries) * 100;
      
      // Overall performance score (weighted average)
      const performanceScore = (onTimeRate * 0.3) + (completeRate * 0.4) + (correctRate * 0.3);
      
      return {
        ...supplier,
        onTimeRate,
        completeRate,
        correctRate,
        performanceScore
      };
    });
    
    // Sort by performance score
    return performanceData.sort((a, b) => b.performanceScore - a.performanceScore);
  } catch (error) {
    console.error('Error analyzing supplier performance:', error);
    return [];
  }
};

// Calculate menu item profitability
export const calculateMenuItemProfitability = (menuItems, inventoryItems, salesData) => {
  try {
    // Create map of inventory items for easier lookup
    const inventoryMap = {};
    inventoryItems.forEach(item => {
      inventoryMap[item.id] = item;
    });
    
    // Calculate cost of each menu item based on ingredients
    const menuItemsWithCost = menuItems.map(item => {
      let ingredientCost = 0;
      
      // Calculate ingredient cost
      if (item.ingredients && Array.isArray(item.ingredients)) {
        item.ingredients.forEach(ingredient => {
          const inventoryItem = inventoryMap[ingredient.itemId];
          if (inventoryItem) {
            ingredientCost += (ingredient.quantity || 0) * (inventoryItem.costPerUnit || 0);
          }
        });
      }
      
      // Count sales
      const itemSales = salesData.filter(sale => sale.itemId === item.id);
      const totalQuantitySold = itemSales.reduce((sum, sale) => sum + (sale.quantity || 1), 0);
      const totalRevenue = itemSales.reduce((sum, sale) => sum + ((sale.price || 0) * (sale.quantity || 1)), 0);
      
      // Calculate profitability metrics
      const profitPerItem = (item.price || 0) - ingredientCost;
      const profitMargin = item.price > 0 ? (profitPerItem / item.price) * 100 : 0;
      const totalProfit = profitPerItem * totalQuantitySold;
      const cogsPercentage = item.price > 0 ? (ingredientCost / item.price) * 100 : 0;
      
      return {
        ...item,
        ingredientCost,
        profitPerItem,
        profitMargin,
        totalQuantitySold,
        totalRevenue,
        totalProfit,
        cogsPercentage
      };
    });
    
    // Sort by profit margin
    return menuItemsWithCost.sort((a, b) => b.profitMargin - a.profitMargin);
  } catch (error) {
    console.error('Error calculating menu item profitability:', error);
    return [];
  }
};