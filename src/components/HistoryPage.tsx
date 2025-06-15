import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { UserProfile, DetectedFood } from '../types';
import toast from 'react-hot-toast';
import { config } from '../config';

interface Props {
  profile: UserProfile;
}

// Función auxiliar exclusiva para el historial
async function getMealsForHistory(username: string, dateKey: string): Promise<DetectedFood[]> {
  try {
    const response = await fetch(
      `${config.api.baseUrl}/user-history?user=${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      console.error('Error fetching user history:', response.statusText);
      return [];
    }

    const allMeals = await response.json();

    // Filtrar por fecha usando formato YYYY-MM-DD
    return allMeals.filter((meal: DetectedFood) => {
      try {
        // Convertir UTC a fecha local y extraer solo la fecha
        const mealDate = new Date(meal.created_at).toISOString().split('T')[0];
        return mealDate === dateKey;
      } catch (error) {
        console.error('Error parsing meal date:', meal.created_at, error);
        return false;
      }
    });

  } catch (error) {
    console.error('Error fetching meals for history:', error);
    return [];
  }
}

export function HistoryPage({ profile }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Initialize with current date
  const [allMeals, setAllMeals] = useState<DetectedFood[]>([]);
  const [selectedDateMeals, setSelectedDateMeals] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());

  // Get user's timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    fetchUserHistory();
  }, [profile.name]);

  useEffect(() => {
    // ✅ AQUÍ ESTÁ LA CORRECCIÓN: Llamar directamente a getMealsForHistory
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      getMealsForHistory(profile.name, dateKey).then(meals => {
        setSelectedDateMeals(meals);
      });
    }
  }, [selectedDate, profile.name]);

  const fetchUserHistory = async () => {
    try {
      const response = await fetch(`${config.api.baseUrl}/user-history?user=${encodeURIComponent(profile.name)}`);
      
      if (!response.ok) {
        console.error('Error fetching user history:', response.statusText);
        return;
      }

      const data = await response.json();
      setAllMeals(data);
      
      // Create set of dates that have data, converting UTC to local timezone
      const dates = new Set(
        data.map((meal: DetectedFood) => {
          try {
            const utcDate = parseISO(meal.created_at);
            const localDate = utcToZonedTime(utcDate, timeZone);
            return format(localDate, 'yyyy-MM-dd');
          } catch (error) {
            console.error('Error parsing date for calendar:', meal.created_at, error);
            return null;
          }
        }).filter(Boolean) as string[]
      );
      setDatesWithData(dates);
    } catch (error) {
      console.error('Error fetching user history:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    // Create a new Date object to ensure proper state update
    const newSelectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
        const currentDay = new Date(day); // Create a copy for the current iteration
        const formattedDate = format(currentDay, 'd');
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        const hasData = datesWithData.has(dateKey);
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
        const isToday = isSameDay(currentDay, new Date());
        const isCurrentMonth = isSameMonth(currentDay, monthStart);

        days.push(
          <button
            key={currentDay.toISOString()}
            onClick={() => handleDateClick(currentDay)}
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
              ${isToday && !isSelected 
                ? 'bg-blue-100 text-blue-800 font-semibold border-2 border-blue-300' 
                : ''
              }
              ${hasData && !isSelected && !isToday
                ? 'bg-green-50 text-green-800 font-medium border border-green-200' 
                : ''
              }
            `}
          >
            <span className="relative z-10">{formattedDate}</span>
            {hasData && (
              <div className={`
                absolute bottom-1 right-1 w-2 h-2 rounded-full z-20
                ${isSelected ? 'bg-white' : isToday ? 'bg-blue-600' : 'bg-green-500'}
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Calendario</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-700 min-w-[200px] text-center">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {renderCalendar()}

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              </div>
              <span className="text-gray-600">Hoy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded relative flex items-center justify-center">
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-600">Con registros</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span className="text-gray-600">Seleccionado</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">
              {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </h2>
          </div>

          {selectedDateMeals.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay registros para esta fecha.</p>
              <p className="text-gray-400 text-sm mt-2">
                Selecciona otra fecha o registra comidas para el día de hoy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Comidas registradas ({selectedDateMeals.length})
              </h3>
              
              {selectedDateMeals.map((meal, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{meal.food_name}</h4>
                    <span className="text-sm text-gray-500">
                      {(() => {
                        try {
                          const utcDate = parseISO(meal.created_at);
                          const localDate = utcToZonedTime(utcDate, timeZone);
                          return format(localDate, 'HH:mm', { locale: es });
                        } catch (error) {
                          console.error('Error formatting time:', meal.created_at, error);
                          return '--:--';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Unidad: {meal.unit} | Porciones: {meal.portions}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-900">
                      {selectedDateMeals.reduce((sum, meal) => sum + meal.calories, 0).toFixed(0)}
                    </div>
                    <div className="text-blue-700">kcal totales</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-900">
                      {selectedDateMeals.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1)}g
                    </div>
                    <div className="text-blue-700">proteínas</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-900">
                      {selectedDateMeals.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1)}g
                    </div>
                    <div className="text-blue-700">carbohidratos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-900">
                      {selectedDateMeals.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1)}g
                    </div>
                    <div className="text-blue-700">grasas</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}