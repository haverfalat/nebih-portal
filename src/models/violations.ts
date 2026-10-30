import { routes } from '../routes.js';
import type { ContentField, Link, Page, TableRow } from '../types.js';

export const violationCategories = {
  food: routes.foodViolations,
  pesticideResidues: routes.pesticideResidueViolations,
  veterinaryProducts: routes.veterinaryViolations,
  timber: routes.timberViolations,
} as const;

export type ViolationCategory = keyof typeof violationCategories;
export type ViolationDetailCategory = 'food' | 'veterinaryProducts';

export interface ViolationBase {
  id: string | null;
  date: string | null;
  dateLabel: string;
  url: string | null;
  fields: Array<{ label: string; value: string }>;
  links: Link[];
  row: TableRow;
}

export interface FoodViolation extends ViolationBase {
  category: 'food';
  productOrActivity: string;
  operatorName: string;
}

export interface VeterinaryViolation extends ViolationBase {
  category: 'veterinaryProducts';
  productName: string;
  companyName: string;
}

export interface PesticideViolation extends ViolationBase {
  category: 'pesticideResidues';
  sampleNumber: string;
  sampledAt: string | null;
  origin: string;
  distributor: string;
  productName: string;
  activeSubstance: string;
  limitMgPerKg: number | null;
  measuredMgPerKg: number | null;
  limitLabel: string;
  measuredLabel: string;
}

export interface TimberViolation extends ViolationBase {
  category: 'timber';
  publishedAt: string | null;
  caseNumber: string;
  operatorName: string;
  address: string;
  activityProhibited: boolean | null;
  eutrCode: string;
  legalBasis: string;
  isFinal: boolean | null;
  authority: string;
  subject: string;
  findings: string;
  violatedProvisions: string;
  decision: string;
  appeal: string;
}

export interface ViolationRecordMap {
  food: FoodViolation;
  veterinaryProducts: VeterinaryViolation;
  pesticideResidues: PesticideViolation;
  timber: TimberViolation;
}

export type ViolationRecord = ViolationRecordMap[ViolationCategory];

export interface ViolationDetailBase {
  id: string | null;
  url: string;
  date: string | null;
  operatorName: string | null;
  operatorAddress: string | null;
  productName: string | null;
  description: string | null;
  authority: string | null;
  relatedArticles: string[];
  sections: ContentField[];
  unmappedFields: ContentField[];
  page: Page;
}

export interface FoodViolationDetail extends ViolationDetailBase {
  category: 'food';
  productOrActivity: string | null;
  executiveOfficers: string | null;
  productIdentification: string | null;
}

export interface VeterinaryViolationDetail extends ViolationDetailBase {
  category: 'veterinaryProducts';
  companyName: string | null;
}

export interface ViolationDetailMap {
  food: FoodViolationDetail;
  veterinaryProducts: VeterinaryViolationDetail;
}

export type ViolationDetail = ViolationDetailMap[ViolationDetailCategory];
