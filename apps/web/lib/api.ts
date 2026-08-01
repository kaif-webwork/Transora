const STABLE_PRODUCTION_BACKEND = 'https://swiftsharebackend-production.up.railway.app';

export function getBackendApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('transora_backend_url');
    if (customUrl && customUrl.trim() !== '') {
      const baseUrl = customUrl.trim().replace(/\/$/, '');
      return `${baseUrl}${path}`;
    }
  }

  // Always target stable Railway production backend to ensure Sender and Receiver use the exact same storage & server
  return `${STABLE_PRODUCTION_BACKEND}${path}`;
}

export function getDirectBackendDownloadUrl(path: string): string {
  return getBackendApiUrl(path);
}

export function setCustomBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '') {
      localStorage.removeItem('transora_backend_url');
    } else {
      let formatted = url.trim();
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = `https://${formatted}`;
      }
      localStorage.setItem('transora_backend_url', formatted.replace(/\/$/, ''));
    }
  }
}

export function getStoredBackendUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('transora_backend_url') || STABLE_PRODUCTION_BACKEND;
  }
  return STABLE_PRODUCTION_BACKEND;
}
