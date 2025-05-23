/**
 * Chart visualization for the application
 */

const Charts = {
  /**
   * Initialize charts
   */
  init: function() {
    // Store chart instances for later updates
    this.macrosChart = null;
    this.progressChart = null;
    
    // Current nutrient being displayed in progress chart
    this.currentProgressNutrient = 'calories';
    
    // Set up chart tabs
    const chartTabs = document.querySelectorAll('.chart-tab');
    if (chartTabs) {
      chartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          chartTabs.forEach(t => t.classList.remove('active'));
          
          // Add active class to clicked tab
          tab.classList.add('active');
          
          // Update progress chart
          this.currentProgressNutrient = tab.dataset.nutrient;
          this.updateProgressChart();
        });
      });
    }
  },
  
  /**
   * Create or update the macros pie chart
   * @param {Object} macros - Current macros {protein, carbs, fat}
   */
  createMacrosChart: function(macros) {
    const ctx = document.getElementById('macros-chart');
    if (!ctx) return;
    
    // Calculate total grams and percentages
    const totalGrams = macros.protein + macros.carbs + macros.fat;
    const proteinPercent = Math.round((macros.protein / totalGrams) * 100);
    const carbsPercent = Math.round((macros.carbs / totalGrams) * 100);
    const fatPercent = Math.round((macros.fat / totalGrams) * 100);
    
    const data = {
      labels: [
        `Proteínas: ${proteinPercent}%`,
        `Carbohidratos: ${carbsPercent}%`,
        `Grasas: ${fatPercent}%`
      ],
      datasets: [{
        data: [macros.protein, macros.carbs, macros.fat],
        backgroundColor: [
          getComputedStyle(document.documentElement).getPropertyValue('--success').trim(), 
          getComputedStyle(document.documentElement).getPropertyValue('--secondary-dark').trim(),
          getComputedStyle(document.documentElement).getPropertyValue('--alert').trim()
        ],
        hoverOffset: 4
      }]
    };
    
    const config = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.formattedValue || '';
                return `${label} (${value}g)`;
              }
            }
          }
        }
      }
    };
    
    // Destroy existing chart if it exists
    if (this.macrosChart) {
      this.macrosChart.destroy();
    }
    
    // Create new chart
    this.macrosChart = new Chart(ctx, config);
  },
  
  /**
   * Create or update the weekly progress chart
   */
  updateProgressChart: async function() {
    const ctx = document.getElementById('progress-chart');
    if (!ctx) return;
    
    try {
      // Get weekly data from storage
      const weeklyData = await Storage.getWeeklyData();
      if (!weeklyData) {
        console.warn('No weekly data available');
        return;
      }
      
      // User profile for target values
      const userProfile = Storage.getUserProfile();
      if (!userProfile) return;
      
      const nutritionalNeeds = Calculator.calculateNutritionalNeeds(userProfile);
      
      // Prepare data for chart
      const dates = Object.keys(weeklyData);
      const actual = dates.map(date => weeklyData[date][this.currentProgressNutrient] || 0);
      const target = new Array(dates.length).fill(nutritionalNeeds[this.currentProgressNutrient]);
      
      // Format dates for display
      const displayDates = dates.map(date => {
        const d = Utils.parseDate(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      });
      
      const data = {
        labels: displayDates,
        datasets: [
          {
            label: 'Consumido',
            data: actual,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
            tension: 0.2
          },
          {
            label: 'Objetivo',
            data: target,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--gray').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--gray').trim(),
            borderDash: [5, 5],
            fill: false
          }
        ]
      };
      
      const config = {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: this.getNutrientUnitLabel(this.currentProgressNutrient)
              }
            },
            x: {
              title: {
                display: true,
                text: 'Fecha'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            }
          }
        }
      };
      
      // Destroy existing chart if it exists
      if (this.progressChart) {
        this.progressChart.destroy();
      }
      
      // Create new chart
      this.progressChart = new Chart(ctx, config);
    } catch (error) {
      console.error('Error updating progress chart:', error);
    }
  },
  
  /**
   * Get the unit label for a nutrient
   * @param {string} nutrient - Nutrient key
   * @returns {string} Unit label
   */
  getNutrientUnitLabel: function(nutrient) {
    switch (nutrient) {
      case 'calories': return 'Calorías (kcal)';
      case 'protein': return 'Proteínas (g)';
      case 'carbs': return 'Carbohidratos (g)';
      case 'fat': return 'Grasas (g)';
      default: return nutrient;
    }
  },
  
  /**
   * Generate insights based on nutrition data
   * @param {Object} evaluation - Nutrition evaluation
   * @returns {string} HTML content with insights
   */
  generateInsights: function(evaluation) {
    let insightHtml = '';
    
    // Overall calorie status
    if (evaluation.calories.status === 'deficit' && evaluation.calories.percentOfTarget < 70) {
      insightHtml += `<p class="insight-item alert-warning">⚠️ <strong>Déficit calórico importante:</strong> 
        Estás consumiendo solo el ${evaluation.calories.percentOfTarget}% de tus calorías recomendadas. 
        Considera aumentar tu ingesta para mantener tu energía y metabolismo.</p>`;
    } else if (evaluation.calories.status === 'surplus' && evaluation.calories.percentOfTarget > 130) {
      insightHtml += `<p class="insight-item alert-warning">⚠️ <strong>Exceso calórico:</strong> 
        Has consumido un ${evaluation.calories.percentOfTarget - 100}% más de calorías de las recomendadas.</p>`;
    } else if (evaluation.calories.percentOfTarget >= 90 && evaluation.calories.percentOfTarget <= 110) {
      insightHtml += `<p class="insight-item alert-success">✅ <strong>Excelente balance calórico:</strong> 
        Has consumido cerca del 100% de tus calorías recomendadas.</p>`;
    }
    
    // Protein status
    if (evaluation.protein.status === 'deficit') {
      insightHtml += `<p class="insight-item">🥩 <strong>Bajo en proteínas:</strong> 
        Considera añadir más alimentos ricos en proteínas como charque, tarwi o habas.</p>`;
    } else if (evaluation.protein.percentOfTarget >= 90 && evaluation.protein.percentOfTarget <= 110) {
      insightHtml += `<p class="insight-item alert-success">✅ <strong>Buena ingesta de proteínas:</strong> 
        Estás en el rango ideal para mantener tu masa muscular.</p>`;
    }
    
    // Carbs status
    if (evaluation.carbs.status === 'deficit') {
      insightHtml += `<p class="insight-item">🌽 <strong>Bajo en carbohidratos:</strong> 
        Considera añadir más granos, tubérculos o frutas para tu energía diaria.</p>`;
    } else if (evaluation.carbs.status === 'surplus' && evaluation.carbs.percentOfTarget > 150) {
      insightHtml += `<p class="insight-item">🍚 <strong>Alto consumo de carbohidratos:</strong> 
        Considera equilibrar con más proteínas y grasas saludables.</p>`;
    }
    
    // Fat status
    if (evaluation.fat.status === 'deficit') {
      insightHtml += `<p class="insight-item">🥑 <strong>Bajo en grasas:</strong> 
        Las grasas saludables son importantes. Considera añadir maní, tarwi o aguacate.</p>`;
    } else if (evaluation.fat.status === 'surplus' && evaluation.fat.percentOfTarget > 130) {
      insightHtml += `<p class="insight-item">🍗 <strong>Alto consumo de grasas:</strong> 
        Observa si son grasas saludables o grasas saturadas.</p>`;
    }
    
    // If no specific insights, provide general feedback
    if (insightHtml === '') {
      insightHtml = `<p class="insight-item alert-success">✅ <strong>Buena distribución de macronutrientes:</strong> 
        Tu alimentación está bien equilibrada hoy. ¡Continúa así!</p>`;
    }
    
    return insightHtml;
  }
};