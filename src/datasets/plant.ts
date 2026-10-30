import { routes } from '../routes.js';
import { dataset, boolean, date, text } from './schema.js';

export const plantDatasets = {
  organicSeeds: dataset(routes.organicSeeds, {
    species: text('Faj'),
    scientificName: text('Tud. név'),
    variety: text('Fajta'),
    information: text('Egyéb információ, Szaporítási fok'),
    supplier: text('Vetőmag szállítója'),
  }),
  activeSubstances: dataset(
    routes.activeSubstances,
    {
      substance: text('Hatóanyag'),
      category: text('Kategória'),
      regulatoryStatus: text('1107/2009 EK Rendelet szerinti állapot'),
      expiresAt: date('Hatóanyag lejárati idő'),
    },
    {
      approvedAt: date('Jóváhagyás dátuma'),
      rapporteurMemberState: text('RMS'),
      coRapporteurMemberState: text('Co-RMS'),
      candidateForSubstitution: boolean('Helyettesítésre jelölt anyag'),
      basicSubstance: boolean('Egyszerű anyag'),
      lowRisk: boolean('Kis kockázatú anyag'),
      regulation: text('Rendelet'),
      notes: text('Megjegyzés'),
    },
  ),
  fertilizers: dataset(routes.fertilizers, {
    authorizationTitle: text('Engedély címe(Készítmény neve vagy termékcsalád neve)'),
    type: text('A készítmény típusa'),
    tradeName: text('Készítmény kereskedelmi neve(Referencia név)'),
    alternativeBrand: text('További márkanév'),
    authorizationNumbers: text('Alap okiratszám,Módosítás(ok) száma'),
    manufacturer: text('Gyártó és címe(Bérgyártó)'),
    authorizationHolder: text('Engedélyes és címe(Magyarországi forgalmazó)'),
    localRepresentative: text('Hazai képviselet'),
    validUntil: date('Engedély érvényesség'),
  }),
  withdrawnPesticides: dataset(routes.withdrawnPesticides, {
    name: text('Készítmény neve'),
    authorizationType: text('Engedély típusa'),
    authorizationExpiry: date('Engedély érvényessége'),
    salesGracePeriodEnd: date('Türelmi idő lejárata (nagy- és kiskereskedői értékesítés)'),
    usageGracePeriodEnd: date('Türelmi idő lejárata (felhasználás)'),
  }),
  plantLegislation: dataset(routes.plantLegislation, {
    type: text('Típus'),
    title: text('Jogszabály/link/eljárásrend/útmutató neve'),
    location: text('Jogszabály/link/eljárásrend/útmutató elérhetősége'),
    year: text('Kiadás éve'),
  }),
} as const;
