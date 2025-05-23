/**
 * Service for handling food recommendations
 */

window.RecommendationService = {
  /**
   * API Base URL
   */
  API_URL: 'https://food-detection-backend-production.up.railway.app',

  /**
   * Get recommendations from backend based on user's current nutritional status
   * @param {string} user - Username
   * @returns {Promise<Array>} Array of recommendations
   */
  getRecommendationsFromBackend: async function(user) {
    try {
      const response = await fetch(`${this.API_URL}/recommendations?user=${encodeURIComponent(user)}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener recomendaciones');
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
};