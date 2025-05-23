import React, { useState } from 'react';
import { UserProfile } from '../types';
import { createProfile } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  onProfileSaved: (profile: UserProfile) => void;
}

export function UserProfileForm({ onProfileSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    user_name: '',
    age: 25,
    sex: 'male',
    height: 170,
    weight: 70,
    activity_level: 'sedentary'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const savedProfile = await createProfile(profile);
      localStorage.setItem('username', profile.user_name);
      onProfileSaved(savedProfile);
      toast.success('Perfil guardado exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="user_name" className="block text-sm font-medium text-gray-700">
          Nombre de usuario
        </label>
        <input
          type="text"
          id="user_name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          value={profile.user_name}
          onChange={(e) => setProfile({ ...profile, user_name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700">
          Edad
        </label>
        <input
          type="number"
          id="age"
          required
          min={15}
          max={100}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          value={profile.age}
          onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Sexo</label>
        <div className="mt-1 space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="sex"
              value="male"
              checked={profile.sex === 'male'}
              onChange={(e) => setProfile({ ...profile, sex: e.target.value as 'male' | 'female' })}
              className="form-radio text-primary"
            />
            <span className="ml-2">Masculino</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="sex"
              value="female"
              checked={profile.sex === 'female'}
              onChange={(e) => setProfile({ ...profile, sex: e.target.value as 'male' | 'female' })}
              className="form-radio text-primary"
            />
            <span className="ml-2">Femenino</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
          Peso (kg)
        </label>
        <input
          type="number"
          id="weight"
          required
          min={30}
          max={300}
          step={0.1}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          value={profile.weight}
          onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) })}
        />
      </div>

      <div>
        <label htmlFor="height" className="block text-sm font-medium text-gray-700">
          Altura (cm)
        </label>
        <input
          type="number"
          id="height"
          required
          min={100}
          max={250}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          value={profile.height}
          onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label htmlFor="activity_level" className="block text-sm font-medium text-gray-700">
          Nivel de Actividad
        </label>
        <select
          id="activity_level"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          value={profile.activity_level}
          onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
        >
          <option value="sedentary">Sedentario</option>
          <option value="active">Activo</option>
          <option value="very_active">Muy Activo</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar Perfil'}
      </button>
    </form>
  );
}