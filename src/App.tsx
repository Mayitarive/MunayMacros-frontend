import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Calendar, Home, User, BarChart3 } from 'lucide-react';
import { UserProfile } from './types';
import { UserProfileForm } from './components/UserProfileForm';
import { UserVerification } from './components/UserVerification';
import { DailyTrackingPage } from './components/DailyTrackingPage';
import { HistoryPage } from './components/HistoryPage';
import { getProfile } from './services/api';

type ActivePage = 'daily' | 'history' | 'profile' | 'reports';

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(true);
  const [activePage, setActivePage] = useState<ActivePage>('daily');

  useEffect(() => {
    const checkExistingProfile = async () => {
      const username = localStorage.getItem('username');
      if (username) {
        try {
          const existingProfile = await getProfile(username);
          if (existingProfile) {
            setProfile(existingProfile);
            setShowVerification(false);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
      setLoading(false);
    };

    checkExistingProfile();
  }, []);

  const handleVerification = async (exists: boolean, username: string) => {
    if (exists) {
      const existingProfile = await getProfile(username);
      setProfile(existingProfile);
      setShowVerification(false);
    } else {
      setShowVerification(false);
    }
  };

  const renderActivePage = () => {
    if (!profile) return null;

    switch (activePage) {
      case 'daily':
        return <DailyTrackingPage profile={profile} />;
      case 'history':
        return <HistoryPage profile={profile} />;
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Perfil de Usuario</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-lg text-gray-900">{profile.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Edad</label>
                    <p className="mt-1 text-lg text-gray-900">{profile.age} años</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sexo</label>
                    <p className="mt-1 text-lg text-gray-900">{profile.sex === 'male' ? 'Masculino' : 'Femenino'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso</label>
                    <p className="mt-1 text-lg text-gray-900">{profile.weight} kg</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Altura</label>
                    <p className="mt-1 text-lg text-gray-900">{profile.height} cm</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nivel de Actividad</label>
                    <p className="mt-1 text-lg text-gray-900">
                      {profile.activity_level === 'sedentary' ? 'Sedentario' : 
                       profile.activity_level === 'active' ? 'Activo' : 'Muy Activo'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Requerimientos Nutricionales</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="font-bold text-blue-900">{profile.requirements.calories}</div>
                      <div className="text-blue-700 text-sm">kcal/día</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-900">{profile.requirements.protein}g</div>
                      <div className="text-blue-700 text-sm">proteínas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-900">{profile.requirements.carbs}g</div>
                      <div className="text-blue-700 text-sm">carbohidratos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-900">{profile.requirements.fat}g</div>
                      <div className="text-blue-700 text-sm">grasas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Reportes</h2>
              <p className="text-gray-600">Funcionalidad de reportes en desarrollo...</p>
            </div>
          </div>
        );
      default:
        return <DailyTrackingPage profile={profile} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showVerification) {
    return <UserVerification onVerified={handleVerification} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Completa tu perfil
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Necesitamos algunos datos para calcular tus necesidades nutricionales
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <UserProfileForm onProfileSaved={setProfile} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              MunayMacros - {profile.name}
            </h1>
            
            {/* Navigation */}
            <nav className="flex space-x-4">
              <button
                onClick={() => setActivePage('daily')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'daily'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </button>
              
              <button
                onClick={() => setActivePage('history')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'history'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Historial
              </button>
              
              <button
                onClick={() => setActivePage('profile')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'profile'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                Perfil
              </button>
              
              <button
                onClick={() => setActivePage('reports')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePage === 'reports'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reportes
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderActivePage()}
      </main>
    </div>
  );
}

export default App;