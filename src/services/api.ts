import { config } from '../config';
import { UserProfile, DetectedFood, DetectionResponse, Detection } from '../types';

export async function getProfile(name: string): Promise<UserProfile | null> {
  const response = await fetch(`${config.api.baseUrl}/profile/${encodeURIComponent(name)}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener el perfil');
  }
  
  return response.json();
}

export async function createProfile(profile: Omit<UserProfile, 'id' | 'requirements'>): Promise<UserProfile> {
  const response = await fetch(`${config.api.baseUrl}/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al crear el perfil');
  }

  return response.json();
}

export async function getDailyLog(userId: number): Promise<DetectedFood[]> {
  const response = await fetch(`${config.api.baseUrl}/daily-log?user_id=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener el registro diario');
  }

  return response.json();
}

export async function getUserHistory(username: string): Promise<DetectedFood[]> {
  const response = await fetch(`${config.api.baseUrl}/user-history?user=${encodeURIComponent(username)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener el historial del usuario');
  }

  return response.json();
}

export async function deleteMeal(logId: string): Promise<void> {
  const response = await fetch(`${config.api.baseUrl}/daily-log/${logId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al eliminar la comida');
  }
}

export async function uploadFoodImage(file: File, userId: number): Promise<DetectionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId.toString());

  const response = await fetch(`${config.api.baseUrl}/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al procesar la imagen');
  }

  return response.json();
}

export async function registerDetection(detection: Detection, userId: number, portions: number) {
  const macronutrients = {
    proteins: detection.macronutrients.proteins * portions,
    carbs: detection.macronutrients.carbs * portions,
    fats: detection.macronutrients.fats * portions,
    kcal: detection.macronutrients.kcal * portions
  };

  const response = await fetch(`${config.api.baseUrl}/daily-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      food_name: detection.food,
      unit: detection.unit,
      macronutrients,
      portions
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al registrar la detección');
  }

  return response.json();
}

export async function getRecommendations(userId: number) {
  const response = await fetch(`${config.api.baseUrl}/recommendations?user_id=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al obtener recomendaciones');
  }

  return response.json();
}