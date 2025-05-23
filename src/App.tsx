import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { UserProfile } from './types';
import { UserProfileForm } from './components/UserProfileForm';
import { UserVerification } from './components/UserVerification';
import { DailyTrackingPage } from './components/DailyTrackingPage';
import { getProfile } from './services/api';

function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(true);

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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {profile.name}
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DailyTrackingPage profile={profile} />
      </main>
    </div>
  );
}

export default App;