/**
 * Nutrition calculator for determining user's macronutrient needs
 */

const Calculator = {
  /**
   * Calculate all nutritional needs based on user profile
   * @param {Object} profileData - User profile data
   * @returns {Object} Nutritional needs {calories, protein, carbs, fat}
   */
  calculateNutritionalNeeds: function(profileData) {
    // Use requirements from profile if available
    if (profileData.requirements) {
      return {
        calories: profileData.requirements.calories,
        protein: profileData.requirements.protein,
        carbs: profileData.requirements.carbs,
        fat: profileData.requirements.fat
      };
    }

    // Fallback to local calculation if no requirements available
    const bmr = this.calculateBMR(profileData);
    const tdee = this.calculateTDEE(bmr, parseFloat(profileData.activity));
    const macros = this.calculateMacros(tdee);
    
    return {
      calories: Math.round(tdee),
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat
    };
  },
  
  /**
   * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor formula
   * @param {Object} profileData - User profile data
   * @returns {number} BMR in calories
   */
  calculateBMR: function(profileData) {
    const { weight, height, age, sex } = profileData;
    
    if (sex === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  },
  
  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   * @param {number} bmr - Basal Metabolic Rate
   * @param {number} activityLevel - Activity multiplier
   * @returns {number} TDEE in calories
   */
  calculateTDEE: function(bmr, activityLevel) {
    return bmr * activityLevel;
  },
  
  /**
   * Calculate recommended macronutrients based on calorie needs
   * @param {number} tdee - Total Daily Energy Expenditure
   * @returns {Object} Recommended macros {protein, carbs, fat}
   */
  calculateMacros: function(tdee) {
    const protein = (tdee * 0.30) / 4;
    const carbs = (tdee * 0.45) / 4;
    const fat = (tdee * 0.25) / 9;
    
    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat)
    };
  },
  
  /**
   * Evaluate the user's current intake compared to their targets
   * @param {Object} current - Current macros {calories, protein, carbs, fat}
   * @param {Object} target - Target macros {calories, protein, carbs, fat}
   * @returns {Object} Evaluation of deficits/surpluses
   */
  evaluateNutrition: function(current, target) {
    const evaluation = {
      calories: {
        status: 'ok',
        difference: 0,
        percentOfTarget: 0
      },
      protein: {
        status: 'ok',
        difference: 0,
        percentOfTarget: 0
      },
      carbs: {
        status: 'ok',
        difference: 0,
        percentOfTarget: 0
      },
      fat: {
        status: 'ok',
        difference: 0,
        percentOfTarget: 0
      }
    };
    
    for (const nutrient of ['calories', 'protein', 'carbs', 'fat']) {
      const diff = current[nutrient] - target[nutrient];
      const percent = Math.round((current[nutrient] / target[nutrient]) * 100);
      
      evaluation[nutrient].difference = diff;
      evaluation[nutrient].percentOfTarget = percent;
      
      if (percent < 80) {
        evaluation[nutrient].status = 'deficit';
      } else if (percent > 120) {
        evaluation[nutrient].status = 'surplus';
      } else {
        evaluation[nutrient].status = 'ok';
      }
    }
    
    return evaluation;
  }
};