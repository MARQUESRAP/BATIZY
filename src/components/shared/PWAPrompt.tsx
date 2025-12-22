import { Download, RefreshCw, Wifi, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export function PWAPrompt() {
  const { 
    needRefresh, 
    offlineReady, 
    canInstall, 
    updateServiceWorker, 
    installApp,
    dismissOfflineReady,
    dismissUpdate
  } = usePWA();

  // Notification de mise à jour disponible
  if (needRefresh) {
    return (
      <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <RefreshCw size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800">Mise à jour disponible</h3>
              <p className="text-sm text-gray-500 mt-1">
                Une nouvelle version est disponible. Actualisez pour en profiter.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={updateServiceWorker}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Actualiser
                </button>
                <button
                  onClick={dismissUpdate}
                  className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
            <button onClick={dismissUpdate} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Notification offline ready
  if (offlineReady) {
    return (
      <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wifi size={20} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800">Mode hors-ligne activé</h3>
              <p className="text-sm text-gray-500 mt-1">
                L'application peut maintenant fonctionner sans connexion internet.
              </p>
            </div>
            <button onClick={dismissOfflineReady} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bouton d'installation (sur la page de login par exemple)
  if (canInstall) {
    return (
      <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-btp rounded-xl flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800">Installer Batizy</h3>
              <p className="text-sm text-gray-500 mt-1">
                Installez l'application pour un accès rapide et hors-ligne.
              </p>
              <button
                onClick={installApp}
                className="mt-3 px-4 py-2 bg-gradient-btp text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Installer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
