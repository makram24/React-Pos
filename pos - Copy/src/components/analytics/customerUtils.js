import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';

// Fetch customer feedback by date range
export const fetchCustomerFeedback = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const feedbackRef = collection(db, 'customerFeedback');
    const q = query(
      feedbackRef,
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching customer feedback:', error);
    return [];
  }
};

// Analyze feedback ratings
export const analyzeFeedbackRatings = (feedback) => {
  try {
    // Count ratings
    const ratingCounts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    feedback.forEach(item => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingCounts[item.rating]++;
      }
    });
    
    // Calculate total ratings
    const totalRatings = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
    
    // Calculate average rating
    let ratingSum = 0;
    for (let rating = 1; rating <= 5; rating++) {
      ratingSum += rating * ratingCounts[rating];
    }
    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;
    
    // Calculate percentages
    const ratingPercentages = {};
    for (let rating = 1; rating <= 5; rating++) {
      ratingPercentages[rating] = totalRatings > 0 ? (ratingCounts[rating] / totalRatings) * 100 : 0;
    }
    
    // Analyze category ratings
    const categoryRatings = {
      food: { total: 0, count: 0, average: 0 },
      service: { total: 0, count: 0, average: 0 },
      ambience: { total: 0, count: 0, average: 0 },
      value: { total: 0, count: 0, average: 0 }
    };
    
    feedback.forEach(item => {
      if (item.categories) {
        for (const category in categoryRatings) {
          if (item.categories[category]) {
            categoryRatings[category].total += item.categories[category];
            categoryRatings[category].count++;
          }
        }
      }
    });
    
    // Calculate average category ratings
    for (const category in categoryRatings) {
      categoryRatings[category].average = categoryRatings[category].count > 0
        ? categoryRatings[category].total / categoryRatings[category].count
        : 0;
    }
    
    return {
      ratingCounts,
      totalRatings,
      averageRating,
      ratingPercentages,
      categoryRatings
    };
  } catch (error) {
    console.error('Error analyzing feedback ratings:', error);
    return {
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalRatings: 0,
      averageRating: 0,
      ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryRatings: {
        food: { total: 0, count: 0, average: 0 },
        service: { total: 0, count: 0, average: 0 },
        ambience: { total: 0, count: 0, average: 0 },
        value: { total: 0, count: 0, average: 0 }
      }
    };
  }
};

// Analyze feedback comments
export const analyzeFeedbackComments = (feedback) => {
  try {
    // Simple sentiment analysis based on rating
    const sentiments = {
      food: { positive: 0, negative: 0, neutral: 0 },
      service: { positive: 0, negative: 0, neutral: 0 },
      cleanliness: { positive: 0, negative: 0, neutral: 0 },
      value: { positive: 0, negative: 0, neutral: 0 },
      overall: { positive: 0, negative: 0, neutral: 0 }
    };
    
    // Keywords for each category
    const keywords = {
      food: ['food', 'meal', 'dish', 'taste', 'delicious', 'flavor', 'menu', 'cooked', 'fresh', 'chef'],
      service: ['service', 'staff', 'waiter', 'waitress', 'server', 'attentive', 'friendly', 'quick', 'slow'],
      cleanliness: ['clean', 'dirty', 'hygiene', 'sanitary', 'spotless', 'tidy', 'mess', 'neat'],
      value: ['price', 'expensive', 'cheap', 'value', 'worth', 'cost', 'overpriced', 'affordable']
    };
    
    feedback.forEach(item => {
      let sentiment;
      if (item.rating >= 4) sentiment = 'positive';
      else if (item.rating <= 2) sentiment = 'negative';
      else sentiment = 'neutral';
      
      // Increment overall sentiment
      sentiments.overall[sentiment]++;
      
      // Check comment for category keywords if comment exists
      if (item.comment) {
        const comment = item.comment.toLowerCase();
        
        for (const category in keywords) {
          // Check if any keyword from the category is in the comment
          const matchesCategory = keywords[category].some(keyword => comment.includes(keyword));
          
          if (matchesCategory) {
            sentiments[category][sentiment]++;
          }
        }
      }
    });
    
    return sentiments;
  } catch (error) {
    console.error('Error analyzing feedback comments:', error);
    return {
      food: { positive: 0, negative: 0, neutral: 0 },
      service: { positive: 0, negative: 0, neutral: 0 },
      cleanliness: { positive: 0, negative: 0, neutral: 0 },
      value: { positive: 0, negative: 0, neutral: 0 },
      overall: { positive: 0, negative: 0, neutral: 0 }
    };
  }
};

// Analyze order preferences
export const analyzeOrderPreferences = (orders) => {
  try {
    // Track item popularity
    const itemPopularity = {};
    const categoryPopularity = {};
    const dietaryPreferences = {
      vegetarian: 0,
      vegan: 0,
      glutenFree: 0,
      dairyFree: 0,
      organic: 0,
      spicy: 0
    };
    
    // Process each order
    orders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach(item => {
        // Track item popularity
        if (!itemPopularity[item.id]) {
          itemPopularity[item.id] = {
            id: item.id,
            name: item.name,
            category: item.category,
            count: 0,
            totalRevenue: 0
          };
        }
        
        const quantity = item.quantity || 1;
        itemPopularity[item.id].count += quantity;
        itemPopularity[item.id].totalRevenue += (item.price || 0) * quantity;
        
        // Track category popularity
        const category = item.category || 'Uncategorized';
        if (!categoryPopularity[category]) {
          categoryPopularity[category] = {
            name: category,
            count: 0,
            totalRevenue: 0
          };
        }
        
        categoryPopularity[category].count += quantity;
        categoryPopularity[category].totalRevenue += (item.price || 0) * quantity;
        
        // Track dietary preferences (using item name as proxy for demo)
        const itemName = item.name.toLowerCase();
        if (itemName.includes('veg')) dietaryPreferences.vegetarian += quantity;
        if (itemName.includes('vegan')) dietaryPreferences.vegan += quantity;
        if (itemName.includes('gluten') || itemName.includes('gf')) dietaryPreferences.glutenFree += quantity;
        if (itemName.includes('dairy-free')) dietaryPreferences.dairyFree += quantity;
        if (itemName.includes('organic')) dietaryPreferences.organic += quantity;
        if (itemName.includes('spicy')) dietaryPreferences.spicy += quantity;
      });
    });
    
    // Convert to arrays and sort
    const items = Object.values(itemPopularity).sort((a, b) => b.count - a.count);
    const categories = Object.values(categoryPopularity).sort((a, b) => b.count - a.count);
    
    return {
      items,
      categories,
      dietaryPreferences
    };
  } catch (error) {
    console.error('Error analyzing order preferences:', error);
    return {
      items: [],
      categories: [],
      dietaryPreferences: {
        vegetarian: 0,
        vegan: 0,
        glutenFree: 0,
        dairyFree: 0,
        organic: 0,
        spicy: 0
      }
    };
  }
}; 