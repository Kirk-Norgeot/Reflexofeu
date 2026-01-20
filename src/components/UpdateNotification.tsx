import { RefreshCw } from 'lucide-react';

interface UpdateNotificationProps {
  onReload: () => void;
}

export function UpdateNotification({ onReload }: UpdateNotificationProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Nouvelle version disponible</h3>
            <p className="text-sm text-blue-100 mb-3">
              Une mise à jour est disponible. Rechargez l'application pour bénéficier des dernières améliorations.
            </p>
            <button
              onClick={onReload}
              className="w-full bg-white text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Recharger maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
