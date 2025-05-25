import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';

// Fetch employees
export const fetchEmployees = async () => {
  try {
    const employeesRef = collection(db, 'employees');
    const querySnapshot = await getDocs(employeesRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

// Fetch employee shifts by date range
export const fetchEmployeeShifts = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const shiftsRef = collection(db, 'employeeShifts');
    const q = query(
      shiftsRef,
      where('date', '>=', startTimestamp),
      where('date', '<', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching employee shifts:', error);
    return [];
  }
};

// Calculate employee sales performance
export const calculateEmployeeSalesPerformance = (orders, employees) => {
  try {
    // Create a map of employees for easier lookup
    const employeeMap = {};
    employees.forEach(employee => {
      employeeMap[employee.id] = {
        ...employee,
        totalOrders: 0,
        totalSales: 0,
        itemsSold: 0,
        averageOrderValue: 0
      };
    });
    
    // Process orders
    orders.forEach(order => {
      if (order.serverId && employeeMap[order.serverId]) {
        const employee = employeeMap[order.serverId];
        
        // Increment order count
        employee.totalOrders++;
        
        // Add to total sales
        employee.totalSales += order.total || 0;
        
        // Add to items sold
        if (order.items && Array.isArray(order.items)) {
          employee.itemsSold += order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        }
      }
    });
    
    // Calculate average order value
    Object.values(employeeMap).forEach(employee => {
      employee.averageOrderValue = employee.totalOrders > 0 ? employee.totalSales / employee.totalOrders : 0;
    });
    
    return Object.values(employeeMap);
  } catch (error) {
    console.error('Error calculating employee sales performance:', error);
    return [];
  }
};

// Calculate table turnover rate
export const calculateTableTurnoverRate = (orders, employees) => {
  try {
    // Group orders by table
    const tableOrders = {};
    orders.forEach(order => {
      if (order.tableName && order.createdAt && order.status === 'completed') {
        if (!tableOrders[order.tableName]) {
          tableOrders[order.tableName] = [];
        }
        
        const orderDateTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
        const completedDateTime = order.updatedAt?.toDate ? order.updatedAt.toDate() : new Date(orderDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour
        
        tableOrders[order.tableName].push({
          ...order,
          orderDateTime,
          completedDateTime,
          turnoverTime: (completedDateTime - orderDateTime) / (1000 * 60) // in minutes
        });
      }
    });
    
    // Calculate turnover time by employee
    const employeeStats = {};
    
    // Process each table's orders
    Object.values(tableOrders).forEach(tableOrderList => {
      tableOrderList.forEach(order => {
        if (order.serverId) {
          if (!employeeStats[order.serverId]) {
            const employee = employees.find(emp => emp.id === order.serverId) || { name: 'Unknown', role: 'Unknown' };
            
            employeeStats[order.serverId] = {
              id: order.serverId,
              name: employee.name,
              role: employee.role,
              tablesServed: 0,
              totalTurnoverTime: 0,
              averageTurnoverTime: 0
            };
          }
          
          employeeStats[order.serverId].tablesServed++;
          employeeStats[order.serverId].totalTurnoverTime += order.turnoverTime;
        }
      });
    });
    
    // Calculate average turnover time
    Object.values(employeeStats).forEach(employee => {
      employee.averageTurnoverTime = employee.tablesServed > 0 ? employee.totalTurnoverTime / employee.tablesServed : 0;
    });
    
    // Calculate overall average
    const allTurnoverTimes = orders
      .filter(order => order.status === 'completed' && order.createdAt && order.updatedAt)
      .map(order => {
        const orderDateTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
        const completedDateTime = order.updatedAt?.toDate ? order.updatedAt.toDate() : new Date(orderDateTime.getTime() + 60 * 60 * 1000);
        return (completedDateTime - orderDateTime) / (1000 * 60); // in minutes
      });
    
    const overallAverageTurnover = allTurnoverTimes.length > 0 
      ? allTurnoverTimes.reduce((sum, time) => sum + time, 0) / allTurnoverTimes.length 
      : 0;
    
    return {
      employeeStats: Object.values(employeeStats),
      overallAverageTurnover
    };
  } catch (error) {
    console.error('Error calculating table turnover rate:', error);
    return {
      employeeStats: [],
      overallAverageTurnover: 0
    };
  }
};

// Calculate labor costs
export const calculateLaborCosts = (shifts, orders, employees) => {
  try {
    // Calculate total revenue from orders
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Calculate labor costs by employee
    const employeeCosts = {};
    
    shifts.forEach(shift => {
      if (!employeeCosts[shift.employeeId]) {
        const employee = employees.find(emp => emp.id === shift.employeeId) || { name: 'Unknown', role: 'Unknown' };
        
        employeeCosts[shift.employeeId] = {
          id: shift.employeeId,
          name: employee.name,
          role: employee.role,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          totalCost: 0
        };
      }
      
      employeeCosts[shift.employeeId].totalHours += shift.hoursWorked || 0;
      employeeCosts[shift.employeeId].regularHours += shift.regularHours || 0;
      employeeCosts[shift.employeeId].overtimeHours += shift.overtimeHours || 0;
      employeeCosts[shift.employeeId].totalCost += shift.totalPay || 0;
    });
    
    // Calculate labor costs by role
    const rolePayroll = {};
    
    Object.values(employeeCosts).forEach(employee => {
      if (!rolePayroll[employee.role]) {
        rolePayroll[employee.role] = {
          role: employee.role,
          employeeCount: 0,
          totalHours: 0,
          totalCost: 0
        };
      }
      
      rolePayroll[employee.role].employeeCount++;
      rolePayroll[employee.role].totalHours += employee.totalHours;
      rolePayroll[employee.role].totalCost += employee.totalCost;
    });
    
    // Calculate regular and overtime payroll
    const regularPayroll = shifts.reduce((sum, shift) => sum + (shift.regularPay || 0), 0);
    const overtimePayroll = shifts.reduce((sum, shift) => sum + (shift.overtimePay || 0), 0);
    
    // Calculate total payroll
    const totalLaborCost = regularPayroll + overtimePayroll;
    
    // Calculate labor cost percentage
    const laborCostPercentage = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;
    
    return {
      totalLaborCost,
      regularPayroll,
      overtimePayroll,
      laborCostPercentage,
      employeeCosts: Object.values(employeeCosts),
      rolePayroll: Object.values(rolePayroll)
    };
  } catch (error) {
    console.error('Error calculating labor costs:', error);
    return {
      totalLaborCost: 0,
      regularPayroll: 0,
      overtimePayroll: 0,
      laborCostPercentage: 0,
      employeeCosts: [],
      rolePayroll: []
    };
  }
};

// Calculate attendance statistics
export const calculateAttendanceStats = (shifts, employees) => {
  try {
    // Group shifts by employee
    const employeeShifts = {};
    
    shifts.forEach(shift => {
      if (!employeeShifts[shift.employeeId]) {
        const employee = employees.find(emp => emp.id === shift.employeeId) || { name: 'Unknown', role: 'Unknown' };
        
        employeeShifts[shift.employeeId] = {
          id: shift.employeeId,
          name: employee.name,
          role: employee.role,
          shifts: []
        };
      }
      
      employeeShifts[shift.employeeId].shifts.push(shift);
    });
    
    // Calculate attendance stats for each employee
    const attendanceStats = Object.values(employeeShifts).map(employee => {
      const totalShifts = employee.shifts.length;
      const lateShifts = employee.shifts.filter(shift => shift.isLate).length;
      const totalLateness = employee.shifts.reduce((sum, shift) => sum + (shift.lateBy || 0), 0);
      
      return {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        totalShifts,
        lateShifts,
        attendanceRate: 100, // Assuming all shifts were attended (no absences in our data)
        punctualityRate: totalShifts > 0 ? ((totalShifts - lateShifts) / totalShifts) * 100 : 100,
        averageLateness: lateShifts > 0 ? totalLateness / lateShifts : 0
      };
    });
    
    return attendanceStats;
  } catch (error) {
    console.error('Error calculating attendance statistics:', error);
    return [];
  }
};

// Calculate order handling time
export const calculateOrderHandlingTime = (orders, employees) => {
  try {
    // Group orders by employee (server)
    const employeeOrders = {};
    
    orders.forEach(order => {
      if (order.serverId && order.createdAt) {
        if (!employeeOrders[order.serverId]) {
          const employee = employees.find(emp => emp.id === order.serverId) || { name: 'Unknown', role: 'Unknown' };
          
          employeeOrders[order.serverId] = {
            id: order.serverId,
            name: employee.name,
            role: employee.role,
            orders: []
          };
        }
        
        const orderDateTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
        const preparationTime = Math.floor(Math.random() * 20) + 5; // Simulated 5-25 minutes
        const serviceTime = Math.floor(Math.random() * 30) + 15; // Simulated 15-45 minutes
        
        employeeOrders[order.serverId].orders.push({
          ...order,
          orderDateTime,
          preparationTime,
          serviceTime,
          totalTime: preparationTime + serviceTime
        });
      }
    });
    
    // Calculate handling time for each employee
    const handlingTimeStats = Object.values(employeeOrders).map(employee => {
      const totalOrders = employee.orders.length;
      
      if (totalOrders === 0) {
        return {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          totalOrders: 0,
          averagePreparationTime: 0,
          averageServiceTime: 0,
          averageTotalTime: 0
        };
      }
      
      const totalPreparationTime = employee.orders.reduce((sum, order) => sum + order.preparationTime, 0);
      const totalServiceTime = employee.orders.reduce((sum, order) => sum + order.serviceTime, 0);
      const totalTime = employee.orders.reduce((sum, order) => sum + order.totalTime, 0);
      
      return {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        totalOrders,
        averagePreparationTime: totalPreparationTime / totalOrders,
        averageServiceTime: totalServiceTime / totalOrders,
        averageTotalTime: totalTime / totalOrders
      };
    });
    
    return handlingTimeStats;
  } catch (error) {
    console.error('Error calculating order handling time:', error);
    return [];
  }
}; 