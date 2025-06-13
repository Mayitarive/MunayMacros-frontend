/**
 * Storage management for the application
 */

import Utils from './utils.js';

const Storage = {
  /**
   * API Base URL
   */
  API_URL: 'https://food-detection-backend-production.up.railway.app',
  
  /**
   * Storage keys
   */
  KEYS: {
    USER_PROFILE: 'munayMacros_userProfile',
    CURRENT_DATE: 'munayMacros_currentDate'
  },
  
  /**
   * Helper function to normalize meal objects with consistent naming
   * @param {Object} meal - Raw meal object from API
   * @returns {Object} Normalized meal object with name property
   */
  normalizeMeal: function(meal) {
    return {
      ...meal,
      name: meal.food_name || meal.name // Ensure name property exists
    };
  },
  
  /**
   * Get user profile data
   * @returns {Object|null} The user profile data or null if not found
   */
  getUserProfile: function() {
    const profileData = localStorage.getItem(this.KEYS.USER_PROFILE);
    return profileData ? JSON.parse(profileData) : null;
  },
  
  /**
   * Save user profile data and requirements
   * @param {Object} profileData - User profile data 
   */
  saveUserProfile: async function(profileData) {
    try {
      const response = await fetch(`${this.API_URL}/profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileData.name,
          age: profileData.age,
          sex: profileData.sex,
          weight: profileData.weight,
          height: profileData.height,
          activity: profileData.activity,
          goal: profileData.goal
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al guardar el perfil');
      }

      const data = await response.json();
      
      // Save complete profile with requirements
      const completeProfile = {
        ...profileData,
        requirements: data.requirements
      };
      
      localStorage.setItem(this.KEYS.USER_PROFILE, JSON.stringify(completeProfile));
      localStorage.setItem('username', profileData.name);
      
      return completeProfile;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },
  
  /**
   * Get the current username
   * @returns {string|null} The username or null if not set
   */
  getUsername: function() {
    const profile = this.getUserProfile();
    return profile ? profile.name : null;
  },
  
  /**
   * Save food item to daily log via API
   * @param {string} dateKey - Date in YYYY-MM-DD format 
   * @param {Object} foodItem - Food item to save
   */
  addFoodToDay: async function(dateKey, foodItem) {
    const username = this.getUsername();
    if (!username) {
      throw new Error('Por favor ingresa tu nombre de usuario primero');
    }

    try {
      const response = await fetch(`${this.API_URL}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: username,
          food_name: foodItem.name,
          calories: foodItem.calories,
          protein: foodItem.protein,
          carbs: foodItem.carbs,
          fat: foodItem.fat
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al guardar el alimento');
      }

      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },
  
  /**
   * Get foods for a specific day from API
   * @param {string} dateKey - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of food items for the day with normalized names
   */
  getFoodsForDay: async function(dateKey) {
    const username = this.getUsername();
    if (!username) return [];

    try {
      const response = await fetch(
        `${this.API_URL}/daily-log?user=${encodeURIComponent(username)}`
      );
      
      if (!response.ok) {
        console.error('Error fetching daily log:', response.statusText);
        return [];
      }

      const data = await response.json();
      const meals = Array.isArray(data.meals) ? data.meals : [];
      
      // Filter by date and normalize meal objects
      return meals
        .filter(meal => {
          try {
            const mealDate = new Date(meal.created_at).toISOString().split('T')[0];
            return mealDate === dateKey;
          } catch (error) {
            console.error('Error parsing meal date:', meal.created_at, error);
            return false;
          }
        })
        .map(meal => this.normalizeMeal(meal));
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  },
  
  /**
   * Get all user history with normalized meal objects
   * @returns {Promise<Array>} Array of all user meals with normalized names
   */
  getUserHistory: async function() {
    const username = this.getUsername();
    if (!username) return [];

    try {
      const response = await fetch(
        `${this.API_URL}/user-history?user=${encodeURIComponent(username)}`
      );
      
      if (!response.ok) {
        console.error('Error fetching user history:', response.statusText);
        return [];
      }

      const meals = await response.json();
      
      // Normalize all meal objects
      return Array.isArray(meals) ? meals.map(meal => this.normalizeMeal(meal)) : [];
    } catch (error) {
      console.error('Error fetching user history:', error);
      return [];
    }
  },
  
  /**
   * Get the number of foods uploaded for a specific day
   * @param {string} dateKey - Date in YYYY-MM-DD format
   * @returns {Promise<number>} Number of foods recorded for the day
   */
  getFoodCountForDay: async function(dateKey) {
    const foods = await this.getFoodsForDay(dateKey);
    return Array.isArray(foods) ? foods.length : 0;
  },
  
  /**
   * Calculate total nutrients for a specific day
   * @param {string} dateKey - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Total nutrients {calories, protein, carbs, fat}
   */
  calculateDailyTotals: async function(dateKey) {
    const foods = await this.getFoodsForDay(dateKey);
    
    if (!Array.isArray(foods)) {
      console.error('Invalid foods data:', foods);
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }

    return foods.reduce((totals, food) => ({
      calories: totals.calories + (food.calories || 0),
      protein: totals.protein + (food.protein || 0),
      carbs: totals.carbs + (food.carbs || 0),
      fat: totals.fat + (food.fat || 0)
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
  },
  
  /**
   * Get dates with recorded food data from API
   * @returns {Promise<Array<string>>} Array of dates in YYYY-MM-DD format
   */
  getDatesWithData: async function() {
    const username = this.getUsername();
    if (!username) return [];

    try {
      const response = await fetch(
        `${this.API_URL}/history?user=${encodeURIComponent(username)}`
      );
      
      if (!response.ok) {
        console.error('Error fetching history:', response.statusText);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data.dates) ? data.dates : [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  },
  
  /**
   * Get weekly data for charts with normalized meal objects
   * @returns {Promise<Object>} Weekly data with daily totals
   */
  getWeeklyData: async function() {
    const today = new Date();
    const result = {};
    
    // Get data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = Utils.formatDateYMD(date);
      
      result[dateKey] = await this.calculateDailyTotals(dateKey);
    }
    
    return result;
  },
  
  /**
   * Remove a food item from a specific day
   * @param {string} dateKey - Date in YYYY-MM-DD format
   * @param {string} foodId - ID of the food to remove
   */
  removeFoodFromDay: function(dateKey, foodId) {
    // This would need to be implemented with a DELETE endpoint
    // For now, we'll just log the action
    console.log(`Remove food ${foodId} from ${dateKey}`);
  },
  
  /**
   * Save the current date being viewed
   * @param {string} dateKey - Date in YYYY-MM-DD format
   */
  saveCurrentDate: function(dateKey) {
    localStorage.setItem(this.KEYS.CURRENT_DATE, dateKey);
  },
  
  /**
   * Get the current date being viewed
   * @returns {string} Date in YYYY-MM-DD format
   */
  getCurrentDate: function() {
    const storedDate = localStorage.getItem(this.KEYS.CURRENT_DATE);
    
    // If no stored date, return today
    if (!storedDate) {
      return Utils.formatDateYMD(new Date());
    }
    
    // If stored date is older than today, clear it and return today
    const today = Utils.formatDateYMD(new Date());
    if (storedDate < today) {
      localStorage.removeItem(this.KEYS.CURRENT_DATE);
      return today;
    }
    
    return storedDate;
  }
};

export default Storage;