const RENDER_PRODUCTION_BACKEND = 'https://transora-q6nu.onrender.com';

export function getBackendApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('transora_backend_url');
    if (customUrl && customUrl.trim() !== '') {
      const baseUrl = customUrl.trim().replace(/\/$/, '');
      return `${baseUrl}${path}`;
    }
  }

  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }

  return `${RENDER_PRODUCTION_BACKEND}${path}`;
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
    return localStorage.getItem('transora_backend_url') || process.env.NEXT_PUBLIC_API_URL || RENDER_PRODUCTION_BACKEND;
  }
  return process.env.NEXT_PUBLIC_API_URL || RENDER_PRODUCTION_BACKEND;
}
