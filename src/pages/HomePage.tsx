import { useNavigate } from 'react-router-dom';
import { Users, FileText, ClipboardCheck, Settings, Map, FileBarChart, Info, UserCog } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const mainCards = [
    {
      title: 'CLIENTS',
      description: 'Gérer la liste des clients et créer de nouveaux clients',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      path: '/clients',
    },
    {
      title: 'RELEVÉ - ÉTUDE',
      description: 'Effectuer un relevé et créer une étude de site',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      path: '/releves-liste',
    },
    {
      title: 'INSTALLATION',
      description: 'Enregistrer les installations de matériel',
      icon: Settings,
      color: 'from-orange-500 to-orange-600',
      path: '/installation',
    },
    {
      title: 'VÉRIFICATION',
      description: 'Vérifier les installations existantes',
      icon: ClipboardCheck,
      color: 'from-red-500 to-red-600',
      path: '/verification',
    },
    {
      title: 'RAPPORTS',
      description: 'Consulter et générer les rapports',
      icon: FileBarChart,
      color: 'from-teal-500 to-teal-600',
      path: '/rapports',
    },
    {
      title: 'CARTE',
      description: 'Visualiser les clients sur la carte',
      icon: Map,
      color: 'from-cyan-500 to-cyan-600',
      path: '/carte',
    },
    {
      title: 'INFOS',
      description: 'Informations et documentation',
      icon: Info,
      color: 'from-gray-500 to-gray-600',
      path: '/infos',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue sur ReflexOFeu</h2>
        <p className="text-gray-600">Sélectionnez une fonctionnalité pour commencer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mainCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-95"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

            <div className="p-6 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <card.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {card.title}
              </h3>

              <p className="text-sm text-gray-600">
                {card.description}
              </p>
            </div>

            <div className={`h-1 bg-gradient-to-r ${card.color}`} />
          </button>
        ))}

        {isAdmin && (
          <button
            onClick={() => navigate('/utilisateurs')}
            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" />

            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <UserCog className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                UTILISATEURS
              </h3>

              <p className="text-sm text-gray-600">
                Gérer les accès et les utilisateurs
              </p>
            </div>

            <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
          </button>
        )}
      </div>

      <div className="mt-12 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Conseils d'utilisation</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Utilisez le menu de navigation en haut pour accéder rapidement aux différentes sections</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>Cliquez sur le logo ReflexOFeu pour revenir à cette page d'accueil</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>L'application fonctionne hors ligne - vos données seront synchronisées automatiquement</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
