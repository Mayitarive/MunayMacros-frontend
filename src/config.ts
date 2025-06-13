export const STORAGE_KEYS = {
  USER_PROFILE: 'munayMacros_userProfile',
  CURRENT_DATE: 'munayMacros_currentDate'
} as const;

export const API_URL = 'https://food-detection-backend-production.up.railway.app';

export const config = {
  api: {
    baseUrl: API_URL,
    endpoints: {
      profile: '/profile',
      dailyLog: '/daily-log',
      detect: '/detect',
      recommendations: '/recommendations',
      userHistory: '/user-history' // 
    }
  }
};
