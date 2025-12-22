import { useState, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Enregistrer le service worker
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegistered(registration) {
        console.log('SW registered:', registration);
      },
      onRegisterError(error) {
        console.error('SW registration error:', error);
      }
    });

    // Écouter l'événement d'installation
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const updateServiceWorker = () => {
    const updateSW = registerSW({
      immediate: true
    });
    setNeedRefresh(false);
  };

  const installApp = async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const dismissOfflineReady = () => {
    setOfflineReady(false);
  };

  const dismissUpdate = () => {
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    offlineReady,
    canInstall,
    updateServiceWorker,
    installApp,
    dismissOfflineReady,
    dismissUpdate
  };
}
