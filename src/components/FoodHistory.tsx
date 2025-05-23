import React, { useEffect, useState } from 'react';
import { DetectedFood } from '../types';
import { getUserHistory } from '../services/api';
import { STORAGE_KEYS } from '../config';

export function FoodHistory() {
  const [foods, setFoods] = useState<DetectedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const profile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (!profile) return;

        const { user_name } = JSON.parse(profile);
        const history = await getUserHistory(user_name);
        setFoods(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <div>Cargando historial...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // Group foods by date
  const groupedFoods = foods.reduce((groups, food) => {
    const date = new Date(food.created_at).toLocaleDateString();
    return {
      ...groups,
      [date]: [...(groups[date] || []), food]
    };
  }, {} as Record<string, DetectedFood[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedFoods).map(([date, foods]) => (
        <div key={date} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{date}</h3>
          <div className="space-y-4">
            {foods.map((food) => (
              <div key={food.id} className="border-t pt-4">
                <h4 className="font-medium">{food.food_name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                  <div>Calorías: {food.calories} kcal</div>
                  <div>Proteínas: {food.protein}g</div>
                  <div>Carbohidratos: {food.carbs}g</div>
                  <div>Grasas: {food.fat}g</div>
                  {food.portions && <div>Porciones: {food.portions}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}