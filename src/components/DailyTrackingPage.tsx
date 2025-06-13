import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Camera, Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserProfile, DetectedFood, Detection } from '../types';
import { getDailyLog, uploadFoodImage, getRecommendations, registerDetection, getUserHistory } from '../services/api';
import { config } from '../config';

interface Props {
  profile: UserProfile;
}

export function DailyTrackingPage({ profile }: Props) {
  const [meals, setMeals] = useState<DetectedFood[]>([]);
  const [allMeals, setAllMeals] = useState<DetectedFood[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [portions, setPortions] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserHistory();
    fetchRecommendations();
  }, [profile.id]);

  // Filter meals whenever selectedDate changes
  useEffect(() => {
    filterMealsByDate();
  }, [selectedDate]);

  // Filter meals whenever allMeals is updated
  useEffect(() => {
    filterMealsByDate();
  }, [allMeals]);

  const fetchUserHistory = async () => {
    try {
      setLoading(true);
      const data = await getUserHistory(profile.name);
      setAllMeals(data);
      
      // Create set of dates that have data for calendar indicators
      const dates = new Set(
        data.map(meal => format(parseISO(meal.created_at), 'yyyy-MM-dd'))
      );
      setDatesWithData(dates);
    } catch (error) {
      console.error('Error fetching user history:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const filterMealsByDate = () => {
    if (!allMeals.length) {
      setMeals([]);
      return;
    }

    const filteredMeals = allMeals.filter(meal => {
      try {
        return isSameDay(selectedDate, parseISO(meal.created_at));
      } catch (error) {
        console.error('Error parsing date:', meal.created_at, error);
        return false;
      }
    });
    
    setMeals(filteredMeals);
  };

  const fetchRecommendations = async () => {
    try {
      const data = await getRecommendations(profile.id);
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(startOfDay(newDate));
  };

  const handleCalendarDateClick = (date: Date) => {
    const newSelectedDate = startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    setSelectedDate(newSelectedDate);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(startOfDay(previousDay));
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(startOfDay(nextDay));
  };

  const goToToday = () => {
    const today = startOfDay(new Date());
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const isToday = () => {
    const today = startOfDay(new Date());
    return selectedDate.getTime() === today.getTime();
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = new Date(startDate);

    // Weekday headers
    const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const weekdayHeader = (
      <div key="weekdays" className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(weekday => (
          <div key={weekday} className="p-2 text-center text-sm font-medium text-gray-500">
            {weekday}
          </div>
        ))}
      </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(day);
        const formattedDate = format(currentDay, 'd');
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        const hasData = datesWithData.has(dateKey);
        const isSelected = isSameDay(currentDay, selectedDate);
        const isTodayDate = isSameDay(currentDay, new Date());
        const isCurrentMonth = isSameMonth(currentDay, monthStart);

        days.push(
          <button
            key={currentDay.toISOString()}
            onClick={() => handleCalendarDateClick(currentDay)}
            disabled={!isCurrentMonth}
            className={`
              p-3 text-sm rounded-lg transition-all duration-200 relative min-h-[40px] flex items-center justify-center
              ${!isCurrentMonth 
                ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              }
              ${isSelected 
                ? 'bg-primary text-white hover:bg-primary-dark shadow-md' 
                : ''
              }
              ${isTodayDate && !isSelected 
                ? 'bg-blue-100 text-blue-800 font-semibold border-2 border-blue-300' 
                : ''
              }
              ${hasData && !isSelected && !isTodayDate
                ? 'bg-green-50 text-green-800 font-medium border border-green-200' 
                : ''
              }
            `}
          >
            <span className="relative z-10">{formattedDate}</span>
            {hasData && (
              <div className={`
                absolute bottom-1 right-1 w-2 h-2 rounded-full z-20
                ${isSelected ? 'bg-white' : isTodayDate ? 'bg-blue-600' : 'bg-green-500'}
              `} />
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={`week-${rows.length}`} className="grid grid-cols-7 gap-1 mb-1">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div>
        {weekdayHeader}
        <div className="space-y-1">
          {rows}
        </div>
      </div>
    );
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

      const fullImageUrl = `${config.api.baseUrl}/${response.image_path}`;
      setProcessedImageUrl(fullImageUrl);
      
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

      // Refresh the data after registering new meals
      await fetchUserHistory();
      await fetchRecommendations();

      // Reset form state
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Calendario</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
            </h3>

            {renderCalendar()}

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center">
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                </div>
                <span className="text-gray-600">Hoy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded relative flex items-center justify-center">
                  <div className="absolute bottom-0 right-0 w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-600">Con registros</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <span className="text-gray-600">Seleccionado</span>
              </div>
            </div>

            {!isToday() && (
              <button
                onClick={goToToday}
                className="w-full mt-4 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm"
              >
                Ir a hoy
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Navigation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Día anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextDay}
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Día siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <label htmlFor="date-picker" className="text-sm text-gray-600">
                  Seleccionar fecha:
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange(new Date(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Upload Section - Only show for today */}
          {isToday() && (
            <div className="bg-white rounded-lg shadow-md p-6">
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
          )}

          {/* Meals History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Comidas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </h2>
            
            {meals.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay comidas registradas para esta fecha.</p>
                {!isToday() && (
                  <button
                    onClick={goToToday}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  >
                    Ver comidas de hoy
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {meals.map((meal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{meal.name}</h3>
                      <span className="text-sm text-gray-500">
                        {format(parseISO(meal.created_at), 'HH:mm', { locale: es })}
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
                
                {/* Daily Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Resumen del día</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-blue-900">
                        {meals.reduce((sum, meal) => sum + meal.calories, 0).toFixed(0)}
                      </div>
                      <div className="text-blue-700">kcal totales</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-900">
                        {meals.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1)}g
                      </div>
                      <div className="text-blue-700">proteínas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-900">
                        {meals.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1)}g
                      </div>
                      <div className="text-blue-700">carbohidratos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-900">
                        {meals.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1)}g
                      </div>
                      <div className="text-blue-700">grasas</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations - Only show for today */}
          {isToday() && recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
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
      </div>
    </div>
  );
}