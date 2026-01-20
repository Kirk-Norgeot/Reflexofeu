import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Users, FileText, ClipboardCheck, Settings, Map, FileBarChart, Info, Home } from 'lucide-react';
import NetworkStatusBar from './NetworkStatusBar';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/accueil', label: 'ACCUEIL', icon: Home },
    { to: '/clients', label: 'CLIENTS', icon: Users },
    { to: '/releves-liste', label: 'RELEVÉ - ÉTUDE', icon: FileText },
    // { to: '/releves-liste', label: 'RELEVÉS À SIGNER', icon: ClipboardCheck },
    { to: '/installation', label: 'INSTALLATION', icon: Settings },
    { to: '/verification', label: 'VÉRIFICATION', icon: ClipboardCheck },
    { to: '/rapports', label: 'RAPPORTS', icon: FileBarChart },
    { to: '/carte', label: 'CARTE', icon: Map },
    { to: '/infos', label: 'INFOS', icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NetworkStatusBar />
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate('/accueil')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">R</span>
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Reflex<span className="text-orange-600">O</span>Feu
                </h1>
                <p className="text-xs text-gray-500 hidden md:block">Détection extinction industrielle</p>
              </div>
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium hidden md:inline">
                  {profile?.full_name || profile?.email}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {profile?.role}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>

          <nav className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-4 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md active:scale-95'
                  }`
                }
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs text-center leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} ReflexOFeu - Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
