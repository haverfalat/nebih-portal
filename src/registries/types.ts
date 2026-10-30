import type { PublicForm } from '../types.js';

export type RegistryName = 'felir' | 'eutr' | 'primaryProducers';

export type RegistryQuery =
  | { type: 'felir'; number: string }
  | { type: 'taxNumber'; number: string }
  | { type: 'naturalPerson'; name: string; birthDate: string }
  | { type: 'company'; country: string; name?: string; registrationNumber?: string }
  | { type: 'activity'; id: string }
  | { type: 'establishment'; id: string }
  | { type: 'familyFarm'; id: string }
  | { type: 'familyEnterprise'; id: string };

export interface RegistryDescription {
  name: RegistryName;
  url: string;
  requiresCaptcha: boolean;
  forms: PublicForm[];
  endpoints: Record<string, string>;
}

export interface RegistryResult {
  url: string;
  data: Record<string, unknown>;
}
