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

  // Same-origin relative path for web client to leverage Next.js rewrites proxy
  if (typeof window !== 'undefined') {
    return path;
  }

  // Fallback for SSR / Node environment
  return `https://swiftsharebackend-production.up.railway.app${path}`;
}

export function getDirectBackendDownloadUrl(path: string): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('transora_backend_url');
    if (customUrl && customUrl.trim() !== '') {
      const baseUrl = customUrl.trim().replace(/\/$/, '');
      return `${baseUrl}${path}`;
    }
  }

  // Always target stable production Railway backend for file downloads to prevent Render 502 Bad Gateway timeouts
  const stableBackend = 'https://swiftsharebackend-production.up.railway.app';
  return `${stableBackend}${path}`;
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
