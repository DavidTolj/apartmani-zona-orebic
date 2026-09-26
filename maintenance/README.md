# Apartmani Zona — održavanje cjenika

## Početna verzija

Tehnička priprema 20.9.2026. prema NN 101/2026, odlukama 1212 i 1213, te pisanim uputama HOK-a od 18.9.2026. Primjena odluka počinje 1.10.2026. Ovo nije službena potvrda pravne usklađenosti.

Izvor cijena: postojeći cjenik za 2026., šest smještajnih jedinica i tri razdoblja. Uspoređen s Git verzijom `31a6dcd` od 12.8.2026. i potvrdom korisnika u razgovoru 20.9.2026. Redovne cijene jednake su usporednima. Istekli Last Minute nije vraćen. Uspoređuju se ista jedinica i isto razdoblje boravka iz cjenika važećeg 10.9.2026.; ne prenosi se rujanska cijena na sve ljetne termine.

## Izmjena cijena

1. Provjeriti stvarne, odobrene cijene i što je uključeno. Ne prepisivati druge portale bez potvrde domaćina. Za nove usluge, novu sezonu, dodatne naknade ili popuste najprije utvrditi ispravan referentni podatak s računovođom/nadležnim tijelom. Postojeći generator namjerno odbija akcije i nedostajuće iznose.
2. U `zona-prices.json` povećati `revision`, promijeniti samo aktualne `prices`. `referencePrices` ne mijenjati s aktualnim cijenama. Ispravak pogrešne povijesne cijene također zahtijeva novu verziju i sačuvan dokaz, ne prepisivanje arhive.
3. Iz mape `maintenance` instalirati deklarirane ovisnosti (`npm install`), zatim pokrenuti `npm run prices`. Generator radi nad korijenom ovog projekta, ažurira sve jezike, kartice, tablice, aktualne CSV/XML datoteke i arhivski manifest. Nije potrebno pokretati ga na hostingu pri svakom posjetu.
4. Pregledati sve promjene i testirati preuzimanja, 18 stavki, pet jezika, prikaz na mobitelu i kontaktne obrasce. Objaviti cijeli projekt putem postojećeg GitHub → Netlify postupka, zajedno s funkcijama za kalendar. Ne zamijeniti produkciju nepotpunim paketom samo HTML datoteka.
5. Kod promjene usluga objavu dovršiti prema propisanom roku, najkasnije do 8:00 dana kada se objavljuje izmjena. Lokalno generiranje nije objava; provjeriti da je Netlify objava završena i da javne datoteke odgovaraju novoj verziji.
6. Uskladiti cjenike u objektu i ostala mjesta gdje se cijene oglašavaju. Ovaj projekt uređuje isključivo web Apartmana Zona; ne mijenja cjenik Caffe Bara Zona niti cijene na drugim portalima.

## Arhiva

`cjenik/arhiva/` mora ostati u svakoj idućoj objavi. Verzije imaju vlastite nazive s vrstom i adresom objekta, oznakom ZONA-OREBIC, rednim brojem i UTC vremenskom oznakom pripreme datoteke. Manifest povezuje objave. Stare datoteke ne prepisivati i ne brisati: ovaj sustav ih zadržava trajno, što je dulje od minimalnih 30 dana. Svaki novi generator mora očuvati tu mapu. Cjenik i arhiva ne zahtijevaju prijavu niti JavaScript.

Stabilne adrese su `/cjenik/aktualni.csv` i `/cjenik/aktualni.xml`. Imaju obaveznu ponovnu provjeru predmemorije. Gumbi za preuzimanje vode na imenovane datoteke aktualne verzije. CSV je UTF-8 s BOM-om, razdvojnik točka-zarez, svi podaci su navodnicima zaštićeni, decimalni separator točka. XML sadrži iste stavke i podatke o objektu. Datumi boravka, valuta, jedinica obračuna i referentni datum dio su izvoza.

Arhiva služi cjeniku, ne stanju raspoloživosti. Dostupnost smještaja i dalje potvrđuje domaćin; privatni iCal izvori i osobni podaci gostiju nisu sadržani u izvozu.

## Ručne obveze

- Sačuvati izvorni cjenik i dokaz o redovnim cijenama na referentni datum.
- Domaćin je 26.9.2026. potvrdio da cijene uključuju turističku pristojbu, čišćenje i sve obvezne troškove. Revizija 2 bilježi tu informaciju, bez promjene bilo kojeg od 18 iznosa. Za drukčiji model naplate prvo uskladiti tekst i generator.
- Zasebno provjeriti i urediti cijene ugostiteljskih usluga ako se posluje kao Caffe Bar Zona. Ova prilagodba pokriva samo objavljene usluge smještaja.
- Kod promjene propisa provjeriti NN i najnovije službene upute. Nije postavljeno automatsko pravno praćenje niti obećana trajna usklađenost.

Izvori:
- https://narodne-novine.nn.hr/clanci/sluzbeni/2026_09_101_1212.html
- https://narodne-novine.nn.hr/clanci/sluzbeni/2026_09_101_1213.html
- https://www.hok.hr/novosti-iz-hok/dodatna-cijena-i-objava-cjenika-od-1-listopada-2026-najvaznije-informacije

## Dorade od 26.9.2026.

Pet prijevoda obavijesti o uključenim troškovima nalazi se u `zona-legal-copy.json`, koju koristi i generator. Nove stranice `/uvjeti/` imaju odgovarajuće jezične inačice i uključuju postupak prigovora. Kopija upita Studiju ostaje uključena radi podrške, prema potvrdi korisnika. Nepotvrđeni registrirani podaci pružatelja i točni komercijalni uvjeti vode se u zapisniku pripreme; ne pretpostavljati da je objava nacrta njihova potvrda.
