import { routes } from '../routes.js';
import type { RegistryName } from './types.js';
import { ValidationError } from '../core/errors.js';

const registryPaths: Record<RegistryName, string> = {
  felir: routes.felir,
  eutr: routes.eutr,
  primaryProducers: routes.primaryProducers,
};

export function registryPath(name: RegistryName): string {
  const path = registryPaths[name];
  if (!path) throw new ValidationError(`Unknown registry: ${String(name)}`);
  return path;
}
