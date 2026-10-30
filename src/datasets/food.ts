import { routes } from '../routes.js';
import { dataset, date, text } from './schema.js';

export const foodDatasets = {
  producers: dataset(routes.localProducers, {
    name: text('Név'),
    county: text('Megye'),
    address: text('Cím'),
    contact: text('Elérhetőség'),
    delivery: text('Kiszállítást vállal?'),
    products: text('Főbb terméktípusok'),
    identifier: text('Azonosító adat'),
  }),
  dangerZones: dataset(
    routes.dangerZones,
    {
      name: text('Név'),
      category: text('Főkategória'),
      subcategory: text('Alkategória'),
    },
    {
      description: text('Leírás'),
      moreInformation: text('További információk', 'További információ'),
    },
  ),
  ingredientSubstitutions: dataset(routes.ingredientSubstitutions, {
    date: date('Dátum'),
    companyName: text('Cégnév'),
    productName: text('Terméknév'),
    information: text('Link'),
  }),
  ethyleneOxide: dataset(routes.ethyleneOxide, {
    expiryDate: date('Lejárati idő'),
    productName: text('Terméknév'),
    packaging: text('Kiszerelés'),
    batchNumber: text('Tételszám'),
    publishedAt: date('Közzététel dátuma'),
  }),
  trademarks: dataset(routes.trademarks, {
    name: text('Megjelölés'),
    owner: text('Jogosult neve'),
    registrationNumber: text('Lajstromszám'),
    information: text('További információ'),
  }),
} as const;
