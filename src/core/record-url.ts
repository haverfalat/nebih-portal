export function recordId(url: string): string | null {
  return /\/l\/[^/]+\/(\d+)(?:\/|$)/.exec(new URL(url).pathname)?.[1] ?? null;
}

export function recordPath(path: string): string {
  return `/l${path.startsWith('/') ? path : `/${path}`}/`;
}

export function recordTarget(path: string, idOrUrl: string): string {
  return /^\d+$/.test(idOrUrl) ? `${recordPath(path)}${idOrUrl}` : idOrUrl;
}
