export function getBackendApiUrl(path: string): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }
  return path;
}
