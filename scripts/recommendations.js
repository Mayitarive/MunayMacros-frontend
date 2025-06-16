/**
 * Food recommendations based on nutritional needs
 */

import Utils from './utils.js';

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
      description: 'Cereal andino ancestral, rico en proteínas completas y fibra. Base de la alimentación tradicional boliviana.',
      primaryNutrient: 'carbs' // Nutriente principal que aporta
    },
    {
      name: 'Charque',
      calories: 150,
      protein: 30,
      carbs: 0,
      fat: 3.5,
      description: 'Carne deshidratada tradicional de los valles bolivianos, excelente fuente de proteína y hierro.',
      primaryNutrient: 'protein'
    },
    {
      name: 'Chuño',
      calories: 160,
      protein: 1.9,
      carbs: 38,
      fat: 0.2,
      description: 'Papa deshidratada mediante técnica ancestral andina, rica en carbohidratos complejos y almidón resistente.',
      primaryNutrient: 'carbs'
    },
    {
      name: 'Camote',
      calories: 86,
      protein: 1.6,
      carbs: 20.1,
      fat: 0.1,
      description: 'Tubérculo dulce nativo, rico en betacarotenos y vitamina A, cultivado en los valles bolivianos.',
      primaryNutrient: 'carbs'
    },
    {
      name: 'Tarwi',
      calories: 150,
      protein: 15.5,
      carbs: 9.6,
      fat: 7.2,
      description: 'Legumbre andina de alto valor proteico, tradicionalmente consumida en el altiplano boliviano.',
      primaryNutrient: 'protein'
    },
    {
      name: 'Amaranto',
      calories: 102,
      protein: 3.8,
      carbs: 18.7,
      fat: 1.7,
      description: 'Grano sagrado de los Andes, rico en proteínas y minerales, cultivado en los valles interandinos.',
      primaryNutrient: 'carbs'
    },
    {
      name: 'Maní',
      calories: 160,
      protein: 7.3,
      carbs: 4.6,
      fat: 14,
      description: 'Legumbre originaria de los valles bolivianos, excelente fuente de grasas saludables y proteínas.',
      primaryNutrient: 'fat'
    },
    {
      name: 'Habas',
      calories: 110,
      protein: 7.6,
      carbs: 18.3,
      fat: 0.6,
      description: 'Legumbre tradicional del altiplano, rica en proteínas y fibra, consumida fresca o tostada.',
      primaryNutrient: 'protein'
    },
    {
      name: 'Llajua',
      calories: 25,
      protein: 1.2,
      carbs: 5.8,
      fat: 0.3,
      description: 'Salsa tradicional boliviana rica en vitamina C, perfecta para acompañar cualquier comida.',
      primaryNutrient: 'carbs'
    },
    {
      name: 'Chicharrón',
      calories: 200,
      protein: 18,
      carbs: 0,
      fat: 14,
      description: 'Preparación tradicional de cerdo, rica en proteínas y grasas, típica de los valles.',
      primaryNutrient: 'fat'
    },
    {
      name: 'Tunta',
      calories: 155,
      protein: 2.1,
      carbs: 36,
      fat: 0.3,
      description: 'Papa blanca deshidratada del altiplano, fuente de energía de larga duración.',
      primaryNutrient: 'carbs'
    },
    {
      name: 'Pescado del Titicaca',
      calories: 140,
      protein: 25,
      carbs: 0,
      fat: 4,
      description: 'Pescado fresco del lago Titicaca, excelente fuente de proteína magra y omega-3.',
      primaryNutrient: 'protein'
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
    
    // Identificar déficits y excesos
    const nutrients = ['protein', 'carbs', 'fat'];
    const deficitNutrients = [];
    
    nutrients.forEach(nutrient => {
      const diff = evaluation[nutrient].difference;
      const percent = evaluation[nutrient].percentOfTarget;
      
      if (percent < 80) {
        balance.deficits.push({
          nutrient: Utils.getNutrientName(nutrient),
          amount: Math.abs(Math.round(diff))
        });
        deficitNutrients.push(nutrient);
        balance.isBalanced = false;
      } else if (percent > 120) {
        balance.excesses.push({
          nutrient: Utils.getNutrientName(nutrient),
          amount: Math.round(diff)
        });
        balance.isBalanced = false;
      }
    });
    
    // Si no hay déficits, no recomendar alimentos
    if (deficitNutrients.length === 0) {
      return {
        balance,
        recommendations: []
      };
    }
    
    // Filtrar alimentos que ayuden con los déficits actuales
    const relevantFoods = this.bolivianFoods.filter(food => 
      deficitNutrients.includes(food.primaryNutrient)
    );
    
    // Si no hay alimentos relevantes, usar todos
    const foodsToScore = relevantFoods.length > 0 ? relevantFoods : this.bolivianFoods;
    
    // Calcular score dinámico para cada alimento
    const scoredFoods = foodsToScore.map(food => {
      let score = 0;
      
      // Score basado en déficits específicos
      deficitNutrients.forEach(nutrient => {
        const nutrientValue = food[nutrient];
        const deficitInfo = balance.deficits.find(d => 
          d.nutrient.toLowerCase().includes(nutrient === 'carbs' ? 'carbohidrato' : 
                                          nutrient === 'protein' ? 'proteína' : 'grasa')
        );
        
        if (deficitInfo && nutrientValue > 0) {
          // Score más alto para alimentos que mejor cubren el déficit
          score += (nutrientValue / deficitInfo.amount) * 100;
          
          // Bonus si es el nutriente principal del alimento
          if (food.primaryNutrient === nutrient) {
            score += 50;
          }
        }
      });
      
      // Penalizar alimentos ya recomendados recientemente (variedad)
      const recentRecommendations = this.getRecentRecommendations();
      if (recentRecommendations.includes(food.name)) {
        score *= 0.7; // Reducir score en 30%
      }
      
      return { food, score };
    });
    
    // Ordenar por score y seleccionar los mejores
    scoredFoods.sort((a, b) => b.score - a.score);
    
    // Seleccionar hasta 3 recomendaciones únicas, priorizando variedad
    const recommendations = [];
    const usedPrimaryNutrients = new Set();
    
    for (const { food } of scoredFoods) {
      // Priorizar variedad de nutrientes
      if (recommendations.length < 3 && 
          (!usedPrimaryNutrients.has(food.primaryNutrient) || recommendations.length === 0)) {
        
        recommendations.push({
          name: food.name,
          macros: {
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat
          },
          description: food.description,
          primaryNutrient: food.primaryNutrient
        });
        
        usedPrimaryNutrients.add(food.primaryNutrient);
      }
    }
    
    // Si aún necesitamos más recomendaciones, agregar sin restricción de variedad
    if (recommendations.length < 3) {
      for (const { food } of scoredFoods) {
        if (recommendations.length >= 3) break;
        
        const alreadyRecommended = recommendations.some(r => r.name === food.name);
        if (!alreadyRecommended) {
          recommendations.push({
            name: food.name,
            macros: {
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat
            },
            description: food.description,
            primaryNutrient: food.primaryNutrient
          });
        }
      }
    }
    
    // Guardar recomendaciones actuales para evitar repetición
    this.saveRecentRecommendations(recommendations.map(r => r.name));
    
    return {
      balance,
      recommendations
    };
  },
  
  /**
   * Obtener recomendaciones recientes para evitar repetición
   * @returns {Array<string>} Lista de nombres de alimentos recomendados recientemente
   */
  getRecentRecommendations: function() {
    try {
      const recent = localStorage.getItem('munayMacros_recentRecommendations');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      return [];
    }
  },
  
  /**
   * Guardar recomendaciones actuales
   * @param {Array<string>} recommendations - Lista de nombres de alimentos
   */
  saveRecentRecommendations: function(recommendations) {
    try {
      // Mantener solo las últimas 6 recomendaciones para evitar repetición excesiva
      const recent = this.getRecentRecommendations();
      const updated = [...recommendations, ...recent].slice(0, 6);
      localStorage.setItem('munayMacros_recentRecommendations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent recommendations:', error);
    }
  },
  
  /**
   * Limpiar historial de recomendaciones (útil para testing)
   */
  clearRecentRecommendations: function() {
    localStorage.removeItem('munayMacros_recentRecommendations');
  }
};

export default Recommendations;