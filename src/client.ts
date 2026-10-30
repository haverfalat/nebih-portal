import { Transport, type TransportOptions } from './core/transport.js';
import { routes, type RouteName } from './routes.js';
import type { Page, RequestOptions } from './types.js';
import { AdditivesService } from './services/additives.js';
import { ArticlesService } from './services/articles.js';
import { ContactsService } from './services/contacts.js';
import { NoticesService } from './services/notices.js';
import { DatasetsService } from './services/datasets.js';
import { DocumentsService } from './services/documents.js';
import { NavigationService } from './services/navigation.js';
import { PagesService } from './services/pages.js';
import { RecallsService } from './services/recalls.js';
import { RegistriesService } from './services/registries.js';
import { SearchService } from './services/search.js';
import { SitemapService } from './services/sitemap.js';
import { TablesService } from './services/tables.js';
import { ViolationsService } from './services/violations.js';

export type NebihClientOptions = TransportOptions;

export class NebihClient {
  readonly transport: Transport;
  readonly pages: PagesService;
  readonly news: ArticlesService;
  readonly notices: NoticesService;
  readonly recalls: RecallsService;
  readonly violations: ViolationsService;
  readonly additives: AdditivesService;
  readonly localProducers: TablesService;
  readonly organicSeeds: TablesService;
  readonly navigation: NavigationService;
  readonly search: SearchService;
  readonly sitemap: SitemapService;
  readonly documents: DocumentsService;
  readonly datasets: DatasetsService;
  readonly contacts: ContactsService;
  readonly registries: RegistriesService;

  constructor(options: NebihClientOptions = {}) {
    this.transport = new Transport(options);
    this.pages = new PagesService(this.transport);
    this.news = this.articles(routes.news);
    this.notices = new NoticesService(this.pages);
    this.recalls = new RecallsService(this.pages);
    this.violations = new ViolationsService(this.pages);
    this.additives = new AdditivesService(this.pages);
    this.localProducers = this.tables(routes.localProducers);
    this.organicSeeds = this.tables(routes.organicSeeds);
    this.navigation = new NavigationService(this.pages);
    this.search = new SearchService(this.pages);
    this.sitemap = new SitemapService(this.transport);
    this.documents = new DocumentsService(this.pages);
    this.datasets = new DatasetsService(this.pages);
    this.contacts = new ContactsService(this.pages);
    this.registries = new RegistriesService(this.pages);
  }

  page(name: RouteName, options: RequestOptions = {}): Promise<Page> {
    return this.pages.get(routes[name], options);
  }

  articles(path: string): ArticlesService {
    return new ArticlesService(this.pages, path);
  }

  tables(path: string): TablesService {
    return new TablesService(this.pages, path);
  }

  clearCache(): void {
    this.transport.clearCache();
  }
}
