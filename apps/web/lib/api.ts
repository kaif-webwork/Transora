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

  // Live Production Backend Fallback URL
  const defaultLiveApi = 'https://swiftsharebackend-production.up.railway.app';
  return `${defaultLiveApi}${path}`;
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
    return localStorage.getItem('transora_backend_url') || process.env.NEXT_PUBLIC_API_URL || 'https://swiftsharebackend-production.up.railway.app';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://swiftsharebackend-production.up.railway.app';
}
