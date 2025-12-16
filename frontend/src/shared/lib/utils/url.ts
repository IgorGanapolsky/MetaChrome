export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
