import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Camera, Plus } from 'lucide-react';
import { UserProfile, DetectedFood, Detection } from '../types';
import { getDailyLog, uploadFoodImage, getRecommendations, registerDetection } from '../services/api';
import { config } from '../config';

interface Props {
  profile: UserProfile;
}

export function DailyTrackingPage({ profile }: Props) {
  const [meals, setMeals] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [portions, setPortions] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetchDailyLog();
    fetchRecommendations();
  }, [profile.id]);

  const fetchDailyLog = async () => {
    try {
      const data = await getDailyLog(profile.id);
      setMeals(data);
    } catch (error) {
      console.error('Error fetching daily log:', error);
      toast.error('Error al cargar el registro diario');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const data = await getRecommendations(profile.id);
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setProcessedImageUrl(null);
      setDetections([]);
      setPortions([]);
    }
  };

  const handlePortionChange = (index: number, value: number) => {
    const updated = [...portions];
    updated[index] = Math.max(1, Math.min(10, value));
    setPortions(updated);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    try {
      setUploading(true);
      const response = await uploadFoodImage(selectedFile, profile.id);

      // Set the full URL for the processed image
      const fullImageUrl = `${config.api.baseUrl}/${response.image_path}`;
      setProcessedImageUrl(fullImageUrl);
      
      // Initialize detections and portions arrays
      setDetections(response.detections);
      setPortions(new Array(response.detections.length).fill(1));
      
      toast.success('¡Alimentos detectados correctamente!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterDetections = async () => {
    if (registering || !detections.length) return;

    try {
      setRegistering(true);
      await Promise.all(
        detections.map((detection, index) =>
          registerDetection(detection, profile.id, portions[index] || 1)
            .catch(error => {
              console.error(`Error registrando ${detection.food}:`, error);
              throw error;
            })
        )
      );

      await fetchDailyLog();
      await fetchRecommendations();

      // Reset states after successful registration
      setSelectedFile(null);
      setPreviewUrl(null);
      setProcessedImageUrl(null);
      setDetections([]);
      setPortions([]);

      toast.success('¡Alimentos registrados exitosamente!');
    } catch (error) {
      toast.error('Error al registrar algunos alimentos');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Subir Nueva Comida</h2>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-48 object-contain mb-4" />
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra una imagen
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>

        {selectedFile && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`inline-flex items-center px-4 py-2 bg-primary text-white rounded-md ${
                uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Procesar Imagen
                </>
              )}
            </button>
          </div>
        )}

        {processedImageUrl && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Resultados de la detección</h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <img 
                src={processedImageUrl} 
                alt="Detección de alimentos" 
                className="w-full object-contain max-h-96 shadow-lg"
              />
            </div>

            {detections.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium mb-2">Alimentos detectados:</h4>
                <ul className="space-y-2">
                  {detections.map((detection, index) => (
                    <li key={index} className="flex flex-col bg-gray-50 p-2 rounded-md">
                      <span className="font-medium">{detection.food}</span>
                      <span className="text-sm text-gray-600">Unidad: {detection.unit}</span>
                      <span className="text-sm text-gray-600">
                        Macronutrientes por unidad: {detection.macronutrients.kcal} kcal, 
                        {detection.macronutrients.proteins}g proteínas, 
                        {detection.macronutrients.carbs}g carbohidratos, 
                        {detection.macronutrients.fats}g grasas
                      </span>
                      <label className="mt-1 text-sm">Cantidad consumida:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={portions[index] || 1}
                        onChange={(e) => handlePortionChange(index, Number(e.target.value))}
                        className="mt-1 p-1 border rounded w-24"
                      />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleRegisterDetections}
                    disabled={registering}
                    className={`inline-flex items-center px-4 py-2 bg-success text-white rounded-md ${
                      registering ? 'opacity-50 cursor-not-allowed' : 'hover:bg-success-dark'
                    }`}
                  >
                    {registering ? 'Registrando...' : 'Registrar Alimentos'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Comidas del Día</h2>
        {meals.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay comidas registradas para hoy</p>
        ) : (
          <div className="space-y-4">
            {meals.map((meal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{meal.food_name}</h3>
                  <span className="text-sm text-gray-500">
                    {format(new Date(meal.created_at), 'HH:mm', { locale: es })}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Unidad: {meal.unit} | Porciones: {meal.portions}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                  <div className="text-gray-600">
                    <span className="font-medium">{meal.calories}</span> kcal
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">{meal.protein}g</span> proteínas
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">{meal.carbs}g</span> carbohidratos
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">{meal.fat}g</span> grasas
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recomendaciones</h2>
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">{recommendation.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}