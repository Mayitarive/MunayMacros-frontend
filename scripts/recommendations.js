/**
 * Food recommendations based on nutritional needs
 */

const Recommendations = {
  /**
   * List of Bolivian foods with their nutritional data
   */
  bolivianFoods: [
    {
      name: 'Quinoa',
      calories: 120,
      protein: 4.4,
      carbs: 21.3,
      fat: 1.9,
      description: 'Cereal andino ancestral, rico en proteínas completas y fibra. Base de la alimentación tradicional boliviana.'
    },
    {
      name: 'Charque',
      calories: 150,
      protein: 30,
      carbs: 0,
      fat: 3.5,
      description: 'Carne deshidratada tradicional de los valles bolivianos, excelente fuente de proteína y hierro.'
    },
    {
      name: 'Chuño',
      calories: 160,
      protein: 1.9,
      carbs: 38,
      fat: 0.2,
      description: 'Papa deshidratada mediante técnica ancestral andina, rica en carbohidratos complejos y almidón resistente.'
    },
    {
      name: 'Camote',
      calories: 86,
      protein: 1.6,
      carbs: 20.1,
      fat: 0.1,
      description: 'Tubérculo dulce nativo, rico en betacarotenos y vitamina A, cultivado en los valles bolivianos.'
    },
    {
      name: 'Tarwi',
      calories: 150,
      protein: 15.5,
      carbs: 9.6,
      fat: 7.2,
      description: 'Legumbre andina de alto valor proteico, tradicionalmente consumida en el altiplano boliviano.'
    },
    {
      name: 'Amaranto',
      calories: 102,
      protein: 3.8,
      carbs: 18.7,
      fat: 1.7,
      description: 'Grano sagrado de los Andes, rico en proteínas y minerales, cultivado en los valles interandinos.'
    },
    {
      name: 'Maní',
      calories: 160,
      protein: 7.3,
      carbs: 4.6,
      fat: 14,
      description: 'Legumbre originaria de los valles bolivianos, excelente fuente de grasas saludables y proteínas.'
    },
    {
      name: 'Habas',
      calories: 110,
      protein: 7.6,
      carbs: 18.3,
      fat: 0.6,
      description: 'Legumbre tradicional del altiplano, rica en proteínas y fibra, consumida fresca o tostada.'
    }
  ],
  
  /**
   * Get food recommendations based on nutritional evaluation
   * @param {Object} evaluation - Evaluation results from Calculator.evaluateNutrition()
   * @returns {Object} Recommendations and nutritional balance
   */
  getRecommendations: function(evaluation) {
    const balance = {
      deficits: [],
      excesses: [],
      isBalanced: true
    };
    
    // Check each nutrient for deficits or excesses
    const nutrients = ['protein', 'carbs', 'fat'];
    nutrients.forEach(nutrient => {
      const diff = evaluation[nutrient].difference;
      const percent = evaluation[nutrient].percentOfTarget;
      
      if (percent < 80) {
        balance.deficits.push({
          nutrient: Utils.getNutrientName(nutrient),
          amount: Math.abs(Math.round(diff))
        });
        balance.isBalanced = false;
      } else if (percent > 120) {
        balance.excesses.push({
          nutrient: Utils.getNutrientName(nutrient),
          amount: Math.round(diff)
        });
        balance.isBalanced = false;
      }
    });
    
    // If no deficits, don't recommend foods
    if (balance.deficits.length === 0) {
      return {
        balance,
        recommendations: []
      };
    }
    
    // Score foods based on how well they address deficits
    const scoredFoods = this.bolivianFoods.map(food => {
      let score = 0;
      
      balance.deficits.forEach(deficit => {
        const nutrientKey = deficit.nutrient.toLowerCase();
        if (nutrientKey.includes('proteína')) {
          score += (food.protein / deficit.amount) * 10;
        } else if (nutrientKey.includes('carbohidrato')) {
          score += (food.carbs / deficit.amount) * 10;
        } else if (nutrientKey.includes('grasa')) {
          score += (food.fat / deficit.amount) * 10;
        }
      });
      
      return { food, score };
    });
    
    // Sort by score and get top 3 unique recommendations
    scoredFoods.sort((a, b) => b.score - a.score);
    const uniqueRecommendations = [];
    const usedNames = new Set();
    
    for (const { food } of scoredFoods) {
      if (!usedNames.has(food.name)) {
        usedNames.add(food.name);
        uniqueRecommendations.push({
          name: food.name,
          macros: {
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat
          },
          description: food.description
        });
        
        if (uniqueRecommendations.length === 3) break;
      }
    }
    
    return {
      balance,
      recommendations: uniqueRecommendations
    };
  }
};