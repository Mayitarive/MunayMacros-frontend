export interface UserProfile {
  id: number;
  name: string;
  age: number;
  sex: 'male' | 'female';
  height: number;
  weight: number;
  activity_level: string;
  requirements: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface Detection {
  food: string;
  unit: string;
  macronutrients: {
    proteins: number;
    carbs: number;
    fats: number;
    kcal: number;
  };
}

export interface DetectionResponse {
  image_path: string;
  detections: Detection[];
}

export interface DetectedFood {
  id: string;
  user_id: number;
  food_name: string;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portions: number;
  created_at: string;
}

export interface ApiError {
  detail: string;
}