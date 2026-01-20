import { useState, useEffect } from 'react';

interface VersionInfo {
  buildTime: number;
  version: string;
}

export function useVersionCheck(checkInterval = 60000) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) return;

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return;
        }

        const text = await response.text();
        if (!text || text.trim().startsWith('<!')) {
          return;
        }

        const remoteVersion: VersionInfo = JSON.parse(text);

        if (!currentVersion) {
          setCurrentVersion(remoteVersion);
          localStorage.setItem('app_version', JSON.stringify(remoteVersion));
          return;
        }

        if (remoteVersion.buildTime > currentVersion.buildTime) {
          if (mounted) {
            setHasUpdate(true);
          }
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion) {
      try {
        setCurrentVersion(JSON.parse(storedVersion));
      } catch (e) {
        console.error('Failed to parse stored version:', e);
      }
    }

    checkVersion();

    const interval = setInterval(checkVersion, checkInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [checkInterval, currentVersion]);

  const reloadApp = () => {
    localStorage.removeItem('app_version');
    window.location.reload();
  };

  return { hasUpdate, reloadApp };
}
