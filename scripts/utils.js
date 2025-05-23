/**
 * Utility functions for the application
 */

const Utils = {
  /**
   * Format a date to a readable string
   * @param {Date} date - The date to format
   * @param {boolean} includeDay - Whether to include the day name
   * @returns {string} Formatted date string
   */
  formatDate: function(date, includeDay = true) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    if (includeDay) {
      const dayName = days[date.getDay()];
      return `${dayName}, ${day} de ${month} de ${year}`;
    } else {
      return `${day} de ${month} de ${year}`;
    }
  },
  
  /**
   * Format a date to YYYY-MM-DD format
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatDateYMD: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  /**
   * Parse a YYYY-MM-DD string to a Date object
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {Date} Date object
   */
  parseDate: function(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  },
  
  /**
   * Check if two dates are the same day
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} True if same day
   */
  isSameDay: function(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  },
  
  /**
   * Get the Spanish name for a nutrient
   * @param {string} nutrient - Nutrient key
   * @returns {string} Spanish name of the nutrient
   */
  getNutrientName: function(nutrient) {
    switch (nutrient) {
      case 'protein': return 'Proteínas';
      case 'carbs': return 'Carbohidratos';
      case 'fat': return 'Grasas';
      case 'calories': return 'Calorías';
      default: return nutrient;
    }
  },
  
  /**
   * Update progress bars and counters
   * @param {Object} current - Current macros {calories, protein, carbs, fat}
   * @param {Object} target - Target macros {calories, protein, carbs, fat}
   */
  updateProgressBars: function(current, target) {
    // Update daily tracking progress bars
    for (const nutrient of ['calories', 'protein', 'carbs', 'fat']) {
      const progressBar = document.getElementById(`${nutrient}-progress`);
      const currentSpan = document.getElementById(`${nutrient}-current`);
      const targetSpan = document.getElementById(`${nutrient}-target`);
      
      const percent = Math.min(Math.round((current[nutrient] / target[nutrient]) * 100), 100);
      
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (currentSpan) currentSpan.textContent = Math.round(current[nutrient]);
      if (targetSpan) targetSpan.textContent = Math.round(target[nutrient]);
    }
    
    // Update report summary if visible
    if (document.getElementById('summary-calories-current')) {
      for (const nutrient of ['calories', 'protein', 'carbs', 'fat']) {
        const currentSpan = document.getElementById(`summary-${nutrient}-current`);
        const targetSpan = document.getElementById(`summary-${nutrient}-target`);
        const percentSpan = document.getElementById(`summary-${nutrient}-percent`);
        
        const percent = Math.round((current[nutrient] / target[nutrient]) * 100);
        
        if (currentSpan) currentSpan.textContent = Math.round(current[nutrient]);
        if (targetSpan) targetSpan.textContent = Math.round(target[nutrient]);
        if (percentSpan) percentSpan.textContent = `${percent}%`;
      }
    }
  },
  
  /**
   * Display a message to the user
   * @param {string} message - The message to display
   * @param {string} type - The type of message (success, error, info)
   * @param {number} duration - How long to show the message in ms
   */
  showMessage: function(message, type = 'info', duration = 3000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type} message-alert`;
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.maxWidth = '300px';
    messageDiv.style.animation = 'slideIn 0.3s forwards';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.style.animation = 'slideOut 0.3s forwards';
      setTimeout(() => {
        document.body.removeChild(messageDiv);
      }, 300);
    }, duration);
  },
  
  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};