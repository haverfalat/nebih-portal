# Nébih portál – JavaScript és TypeScript kliens

Moduláris, típusos kliens a [Nébih nyilvános weboldalához](https://portal.nebih.gov.hu/). A weboldal HTML-tartalmát kéri le és alakítja strukturált adatokká. A forráskód és az API elnevezései angolul készültek, kódkommentek nélkül.

A futtatáshoz Node.js 22.12 vagy újabb szükséges. A kliens HTTP-kéréseket, Cheerio HTML-feldolgozást és munkamenetenkénti cookie-kezelést használ. Nem igényel böngészőt vagy böngészőautomatizálást. A Nébih hivatalos SOAP adatbeküldő szolgáltatásait nem használja.

## Telepítés és indítás

Közvetlenül GitHubról:

```sh
npm i github:haverfalat/nebih-portal
```

A GitHub-telepítés során a `prepare` lépés elkészíti a JavaScript-kimenetet és a TypeScript-deklarációkat.

JavaScriptből és TypeScriptből ugyanaz a felület használható:

```ts
import { NebihClient } from 'nebih-portal';

const client = new NebihClient();
const result = await client.news.list();
console.log(result.items);
```

Helyi fejlesztéshez:

```sh
git clone https://github.com/haverfalat/nebih-portal.git
cd nebih-portal
npm ci
```

Az `npm ci` a `prepare` lépéssel buildet is készít. Az önálló `npm run build` a korábbi generált fájlokat törli, majd újra létrehozza a `dist` könyvtárat. A csomag ESM formátumú; npm-regisztráció nem szükséges a GitHubról történő telepítéshez.

## Jogsértések listázása

```ts
const result = await client.violations.list('food');

for (const record of result.items) {
  console.log(record.id);
  console.log(record.date);
  console.log(record.operatorName);
  console.log(record.productOrActivity);
  console.log(record.url);
}
```

A [jogsértés-listák gyűjtőoldala](https://portal.nebih.gov.hu/jogsertes-listak) öt hivatkozást tartalmaz. Négy kategória strukturált HTML-adatokat közöl, a tisztességtelen forgalmazói magatartás listája PDF-dokumentum.

| Kategória | Lekérés | Saját mezők |
| --- | --- | --- |
| Élelmiszer | `violations.list('food')` | `operatorName`, `productOrActivity` |
| Növényvédőszer-maradék | `violations.list('pesticideResidues')` | `sampleNumber`, `sampledAt`, `origin`, `distributor`, `productName`, `activeSubstance`, `limitMgPerKg`, `measuredMgPerKg`, `limitLabel`, `measuredLabel` |
| Állatgyógyászati termék | `violations.list('veterinaryProducts')` | `productName`, `companyName` |
| Faanyag-kereskedelmi lánc | `violations.list('timber')` | `publishedAt`, `caseNumber`, `operatorName`, `address`, `activityProhibited`, `eutrCode`, `legalBasis`, `isFinal`, `authority`, `subject`, `findings`, `violatedProvisions`, `decision`, `appeal` |

Minden rekord tartalmazza az `id`, `date`, `dateLabel`, `url`, `fields`, `links`, `row` mezőket. A `fields` megőrzi az eredeti magyar oszlopneveket és értékeket. Az `id` és az `url` hiányozhat: a növényvédőszer-maradék és faanyag-kereskedelmi lista a részletes adatokat közvetlenül a táblázatban közli.

A mennyiségek számmá alakítása csak egyértelmű érték esetén történik meg. A `<0,01` jellegű érték megmarad a `limitLabel` vagy `measuredLabel` mezőben; numerikus megfelelője `null`. A táblázat összevont sorainál a közös cellákat a feldolgozó továbbviszi a következő rekordokra.

### Jogsértés részletei

Az élelmiszer- és állatgyógyászati kategóriák külön részletező oldallal rendelkeznek:

```ts
const result = await client.violations.list('food');
const first = result.items[0];

if (first?.url) {
  const detail = await client.violations.detail('food', first.url);

  console.log(detail.operatorName);
  console.log(detail.operatorAddress);
  console.log(detail.executiveOfficers);
  console.log(detail.productName);
  console.log(detail.productIdentification);
  console.log(detail.description);
  console.log(detail.authority);
  console.log(detail.relatedArticles);
}
```

Azonosítóval is működik:

```ts
const detail = await client.violations.detail('food', '2709731937');
```

A `violations.get(url)` a részletező URL alapján felismeri a két támogatott kategóriát. Az állatgyógyászati részletek külön `companyName` mezőt adnak vissza. A közös részletmezők: `id`, `url`, `date`, `operatorName`, `operatorAddress`, `productName`, `description`, `authority`, `relatedArticles`, `sections`, `unmappedFields`, `page`.

A feldolgozó kezeli a külön bekezdésben megadott címkéket, az egy bekezdésen belüli több mezőt, a félkövér szövegen kívüli kettőspontokat, a régebbi megnevezéseket és a sima szövegként közölt kapcsolódó URL-eket. Az ismert elírásokat is kezeli; az ismeretlen címkéket az `unmappedFields` őrzi meg.

### Összes lap és összes részlet

```ts
for await (const record of client.violations.records('food').iterate({ maxPages: 20 })) {
  console.log(record.operatorName, record.date);
}

for await (const detail of client.violations.iterateDetails('food', { maxPages: 2 })) {
  console.log(detail.operatorAddress, detail.description);
}
```

Az `iterateDetails` rekordonként további HTTP-kérést küld. A `maxPages` a listázási oldalak számát korlátozza. A szerver egyes oldalakon ugyanazt a teljes táblázatot több lap mellett is visszaadja; az iterátor kiszűri az ismétlődő rekordokat.

A PDF-lista:

```ts
const documents = await client.violations.fairTradingDocuments();
const first = documents[0];

if (first) {
  const file = await client.documents.download(first.url);
  console.log(file.filename, file.bytes.length);
}
```

A PDF tartalmát a kliens nem alakítja jogsértésrekordokká.

## Hírek és hirdetmények

```ts
const news = await client.news.list({ page: 1, pageSize: 20 });
const first = news.items[0];

if (first) {
  const article = await client.news.get(first.url);
  console.log(article.title, article.publishedAt);
  console.log(article.lead, article.text);
  console.log(article.images, article.documents, article.relatedArticles);
}
```

A hírek listájának mezői: `id`, `title`, `url`, `summary`, `image`, `publishedAt`, `publishedLabel`. A részletoldal külön adja vissza a cikk törzsét; az oldalsáv kapcsolódó híreit nem keveri bele a cikk szövegébe. Az eredeti oldal a `page` mezőben megmarad.

```ts
const allNotices = await client.notices.list();
const bookNotices = await client.notices.list('books');

for await (const notice of client.notices.iterate('books', { maxPages: 5 })) {
  console.log(notice.title, notice.category);
}
```

Hirdetménykategóriák: `books`, `other`, `stamps`, `timber`. Az összesített `list()` minden kategória kért lapját lekéri, ezért nincs közös lapozási objektuma. Egy üres kategória üres listát ad vissza. A kategóriák külön a `notices.categories()` hívással is felderíthetők.

Más, ugyanezt a cikklistázó elrendezést használó oldalhoz:

```ts
const articles = await client.articles('/egyebek').list();
```

## Termékvisszahívások

```ts
const recalls = await client.recalls.list();
const first = recalls.items[0];

if (first?.url) {
  const detail = await client.recalls.get(first.url);
  console.log(detail.product, detail.reason);
  console.log(detail.brand, detail.rasffReference);
  console.log(detail.manufacturer, detail.distributors);
  console.log(detail.customerInformation);
}
```

Lista: `id`, `date`, `dateLabel`, `product`, `reason`, `url`, `cells`.

Részletek: `id`, `url`, `date`, `product`, `reason`, `notifier`, `recallType`, `rasffReference`, `brand`, `origin`, `manufacturer`, `distributors`, `action`, `customerInformation`, `productIdentification`, `packaging`, `batchNumber`, `expiryDate`, `images`, `tables`, `sections`, `unmappedFields`, `page`.

A hiányzó adat `null`. A képben közölt tételadatokat a kliens képként őrzi meg, OCR-felismerést nem végez. Ha a termékadatok HTML-táblázatban szerepelnek, a `tables` tartalmazza őket.

## E-számok

```ts
const additives = await client.additives.list();
const matches = await client.additives.find('citromsav');

if (matches[0]?.url) {
  const detail = await client.additives.get(matches[0].url);
  console.log(detail.code, detail.name);
  console.log(detail.description, detail.permittedUses);
}
```

Lista: `id`, `code`, `name`, `function`, `adverseEffects`, `url`. Részletekben ezenfelül: `alternativeNames`, `description`, `permittedUses`, `notes`, `moreInformation`, `sections`, `unmappedFields`, `page`.

A keresés a kódot, nevet, funkciót és közölt hatásokat vizsgálja, kis- és nagybetűtől, ékezetektől függetlenül. A `find()` bejárja a listázási lapokat a megadott `maxPages` korlátig.

## További típusos adatkészletek

```ts
const result = await client.datasets.list('activeSubstances');
const first = result.items[0];

if (first?.url) {
  const detail = await client.datasets.detail('activeSubstances', first.url);
  console.log(detail.substance, detail.regulatoryStatus, detail.expiresAt);
  console.log(detail.approvedAt, detail.lowRisk, detail.regulation);
}
```

A TypeScript a megadott adatkészlet nevéből következteti a visszatérési típust. Minden rekordhoz tartozik eredeti `fields`, `row` és `links`; a részleteknél `sections`, `unmappedFields` és teljes `page` is rendelkezésre áll.

| Név | Tartalom | Angol mezők |
| --- | --- | --- |
| `producers` | Helyi termelők | `name`, `county`, `address`, `contact`, `delivery`, `products`, `identifier` |
| `organicSeeds` | Ökológiai vetőmagok | `species`, `scientificName`, `variety`, `information`, `supplier` |
| `activeSubstances` | Növényvédőszer-hatóanyagok | `substance`, `category`, `regulatoryStatus`, `expiresAt` |
| `fertilizers` | Engedélyezett termésnövelők | `authorizationTitle`, `type`, `tradeName`, `alternativeBrand`, `authorizationNumbers`, `manufacturer`, `authorizationHolder`, `localRepresentative`, `validUntil` |
| `withdrawnPesticides` | Visszavont és lejárt növényvédő szerek | `name`, `authorizationType`, `authorizationExpiry`, `salesGracePeriodEnd`, `usageGracePeriodEnd` |
| `outbreaks` | Kitörések és mentességek | `sequenceNumber`, `confirmedAt`, `disease`, `species`, `county`, `municipality`, `classification`, `notes`, `information` |
| `byproductOperators` | Állati melléktermékkel foglalkozó üzemeltetők | `operatorName`, `county`, `address` |
| `dangerZones` | Veszélyzóna | `name`, `category`, `subcategory` |
| `ingredientSubstitutions` | Összetevő-helyettesítések | `date`, `companyName`, `productName`, `information` |
| `ethyleneOxide` | Etilén-oxiddal kapcsolatos terméklisták | `expiryDate`, `productName`, `packaging`, `batchNumber`, `publishedAt` |
| `trademarks` | Védjegyek | `name`, `owner`, `registrationNumber`, `information` |
| `laboratories` | Élelmiszerlánc-biztonsági laboratóriumok | `sequenceNumber`, `name`, `sampleReceptionAddress`, `openingHours`, `phone` |
| `fireBans` | Közzétett tűzgyújtási tilalmak | `sequenceNumber`, `year`, `county`, `announcedAt`, `revokedAt`, `durationDays`, `notes` |
| `maintenance` | Üzemeltetési információk | `sequenceNumber`, `information`, `startsAt`, `endsAt`, `affectedServices` |
| `strains` | Törzsgyűjtemény | `strainNumber`, `identifier`, `scientificName`, `serotype`, `isolationDate`, `origin`, `sampleType`, `preservationMethod`, `hazardGroup`, `notes`, `sequenceIdentifier`, `price` |
| `animalLegislation` | Állategészségügyi jogszabályok és linkek | `type`, `title`, `location`, `year`, `topic` |
| `plantLegislation` | Növény- és talajvédelmi jogszabályok és linkek | `type`, `title`, `location`, `year` |

A hatóanyagok részletei további mezőket közölnek: `approvedAt`, `rapporteurMemberState`, `coRapporteurMemberState`, `candidateForSubstitution`, `basicSubstance`, `lowRisk`, `regulation`, `notes`. A veszélyzóna részleteiben `description` és `moreInformation`, a laboratóriumoknál `information` érhető el.

A `detail()` csak külön részletező oldallal rendelkező adatkészletnél használható. A többi adatkészlet a táblázatsorban közli a részleteit. A tűzgyújtási tilalmak táblázata a portál által közzétett lista; a térképet és esetleges külső megjelenítőket az általános oldallekérés hivatkozásként vagy képként adja vissza.

```ts
for await (const record of client.datasets.records('fertilizers').iterate()) {
  console.log(record.tradeName, record.authorizationHolder);
}
```

## Tetszőleges oldal, összes megőrzött mező

```ts
const page = await client.pages.get('/jogsertes-listak');
const knownPage = await client.page('violations');

console.log(page.title, page.description);
console.log(page.text, page.html);
console.log(page.fields, page.sections);
console.log(page.tables, page.accordions);
console.log(page.documents, page.images, page.embeds);
console.log(page.forms, page.links, page.pagination);
```

A közös modellek a `src/models` könyvtárban találhatók; a `src/types.ts` egységesen újraexportálja őket. A közös mezők: `url`, `canonicalUrl`, `title`, `description`, `language`, `publishedAt`, `publishedLabel`, `text`, `html`, `headings`, `breadcrumbs`, `links`, `documents`, `images`, `embeds`, `tables`, `forms`, `blocks`, `fields`, `sections`, `accordions`, `pagination`, `warnings`.

A `fields` a HTML strukturált űrlapmezőiből és definíciós listáiból, a `sections` a címkézett tartalmi szakaszokból származik. Az `accordions` a HTML-ben eleve megtalálható, összecsukott GYIK-válaszokat és szervezeti egységeket is tartalmazza. A `blocks` külön megőrzi a Liferay tartalmi blokkjait.

A táblázatok eredeti fejlécei, cellaszövegei, cella-HTML-jei, hivatkozásai és `rowSpan`/`columnSpan` értékei megmaradnak. Az általános táblázatfeldolgozó a portál elrejtett, régi táblázatát is visszaadhatja; a dedikált adatkészletek a megjelenítéshez használt táblázatot választják.

A `html` mezők forrásból származó HTML-részletek. Nem biztonságos megjelenítésre szánt, teljesen fertőtlenített HTML-kimenetek; alkalmazásba történő beillesztés előtt a megjelenítő alkalmazásnak kell azokat megfelelően kezelnie.

### GYIK és kapcsolatok

```ts
const faq = await client.pages.get('/gyik/elelmiszer/gyakran-ismetelt-kerdesek/elelmiszerbiztonsag');

for (const item of faq.accordions) {
  console.log(item.title, item.text);
}

const contacts = await client.contacts.list();
console.log(contacts[0]?.name, contacts[0]?.emails, contacts[0]?.phones);
```

A kapcsolatok `name`, `emails`, `phones`, `text`, `html`, `links` mezőkkel jelennek meg. A címek és a szervezeti egységek további adatai a teljes szövegben is megmaradnak. A `contacts.list(path)` más, ugyanezt az összecsukható elrendezést használó oldalon is működik.

### Egyedi táblázatok

```ts
const tables = await client.tables('/termelo-kereso').list();
const matchingRows = await client.tables('/termelo-kereso').rows({ query: 'Budapest' });
```

A `localProducers` és `organicSeeds` kényelmi modulok ugyanezt az általános táblázatfelületet használják. Az angol mezőkre alakított rekordokhoz a `datasets` modul ajánlott.

## Portálkeresés

```ts
const result = await client.search.query('pisztácia', { page: 1 });

for await (const item of client.search.iterate('élelmiszer', { maxPages: 3 })) {
  console.log(item.title, item.url);
}
```

A kliens a portál saját keresőűrlapjából olvassa ki a pillanatnyi mezőneveket, és a weboldal keresési eredményeit dolgozza fel. A találatok a portál keresési indexének tartalmát és sorrendjét követik.

## FELIR, EUTR és őstermelő-kereső

```ts
const description = await client.registries.describe('felir');
console.log(description.forms, description.endpoints);
```

Keresőnevek: `felir`, `eutr`, `primaryProducers`.

A keresők CAPTCHA-val védettek. A kliens nem oldja meg a CAPTCHA-t. A `lookup()` működéséhez kívülről átadott, érvényes token és az ahhoz tartozó munkamenet szükséges; a cookie-k a kliens `transport.cookieJar` tárolójába tölthetők. Friss munkamenetet igénylő szolgáltatásnál önmagában egy token nem feltétlenül elegendő.

```ts
const result = await client.registries.lookup(
  'felir',
  { type: 'felir', number: 'AB1234567' },
  captchaToken,
);

console.log(result.data);
```

Támogatott feltételtípusok:

| `type` | További mezők |
| --- | --- |
| `felir` | `number` |
| `taxNumber` | `number`, nyolc számjegy |
| `naturalPerson` | `name`, `birthDate`, `YYYY-MM-DD` alakban |
| `company` | `country`, valamint `name` vagy `registrationNumber` |
| `activity` | `id` |
| `establishment` | `id` |
| `familyFarm` | `id` |
| `familyEnterprise` | `id` |

Az egyes keresők a weboldalon ténylegesen megadott feltételeket támogatják. Nem támogatott feltételnél `ValidationError` keletkezik. A visszatérő `data` objektum megtartja a szerver mezőneveit, és feloldja a JSON-szövegbe ágyazott további JSON-értékeket. A CAPTCHA-val védett találatok teljes adatsémáját hozzáférés nélkül nem lehetett élő válaszokon ellenőrizni, ezért ezek `unknown` típusú értékeket tartalmaznak, nem kitalált rekordtípusokat. A keresés szerveroldali hibáit is a válaszobjektum őrzi meg.

## Navigáció, oldaltérkép és bejárás

```ts
const navigation = await client.navigation.tree();
const links = await client.navigation.links();
const rootSitemap = await client.sitemap.list();

for await (const entry of client.sitemap.iterate({ maxSitemaps: 10 })) {
  console.log(entry.url, entry.lastModified);
}

for await (const { page, depth } of client.pages.crawl({
  start: '/jogsertes-listak',
  maxPages: 10,
  maxDepth: 1,
})) {
  console.log(depth, page.url);
}
```

A `crawl()` a kezdőoldal tartalmi linkjeit követi, azonos eredeten belül. Kihagyja a dokumentumokat, technikai útvonalakat és lapozási paramétereket; az oldalak számát és a mélységet külön korlátozza. Egy konkrét lista összes rekordjához a saját `iterate()` használható. Az `include(url)` szűrővel és `onError(error, url)` hibakezelővel a bejárás szabályozható. Az oldaltérkép külön, szerver által közzétett URL-felderítést biztosít; nem állítja, hogy minden oldal és minden cikk szerepel benne.

## Dokumentumok és külső tartalmak

```ts
import { writeFile } from 'node:fs/promises';

const documents = await client.documents.list('/nebih-kiadvanyok');

if (documents[0]) {
  const file = await client.documents.download(documents[0].url);
  await writeFile(file.filename, file.bytes);
}
```

A letöltési eredmény: `url`, `filename`, `contentType`, `bytes`. A dokumentumokat a kliens memóriába tölti, a válaszméret korlátjának figyelembevételével. PDF-, Excel-, térkép-, videó- és külső alkalmazástartalmakhoz a forráshivatkozásokat őrzi meg; nem állít elő belőlük automatikusan adatbázisrekordokat.

A lekérés alapértelmezetten a konfigurált eredetre korlátozódik. Külső HTML-oldal vagy dokumentum kifejezett felvétellel kérhető le:

```ts
const client = new NebihClient({
  allowedOrigins: ['https://example.org'],
});
```

Ez hozzáférést ad a lekéréshez, de nem tesz hozzá az adott külső alkalmazásra szabott feldolgozót.

## Beállítások és hibák

```ts
const client = new NebihClient({
  timeoutMs: 30_000,
  retries: 2,
  retryDelayMs: 500,
  minIntervalMs: 300,
  cacheTtlMs: 60_000,
  cacheSize: 100,
  maxResponseBytes: 25 * 1024 * 1024,
});

const controller = new AbortController();
const page = await client.pages.get('/friss-hirek', {
  signal: controller.signal,
  fresh: true,
});

client.clearCache();
```

Az alapértékek a példában szerepelnek. További beállítások: `baseUrl`, `allowedOrigins`, `fetch`, `headers`, `cookieJar`. A `fresh` megkerüli a gyorsítótárat. A `baseUrl` tesztkiszolgálóhoz is átállítható. Az eredeti portál régi, azonos kiszolgálóra mutató HTTP-linkjeit a kliens HTTPS-re alakítja.

A GET-kérések átmeneti hálózati hibánál és 408/429/500/502/503/504 válasznál ismételhetők. A várakozás figyelembe veszi a `Retry-After` fejlécet, legfeljebb 30 másodpercig. A CAPTCHA-s POST-keresések nem ismétlődnek automatikusan. Az átirányítások célja is eredetellenőrzésen megy át.

Exportált hibák: `NebihError`, `HttpError`, `ParseError`, `ValidationError`, `CaptchaRequiredError`, `ResponseTooLargeError`. A megszakítás és időtúllépés a futtatókörnyezet `AbortError` / `TimeoutError` hibáját adja tovább. Az `HttpError.status` és `HttpError.url` segít a hibák feldolgozásában.

A dátumok `YYYY-MM-DD` formátumúak, ha egyértelműen feldolgozhatók. A forrás szerinti szöveg a kapcsolódó címke- vagy nyers mezőben megmarad. A hiányzó, nem egyértelmű vagy kötőjellel jelzett típusos érték jellemzően `null`.

## Ellenőrzés és tényleges lefedettség

```sh
npm run check
npm run smoke
```

A `check` egységes formázást, típushelyességet és tiszta buildet ellenőriz. A `smoke` élő, olvasási műveleteket futtat a portálon: listázást, lapozást, részletező oldalakat, keresést, kapcsolati adatokat és keresővégpont-felderítést. A projekt nem tartalmaz külön tesztkönyvtárat.

A 2026. október 30-i felmérés eredményei:

- `data/portal-audit.json`: 158 navigációs URL vizsgálata, a talált mezők, táblázatfejlécek, űrlapok és beágyazások jegyzékével.
- `data/detail-audit.json`: a felderített részletező sablonok mintáinak vizsgálata. A bejárás nem minden történeti rekord egyenkénti ellenőrzése.
- `data/dataset-verification.json`: a típusos táblázatok fejléceinek és feldolgozott mezőinek ellenőrzése.

A felmérés újrafuttatásához a projekt gyökeréből:

```sh
npm run audit:portal
npm run audit:details
npm run verify:datasets
```

A részletaudit a portálaudit ideiglenesen elmentett HTML-oldalait is használja, ezért a két auditot ebben a sorrendben kell futtatni. Az élő felméréseket a normál `check` parancs nem futtatja.

A portál teljes, szerverről lekérhető HTML-tartalmához rendelkezésre áll az általános `pages` / `tables` felület. Az ellenőrzött listák és részletező sablonok külön, típusos feldolgozókat kaptak. A csak JavaScript futtatása után létrejövő tartalom, a külső szolgáltatások belső adatai, a képként közölt szöveg és a CAPTCHA mögötti válaszok nem válnak ettől automatikusan elérhetővé. A weboldal szerkezetének későbbi változása feldolgozófrissítést igényelhet.

## Projektfelépítés

```text
src/
  core/          HTTP, cookie-k, gyorsítótár, URL-kezelés, hibák
  models/        Kisebb, témakörönkénti közös adattípusok
  registries/    Keresési feltételek, útvonalak és válaszfeldolgozás
  datasets/      Témakörönkénti mezőleírások és típuslevezetés
  parsers/       HTML, mezők, részletek, táblázatok, lapozás
  services/      Nyilvános szolgáltatásmodulok
  client.ts      A modulokat összefogó kliens
  routes.ts      Elnevezett portálútvonalak
  types.ts       A közös adattípusok egységes exportja
  index.ts       Nyilvános exportok
examples/        Futtatható használati példák
scripts/         Élő ellenőrzések és felmérések
data/            Az ellenőrzött szerkezetek felmérési eredményei
```

Új, ismert táblázat mezőit a `datasets` megfelelő témaköri fájljában lehet felvenni. A közös listázás, típusátalakítás és nyersmező-megőrzés automatikusan érvényesül. Egyedi elrendezéshez külön feldolgozó készíthető a meglévő `ListingService` használatával, a HTTP-kód megismétlése nélkül.

### A közös működés helye

- A portálútvonalak egyetlen forrása a `routes.ts`; a Liferay-azonosítóké a `core/liferay.ts`.
- A `parsers/table-records.ts` kezeli a megjelenített táblázat kiválasztását, a sorok közös mezőit és a fejlécek egyeztetését. Az összevont cellák külön, témakörtől független feldolgozóban vannak.
- A részletező oldalak URL-ellenőrzése közös; a mezőleképezés, az ismeretlen mezők megőrzése és a kapcsolódó linkek kinyerése szintén közös feldolgozót használ.
- A témaköri modulok csak saját mezőiket és elrendezésüket írják le. A HTTP-, lapozási és általános HTML-kódot nem másolják.
- A HTTP-rétegben a kérésvezérlés, válaszfeldolgozás, ismétlési szabályok és ütemezés külön feladatok.
- A `models` a típusokat, a `services` a hívások összeállítását, a `parsers` a tartalom feldolgozását tartalmazza. A meglévő, gyökérből importálható publikus felület megmaradt.
