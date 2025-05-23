/**
 * Handles the food image upload and analysis functionality
 */

const FoodUpload = {
  /**
   * API Base URL
   */
  API_URL: 'https://food-detection-backend-production.up.railway.app',
  
  /**
   * Initialize the food upload functionality
   */
  init: function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('food-image');
    const uploadBtn = document.getElementById('upload-btn');
    const addFoodBtn = document.getElementById('add-food-btn');
    const cancelFoodBtn = document.getElementById('cancel-food-btn');
    
    // Current detected foods data
    this.currentFoods = [];
    
    if (uploadArea && fileInput) {
      // Handle click on upload area
      uploadArea.addEventListener('click', () => {
        if (!Storage.getUsername()) {
          Utils.showMessage('Por favor ingresa tu nombre de usuario primero', 'warning');
          return;
        }
        fileInput.click();
      });
      
      // Handle drag and drop events
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (!Storage.getUsername()) {
          Utils.showMessage('Por favor ingresa tu nombre de usuario primero', 'warning');
          return;
        }
        
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          this.handleFileSelection(fileInput.files[0]);
        }
      });
      
      // Handle file selection
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
          this.handleFileSelection(fileInput.files[0]);
        }
      });
      
      // Handle upload button
      if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
          if (!Storage.getUsername()) {
            Utils.showMessage('Por favor ingresa tu nombre de usuario primero', 'warning');
            return;
          }
          
          if (fileInput.files.length) {
            this.processFood(fileInput.files[0]);
          } else {
            Utils.showMessage('Por favor selecciona una imagen primero', 'warning');
          }
        });
      }
      
      // Handle add food button
      if (addFoodBtn) {
        addFoodBtn.addEventListener('click', async () => {
          if (this.currentFoods.length > 0) {
            try {
              for (const food of this.currentFoods) {
                await this.saveFoodToLog(food);
              }
              
              // Update UI components
              await App.updateFoodsList();
              await App.updateDailyProgress();
              await App.updateUploadCounter();
              await App.updateRecommendations();
              
              this.resetFoodAnalysis();
              Utils.showMessage('Alimentos detectados y añadidos con éxito', 'success');
            } catch (error) {
              Utils.showMessage(error.message, 'error');
            }
          }
        });
      }
      
      // Handle cancel button
      if (cancelFoodBtn) {
        cancelFoodBtn.addEventListener('click', () => {
          this.resetFoodAnalysis();
        });
      }
    }
  },
  
  /**
   * Handle file selection and display preview
   * @param {File} file - The selected image file
   */
  handleFileSelection: function(file) {
    if (!file.type.startsWith('image/')) {
      Utils.showMessage('Por favor selecciona una imagen válida', 'error');
      return;
    }
    
    const previewImage = document.getElementById('preview-image');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    
    if (previewImage && uploadPlaceholder) {
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.classList.remove('d-none');
        uploadPlaceholder.classList.add('d-none');
      };
      reader.readAsDataURL(file);
    }
  },
  
  /**
   * Process the food image and get nutritional data
   * @param {File} file - The image file to process
   */
  processFood: async function(file) {
    const foodAnalysis = document.getElementById('food-analysis');
    const uploadBtn = document.getElementById('upload-btn');
    const processedImage = document.getElementById('processed-image');
    const detectionsList = document.getElementById('detections-list');
    
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Analizando...';
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user', Storage.getUsername());

      const response = await fetch(`${this.API_URL}/detect`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al procesar la imagen');
      }

      const data = await response.json();
      
      if (!data.detections || data.detections.length === 0) {
        throw new Error('No se detectaron alimentos en la imagen');
      }

      // Store all detected foods
      this.currentFoods = data.detections;

      // Show processed image
      if (processedImage && data.image_path) {
        processedImage.src = `${this.API_URL}/${data.image_path}`;
        processedImage.classList.remove('d-none');
      }

      // Show all detections
      if (detectionsList) {
        detectionsList.innerHTML = '';
        data.detections.forEach((detection, index) => {
          const detectionCard = document.createElement('div');
          detectionCard.className = 'detection-card mb-3 p-3 border rounded';
          detectionCard.innerHTML = `
            <h5 class="mb-2">${detection.food}</h5>
            <div class="mb-2">
              <small class="text-muted">Unidad: ${detection.unit}</small>
            </div>
            <div class="macros-grid">
              <div class="macro-item">
                <span class="macro-value">${detection.macronutrients.kcal}</span>
                <span class="macro-label">kcal</span>
              </div>
              <div class="macro-item">
                <span class="macro-value">${detection.macronutrients.proteins}</span>
                <span class="macro-label">g proteínas</span>
              </div>
              <div class="macro-item">
                <span class="macro-value">${detection.macronutrients.carbs}</span>
                <span class="macro-label">g carbohidratos</span>
              </div>
              <div class="macro-item">
                <span class="macro-value">${detection.macronutrients.fats}</span>
                <span class="macro-label">g grasas</span>
              </div>
            </div>
            <div class="mt-3">
              <label class="form-label">Porciones:</label>
              <input type="number" class="form-control portions-input" 
                     min="1" max="10" value="1" 
                     data-index="${index}">
            </div>
          `;
          detectionsList.appendChild(detectionCard);
        });

        // Add portion change listeners
        const portionInputs = detectionsList.querySelectorAll('.portions-input');
        portionInputs.forEach(input => {
          input.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const portions = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
            e.target.value = portions;
            
            // Update macronutrients display
            const detection = this.currentFoods[index];
            const card = e.target.closest('.detection-card');
            const macroValues = card.querySelectorAll('.macro-value');
            
            macroValues[0].textContent = Math.round(detection.macronutrients.kcal * portions);
            macroValues[1].textContent = Math.round(detection.macronutrients.proteins * portions * 10) / 10;
            macroValues[2].textContent = Math.round(detection.macronutrients.carbs * portions * 10) / 10;
            macroValues[3].textContent = Math.round(detection.macronutrients.fats * portions * 10) / 10;
          });
        });
      }

      if (foodAnalysis) {
        foodAnalysis.classList.remove('d-none');
        foodAnalysis.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      Utils.showMessage('Alimentos detectados correctamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      Utils.showMessage(error.message || 'Error al procesar la imagen', 'error');
    } finally {
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Subir Imagen';
      }
    }
  },

  /**
   * Save detected food to daily log
   * @param {Object} food - The detected food data
   * @param {number} portions - Number of portions
   */
  saveFoodToLog: async function(food) {
    const username = Storage.getUsername();
    if (!username) {
      throw new Error('Por favor ingresa tu nombre de usuario primero');
    }

    try {
      const portionInput = document.querySelector(`input[data-index="${food.index}"]`);
      const portions = portionInput ? parseInt(portionInput.value) || 1 : 1;

      const response = await fetch(`${this.API_URL}/daily-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: username,
          food_name: food.food,
          unit: food.unit,
          portions: portions,
          calories: food.macronutrients.kcal * portions,
          protein: food.macronutrients.proteins * portions,
          carbs: food.macronutrients.carbs * portions,
          fat: food.macronutrients.fats * portions
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al guardar el alimento');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving food:', error);
      throw error;
    }
  },
  
  /**
   * Reset the food analysis UI
   */
  resetFoodAnalysis: function() {
    const foodAnalysis = document.getElementById('food-analysis');
    const previewImage = document.getElementById('preview-image');
    const processedImage = document.getElementById('processed-image');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const fileInput = document.getElementById('food-image');
    const detectionsList = document.getElementById('detections-list');
    
    this.currentFoods = [];
    
    if (foodAnalysis) {
      foodAnalysis.classList.add('d-none');
    }
    
    if (previewImage && uploadPlaceholder) {
      previewImage.classList.add('d-none');
      uploadPlaceholder.classList.remove('d-none');
    }
    
    if (processedImage) {
      processedImage.classList.add('d-none');
      processedImage.src = '';
    }
    
    if (detectionsList) {
      detectionsList.innerHTML = '';
    }
    
    if (fileInput) {
      fileInput.value = '';
    }
  }
};