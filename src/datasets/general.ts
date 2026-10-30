import { routes } from '../routes.js';
import { dataset, date, number, text } from './schema.js';

export const generalDatasets = {
  laboratories: dataset(
    routes.foodLaboratories,
    {
      sequenceNumber: text('S.sz.'),
      name: text('Laboratórium neve'),
      sampleReceptionAddress: text('Mintaátvételi pont címe'),
      openingHours: text('Ügyfélfogadási idő'),
      phone: text('Telefonszám'),
    },
    { information: text('További információk') },
  ),
  fireBans: dataset(routes.fireBan, {
    sequenceNumber: text('SSZ'),
    year: number('ÉVJÁRAT'),
    county: text('MEGYE'),
    announcedAt: date('KIHIRDETÉS'),
    revokedAt: date('VISSZAVONÁS'),
    durationDays: number('IDŐTARTAM (NAP)'),
    notes: text('MEGJEGYZÉS'),
  }),
  maintenance: dataset(routes.maintenance, {
    sequenceNumber: text('Sorszám'),
    information: text('Üzemeltetési információ'),
    startsAt: text('Kezdete'),
    endsAt: text('Vége'),
    affectedServices: text('Érintett szolgáltatások'),
  }),
  strains: dataset(routes.strains, {
    strainNumber: text('Törzs gyűjteményi azonosítója /Strain Number'),
    identifier: text('Törzs belső azonosítója/ Strain Identifier'),
    scientificName: text('Genus és faj/ Scientific Name'),
    serotype: text('Szerovariáns/típus / Serovariant/type'),
    isolationDate: text('Izolálás dátuma/ Isolation Date'),
    origin: text('Forrás / Source/Origin'),
    sampleType: text('Minta típusa/ Sample type'),
    preservationMethod: text('Tárolás módja/ Preservation Method'),
    hazardGroup: text('Veszélyességi kategória/ Hazard Group'),
    notes: text('Megjegyzés/ Remark'),
    sequenceIdentifier: text('WGS azonosító / Sequence/Fasta file name'),
    price: text('ÁR (HUF)*/ Price (EUR)*'),
  }),
} as const;
