import { routes } from '../routes.js';
import { dataset, date, text } from './schema.js';

export const animalDatasets = {
  outbreaks: dataset(routes.outbreaks, {
    sequenceNumber: text('Sorszám'),
    confirmedAt: date('Megerősítés dátuma'),
    disease: text('Betegség'),
    species: text('Állatfaj'),
    county: text('Vármegye'),
    municipality: text('Település'),
    classification: text('Elsődleges/Másodlagos'),
    notes: text('Megjegyzés'),
    information: text('Link'),
  }),
  byproductOperators: dataset(routes.byproductOperators, {
    operatorName: text('Üzemeltető neve'),
    county: text('Megye'),
    address: text('Cím'),
  }),
  animalLegislation: dataset(routes.animalLegislation, {
    type: text('Típus'),
    title: text('Jogszabály/link/eljárásrend/útmutató neve'),
    location: text('Jogszabály/link/eljárásrend/útmutató elérhetősége'),
    year: text('Kiadás éve'),
    topic: text('Témakör'),
  }),
} as const;
