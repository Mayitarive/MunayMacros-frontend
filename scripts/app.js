/**
 * Main application controller
 */

const App = {
  /**
   * Initialize the application
   */
  init: async function() {
    // Initialize all components
    this.setupNavigation();
    FoodUpload.init();
    Charts.init();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check if user has profile data
    const userProfile = Storage.getUserProfile();
    if (userProfile) {
      // User exists, load their data
      this.showSection('daily');
      await this.updateDailyProgress();
      await this.updateFoodsList();
      
      // Update page title with user name
      document.title = `MunayMacros - ${userProfile.name}`;
    } else {
      // New user, start with home page
      this.showSection('home');
    }
    
    // Set current date
    this.updateCurrentDate();
  },

  /**
   * Convert activity level code to backend format
   * @param {string} code - Activity level code
   * @returns {string} Backend activity level
   */
  convertActivityCodeToLevel: function(code) {
    switch (code) {
      case "1.2": return "sedentary";
      case "1.55": return "active";
      case "1.9": return "very_active";
      default: return "sedentary";
    }
  },
  
  /**
   * Set up navigation between sections
   */
  setupNavigation: function() {
    // Handle navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href')?.substring(1);
        if (targetId) {
          this.showSection(targetId);
          
          // Update active state of nav links
          navLinks.forEach(navLink => {
            navLink.classList.remove('active');
          });
          link.classList.add('active');
        }
      });
    });
    
    // Start button on home page
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.showSection('profile');
      });
    }
    
    // Continue button on profile page
    const continueToDaily = document.getElementById('continue-to-daily');
    if (continueToDaily) {
      continueToDaily.addEventListener('click', () => {
        this.showSection('daily');
      });
    }
    
    // View report button
    const viewReportBtn = document.getElementById('view-report-btn');
    if (viewReportBtn) {
      viewReportBtn.addEventListener('click', () => {
        this.showSection('report');
        this.updateReport();
      });
    }
  },
  
  /**
   * Set up event listeners for the application
   */
  setupEventListeners: function() {
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUserProfile();
      });
    }
    
    // Date navigation buttons
    const prevDay = document.getElementById('prev-day');
    const nextDay = document.getElementById('next-day');
    
    if (prevDay) {
      prevDay.addEventListener('click', () => {
        this.changeDate(-1);
      });
    }
    
    if (nextDay) {
      nextDay.addEventListener('click', () => {
        this.changeDate(1);
      });
    }
    
    // Report date navigation
    const reportPrevDay = document.getElementById('report-prev-day');
    const reportNextDay = document.getElementById('report-next-day');
    
    if (reportPrevDay) {
      reportPrevDay.addEventListener('click', () => {
        this.changeDate(-1);
        this.updateReport();
      });
    }
    
    if (reportNextDay) {
      reportNextDay.addEventListener('click', () => {
        this.changeDate(1);
        this.updateReport();
      });
    }
    
    // Generate calendar for history view
    this.generateCalendar();
  },
  
  /**
   * Show a specific section and hide others
   * @param {string} sectionId - ID of the section to show
   */
  showSection: function(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      section.classList.remove('active');
    });
    
    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
      
      // Scroll to top
      window.scrollTo(0, 0);
      
      // Update the active nav link
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
      
      // Special section-specific updates
      if (sectionId === 'daily') {
        this.updateCurrentDate();
        this.updateDailyProgress();
        this.updateFoodsList();
        this.updateUploadCounter();
        this.updateRecommendations();
      } else if (sectionId === 'report') {
        this.updateReport();
      } else if (sectionId === 'history') {
        this.generateCalendar();
      }
    }
  },
  
  /**
   * Save user profile from the form
   */
  saveUserProfile: async function() {
    const form = document.getElementById('profile-form');
    
    // Check form validity
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    
    // Validate goal selection
    const goalInput = document.querySelector('input[name="goal"]:checked');
    if (!goalInput) {
      Utils.showMessage('Debes seleccionar un objetivo', 'error');
      return;
    }
    
    // Collect form data
    const name = document.getElementById('name').value;
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseInt(document.getElementById('height').value);
    const gender = document.querySelector('input[name="sex"]:checked').value;
    const activityLevel = document.getElementById('activity').value;
    const goal = goalInput.value;
    
    // Create profile object with correct backend format
    const profileData = {
      name,
      age,
      sex: gender,
      weight,
      height,
      activity: this.convertActivityCodeToLevel(activityLevel),
      goal
    };
    
    try {
      // Save to storage and backend
      const savedProfile = await Storage.saveUserProfile(profileData);
      
      // Show results
      document.getElementById('calories-result').textContent = savedProfile.requirements.calories;
      document.getElementById('protein-result').textContent = savedProfile.requirements.protein;
      document.getElementById('carbs-result').textContent = savedProfile.requirements.carbs;
      document.getElementById('fat-result').textContent = savedProfile.requirements.fat;
      
      // Show results section
      document.getElementById('results').classList.remove('d-none');
      document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Update page title with user name
      document.title = `MunayMacros - ${name}`;
      
      Utils.showMessage('Perfil guardado con éxito', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      Utils.showMessage('Error al guardar el perfil', 'error');
    }
  },
  
  /**
   * Update the current date display
   */
  updateCurrentDate: function() {
    const currentDateEl = document.getElementById('current-date');
    const reportDateEl = document.getElementById('report-date');
    
    const currentDate = Storage.getCurrentDate();
    const date = Utils.parseDate(currentDate);
    
    const today = new Date();
    const isToday = Utils.isSameDay(date, today);
    
    const dateStr = isToday ? 
      `Hoy, ${Utils.formatDate(date, false)}` : 
      Utils.formatDate(date);
    
    if (currentDateEl) currentDateEl.textContent = dateStr;
    if (reportDateEl) reportDateEl.textContent = dateStr;
  },
  
  /**
   * Change the current date
   * @param {number} delta - Number of days to add (+1) or subtract (-1)
   */
  changeDate: function(delta) {
    const currentDate = Storage.getCurrentDate();
    const date = Utils.parseDate(currentDate);
    
    // Add/subtract days
    date.setDate(date.getDate() + delta);
    
    // Don't allow future dates
    const today = new Date();
    if (date > today) {
      date.setTime(today.getTime());
      Utils.showMessage('No puedes ver fechas futuras', 'info');
    }
    
    // Save new date
    const newDateKey = Utils.formatDateYMD(date);
    Storage.saveCurrentDate(newDateKey);
    
    // Update UI
    this.updateCurrentDate();
    this.updateDailyProgress();
    this.updateFoodsList();
    this.updateUploadCounter();
    this.updateRecommendations();
  },
  
  /**
   * Update daily progress bars and counters
   */
  updateDailyProgress: async function() {
    const userProfile = Storage.getUserProfile();
    if (!userProfile) return;
    
    const currentDate = Storage.getCurrentDate();
    
    try {
      // Calculate target nutrients
      const target = Calculator.calculateNutritionalNeeds(userProfile);
      
      // Get current totals for the day
      const current = await Storage.calculateDailyTotals(currentDate);
      
      // Update progress bars and values
      const nutrients = ['calories', 'protein', 'carbs', 'fat'];
      
      nutrients.forEach(nutrient => {
        const progressBar = document.getElementById(`${nutrient}-progress`);
        const currentSpan = document.getElementById(`${nutrient}-current`);
        const targetSpan = document.getElementById(`${nutrient}-target`);
        
        if (progressBar && currentSpan && targetSpan) {
          // Calculate percentage (max 100%)
          const percent = Math.min(Math.round((current[nutrient] / target[nutrient]) * 100), 100);
          
          // Update progress bar width
          progressBar.style.width = `${percent}%`;
          progressBar.setAttribute('aria-valuenow', percent.toString());
          
          // Update current and target values
          currentSpan.textContent = Math.round(current[nutrient]);
          targetSpan.textContent = Math.round(target[nutrient]);
        }
      });
      
      // Update progress chart if it exists
      if (typeof Charts !== 'undefined' && Charts.updateProgressChart) {
        await Charts.updateProgressChart();
      }
    } catch (error) {
      console.error('Error updating daily progress:', error);
      Utils.showMessage('Error al actualizar el progreso diario', 'error');
    }
  },
  
  /**
   * Update the foods list for the current day
   */
  updateFoodsList: async function() {
    const foodsList = document.getElementById('foods-list');
    if (!foodsList) return;
    
    const currentDate = Storage.getCurrentDate();
    const foods = await Storage.getFoodsForDay(currentDate);
    
    // Clear the list
    foodsList.innerHTML = '';
    
    if (!Array.isArray(foods) || foods.length === 0) {
      // Show no foods message
      const noFoodsMessage = document.createElement('li');
      noFoodsMessage.className = 'list-group-item text-center text-muted';
      noFoodsMessage.id = 'no-foods-message';
      noFoodsMessage.textContent = 'No hay comidas registradas para hoy';
      foodsList.appendChild(noFoodsMessage);
      return;
    }
    
    // Add each food to the list
    foods.forEach(food => {
      const listItem = document.createElement('li');
      listItem.className = 'list-group-item food-item';
      listItem.dataset.id = food.id;
      
      const content = `
        <div>
          <div class="food-item-name">${food.name}</div>
          <div class="food-item-macros">
            <span>${food.calories} kcal</span> | 
            <span>P: ${food.protein}g</span> | 
            <span>C: ${food.carbs}g</span> | 
            <span>G: ${food.fat}g</span>
          </div>
        </div>
        <div class="food-item-remove">×</div>
      `;
      
      listItem.innerHTML = content;
      
      // Add event listener for removal
      const removeBtn = listItem.querySelector('.food-item-remove');
      removeBtn.addEventListener('click', () => {
        this.removeFood(food.id);
      });
      
      foodsList.appendChild(listItem);
    });
  },
  
  /**
   * Remove a food item
   * @param {string} foodId - ID of the food to remove
   */
  removeFood: function(foodId) {
    const currentDate = Storage.getCurrentDate();
    
    // Remove from storage
    Storage.removeFoodFromDay(currentDate, foodId);
    
    // Update UI
    this.updateFoodsList();
    this.updateDailyProgress();
    this.updateUploadCounter();
    this.updateRecommendations();
    
    Utils.showMessage('Comida eliminada', 'info');
  },
  
  /**
   * Update the upload counter for the current day
   */
  updateUploadCounter: async function() {
    const uploadCountEl = document.getElementById('upload-count');
    if (!uploadCountEl) return;
    
    const currentDate = Storage.getCurrentDate();
    const count = await Storage.getFoodCountForDay(currentDate);
    
    uploadCountEl.textContent = count;
  },
  
  /**
   * Update food recommendations based on current nutritional needs
   */
  updateRecommendations: async function() {
    const recommendationsContainer = document.getElementById('recommendations');
    const recommendationsList = document.getElementById('recommendations-list');
    
    if (!recommendationsContainer || !recommendationsList) return;
    
    const userProfile = Storage.getUserProfile();
    if (!userProfile) return;
    
    const currentDate = Storage.getCurrentDate();
    
    try {
      // Calculate target nutrients
      const target = Calculator.calculateNutritionalNeeds(userProfile);
      
      // Get current totals for the day
      const current = await Storage.calculateDailyTotals(currentDate);
      
      // Evaluate nutrition
      const evaluation = Calculator.evaluateNutrition(current, target);
      
      // Get recommendations
      const { balance, recommendations } = Recommendations.getRecommendations(evaluation);
      
      // Clear the list
      recommendationsList.innerHTML = '';
      
      // Create balance summary card
      const balanceCard = document.createElement('div');
      balanceCard.className = 'col-12 mb-4';
      
      let balanceContent = '';
      if (balance.isBalanced) {
        balanceContent = `
          <div class="alert alert-success">
            <h5 class="mb-0">¡Tu ingesta está equilibrada hoy!</h5>
          </div>
        `;
      } else {
        let deficitText = '';
        let excessText = '';
        
        if (balance.deficits.length > 0) {
          deficitText = `
            <div class="alert alert-warning">
              <h5>Te faltan:</h5>
              <ul class="mb-0">
                ${balance.deficits.map(d => `<li>${d.amount}g de ${d.nutrient}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        if (balance.excesses.length > 0) {
          excessText = `
            <div class="alert alert-danger">
              <h5>Te excedes en:</h5>
              <ul class="mb-0">
                ${balance.excesses.map(e => `<li>${e.amount}g de ${e.nutrient}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        balanceContent = deficitText + excessText;
      }
      
      balanceCard.innerHTML = balanceContent;
      recommendationsList.appendChild(balanceCard);
      
      // Add food recommendations if any
      if (recommendations.length > 0) {
        recommendations.forEach(rec => {
          const col = document.createElement('div');
          col.className = 'col-md-4 mb-3';
          
          const card = document.createElement('div');
          card.className = 'recommendation-card';
          
          const content = `
            <div class="food-suggestion">
              <h5 class="mb-2">${rec.name}</h5>
              <div class="food-macros mb-2">
                ${rec.macros.calories} kcal | ${rec.macros.protein}g proteínas | 
                ${rec.macros.carbs}g carbohidratos | ${rec.macros.fat}g grasas
              </div>
              <p class="text-muted small mb-0">${rec.description}</p>
            </div>
          `;
          
          card.innerHTML = content;
          col.appendChild(card);
          recommendationsList.appendChild(col);
        });
      }
      
      // Show recommendations section
      recommendationsContainer.classList.remove('d-none');
    } catch (error) {
      console.error('Error updating recommendations:', error);
      recommendationsContainer.classList.add('d-none');
    }
  },
  
  /**
   * Generate the calendar for the history view
   */
  generateCalendar: async function() {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;
    
    // Clear the calendar
    calendarContainer.innerHTML = '';
    
    // Get dates with data
    const datesWithData = await Storage.getDatesWithData();
    
    if (!Array.isArray(datesWithData)) {
      console.error('Invalid datesWithData:', datesWithData);
      return;
    }
    
    // Get current date
    const today = new Date();
    
    // Calculate start date (30 days ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 29);
    
    // Add weekday headers
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    weekdays.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-weekday';
      dayHeader.textContent = day;
      calendarContainer.appendChild(dayHeader);
    });
    
    // Fill in days before the start date to align with weekday
    const startDay = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day disabled';
      calendarContainer.appendChild(emptyDay);
    }
    
    // Generate calendar days
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const day = document.createElement('div');
      day.className = 'calendar-day';
      day.textContent = currentDate.getDate();
      
      const dateKey = Utils.formatDateYMD(currentDate);
      
      // Check if this day has data
      if (datesWithData.includes(dateKey)) {
        day.classList.add('has-data');
      }
      
      // Check if this is today
      if (Utils.isSameDay(currentDate, today)) {
        day.classList.add('today');
      }
      
      // Add click event to view day details
      day.addEventListener('click', () => {
        this.viewHistoryDate(dateKey);
      });
      
      calendarContainer.appendChild(day);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  },
  
  /**
   * View history for a specific date
   * @param {string} dateKey - Date in YYYY-MM-DD format
   */
  viewHistoryDate: async function(dateKey) {
    // Update active day in calendar
    const calendarDays = document.querySelectorAll('.calendar-day');
    calendarDays.forEach(day => {
      day.classList.remove('active');
    });
    
    const selectedDate = Utils.parseDate(dateKey);
    const dayElement = Array.from(calendarDays).find(day => {
      if (day.classList.contains('disabled')) return false;
      const dayNum = parseInt(day.textContent || '0');
      return dayNum === selectedDate.getDate();
    });
    
    if (dayElement) {
      dayElement.classList.add('active');
    }
    
    // Show history details
    const historyDetails = document.getElementById('history-details');
    const historyDate = document.getElementById('history-date');
    const historyFoodsList = document.getElementById('history-foods-list');
    
    if (!historyDetails || !historyDate || !historyFoodsList) return;
    
    historyDetails.classList.remove('d-none');
    
    // Set date
    historyDate.textContent = Utils.formatDate(selectedDate);
    
    try {
      // Get foods for this date
      const foods = await Storage.getFoodsForDay(dateKey);
      
      // Clear the foods list
      historyFoodsList.innerHTML = '';
      
      if (!Array.isArray(foods) || foods.length === 0) {
        // Show no foods message
        const noFoodsMessage = document.createElement('li');
        noFoodsMessage.className = 'list-group-item text-center text-muted';
        noFoodsMessage.textContent = 'No hay comidas registradas para este día';
        historyFoodsList.appendChild(noFoodsMessage);
      } else {
        // Add each food to the list
        foods.forEach(food => {
          const listItem = document.createElement('li');
          listItem.className = 'list-group-item';
          
          const content = `
            <div class="food-item-name">${food.name}</div>
            <div class="food-item-macros">
              <span>${food.calories} kcal</span> | 
              <span>P: ${food.protein}g</span> | 
              <span>C: ${food.carbs}g</span> | 
              <span>G: ${food.fat}g</span>
            </div>
          `;
          
          listItem.innerHTML = content;
          historyFoodsList.appendChild(listItem);
        });
      }
      
      // Update history summary
      const totals = await Storage.calculateDailyTotals(dateKey);
      
      document.getElementById('history-calories').textContent = `${Math.round(totals.calories)} kcal`;
      document.getElementById('history-protein').textContent = `${Math.round(totals.protein)} g`;
      document.getElementById('history-carbs').textContent = `${Math.round(totals.carbs)} g`;
      document.getElementById('history-fat').textContent = `${Math.round(totals.fat)} g`;
    } catch (error) {
      console.error('Error viewing history date:', error);
      Utils.showMessage('Error al cargar el historial', 'error');
    }
  },
  
  /**
   * Update the report view
   */
  updateReport: async function() {
    const userProfile = Storage.getUserProfile();
    if (!userProfile) return;
    
    const currentDate = Storage.getCurrentDate();
    
    try {
      // Calculate target nutrients
      const target = Calculator.calculateNutritionalNeeds(userProfile);
      
      // Get current totals for the day
      const current = await Storage.calculateDailyTotals(currentDate);
      
      // Update summary
      Utils.updateProgressBars(current, target);
      
      // Create/update charts
      Charts.createMacrosChart(current);
      await Charts.updateProgressChart();
      
      // Generate insights
      const evaluation = Calculator.evaluateNutrition(current, target);
      const insightContent = document.getElementById('report-insight-content');
      
      if (insightContent) {
        // Replace static insights with dynamic recommendations
        await App.updateRecommendations();
      }
    } catch (error) {
      console.error('Error updating report:', error);
      Utils.showMessage('Error al actualizar el reporte', 'error');
    }
  }
};

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});