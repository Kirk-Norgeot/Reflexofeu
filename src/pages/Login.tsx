import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ImageCarousel from '@/components/ImageCarousel';

const carouselImages = [
  '/whatsapp_image_2025-12-17_at_10.10.01_(2).jpeg',
  '/whatsapp_image_2025-12-17_at_10.10.37.jpeg',
  '/whatsapp_image_2025-12-17_at_10.10.39_(4).jpeg',
  '/whatsapp_image_2026-01-14_at_11.55.28_(2).jpeg',
  '/whatsapp_image_2026-01-14_at_11.55.28_(5).jpeg'
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">R</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reflex<span className="text-orange-600">O</span>Feu
              </h1>
            </div>
            <p className="text-sm text-gray-500 mb-4">Détection extinction industrielle</p>
            <p className="text-gray-600">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                autoComplete="email"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto">
          <ImageCarousel images={carouselImages} autoPlayInterval={5000} />
        </div>
      </div>
    </div>
  );
}
