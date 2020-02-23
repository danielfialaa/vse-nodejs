# Cvičení 2
Toto cvičení přímo navazuje na předchozí, a tak i soubory dostupné ve větvi „cv2“, které jsou základ této lekce, více méně reprezentují výsledek, kterého jsme měli dosáhnout na konci minulého cvičení, doplněný o další frontendové soubory (index.ejs a index.js). Úkolem v tomto cvičení bude tedy přidat podporu pro zobrazení a vytváření místností, čehož dostáhneme skrze Fetch API, které si na straně klienta zaobalíme do vlastní funkce, pro jednodušší práci a vytvoříme si potřebné endpointy na straně serveru. Prozatím vynecháme napojení na databázi a budeme místnosti pro jednoduchost ukládat do proměnné přímo na serveru. Samotnou logiku chatování v místnostech si ukážeme v další lekci.

Doplněný soubor „index.ejs“ bude představovat hlavní stránku, ve které budeme zobrazovat seznam místností. Není nutné přímo vycházet ze souborů ve větvi tohoto cvičení, můžeme tedy využít ty, které máme z minulé lekce a stačí pouze přidat onen doplněný soubor.

## Příprava Fetch API
Fetch nám umožňuje posílat požadavky z klienta na sever, jako v minulosti používaný XMLHttpRequest. Je zde ale zásadní rozdíl – Fetch používá takzvané „promises“, což je v podstatě objekt, který reprezentuje „případné dokončení“ asynchronního dotazu. Tomuto objektu můžeme dále přidat funkci (callback), která se vykoná po dokončení našeho dotazu na server. Pro úplně zjednodušení si můžeme představit, že reprezentuje určitý příslib, že nám daná funkce vrátí nějakou hodnotu a my můžeme určit, co se má stát potom, co ji dostaneme, ale ještě předtím, než jsme ji skutečně dostali.

Abychom si samotnou práci s Fetchem usnadnili, respektive nemuseli stále dokola psát stejný kód, vytvoříme si vlastní funkci, která nám jej zaobalí. Komunikace se serverem se nám tak bude psát mnohem příjemněji, ubráníme se nechtěné duplicitě kódu a usnadníme si jeho případné úpravy, jelikož budou třeba jen na jednou místě.

Ve složce „server/views/js/“ si tedy vytvoříme soubor, například „fetchApi.js“ a v něm si napíšeme naši komunikační funkci, kterou budeme dále importovat v potřebných částech aplikace. To že budeme chtít importovat přímo danou funkci, a ne celý soubor je zásadní při vytváření funkce, jelikož ji musíme před její definicí doplnit o slovo „export“. Při každém volání naší funkce je pro nás zásadní, na jakou adresu volání provádíme, jakou metodu používáme (GET, POST, PUT atd.) a případně jaká data na server posíláme. Vše ostatní, jako jsou hlavičky a jiné části komunikace nám stačí nastavit jednou. Z tohoto nám vychází, že naše funkce bude potřebovat tři parametry – url, metodu a data. V samotném těle funkce už si pouze vytvoříme „fetch()“, který provede náš požadavek na server dle zadaných parametrů. Tato funkce jako první parametr příjme adresu, na kterou má směřovat požadavek a následně JSON objekt, který bude obsahovat požadovanou metodu, hlavičky a námi odesílaná data (body). U odesílaných dat si musíme zabezpečit, aby se žádná neodesílala při metodě GET, jelikož ta slouží pouze pro přijetí dat ze serveru a došlo by tak k chybě na straně klienta. Na konec naší funkce pak pouze přidáme „return“, ve kterém budeme vracet námi vytvořený fetch, na který ale ještě použijeme funkci „json()“, abychom měli odpověď v pro JavaScript ideálním formátu.

```javascript
export async function api(url = '', method = '', data = {}) {
    const response = await fetch(url, {
      method: method, // GET, POST, PUT ...
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: method === 'get' ? undefined : JSON.stringify(data)
    });
    return await response.json();
}
```

Nyní jsme tedy schopní si tuto funkci naimportovat kdekoliv v aplikaci a provést dotaz na server pomocí jednoduchého zavolání jako například:

```javascript
api("endpoint-url", "post", {test: "test data"})
```
## Příprava endpointů
Na straně serveru budeme potřebovat dva endpointy (adresy/místa), na které bude klient směřovat komunikaci při vytváření a načítání místností. Vytváření endpointů je velmi podobné tomu, když jsme vraceli klientovi HTML stránku (viz. branch cv1).

Nejprve si vytvoříme proměnou v souboru našeho serveru (server.js), která bude v poli uchovávat naše místnosti a rovnou ji nějakými naplníme. Budeme tak mít vždy po startu serveru vytvořené nějaké místnosti, jelikož po jeho restartu se bude proměnná inicializovat znovu.

```javascript
let rooms = ['Room1', 'Room2'];
```

Nyní si připravíme endpoint, skrze který bude klient získávat seznam existujících místností. Vzhledem k tomu, že se jedná pouze o jednoduchý dotaz, kdy chce klient získat určitá data, použijeme metodu GET. Takový endpoint jsme již tvořili při vykreslování stránek, rozdíl bude ovšem v samotném těle funkce, kdy na parametr „res“ nebudeme aplikovat funkci „render“ ale „send“, tedy odesílat data klientovi. Do parametru této funkce pak již stačí pouze přidat naši proměnnou obsahující existující místnosti.

```javascript
app.get('/rooms-list', (req,res) =>{
    return res.send(rooms);
});
```

Dále chceme mít možnost místnosti vytvářet. Jelikož na tento endpoint bude klient posílat název místnosti, nepoužijeme již metodu GET ale POST. 

```javasript
app.post('/create-new-room', (req,res) => {
});
```

Jak bylo řečeno dříve, máme v těle endpointu dostupné dva parametry – req a res. Právě první obsahuje informace o požadavku od klienta a odsud i získáme daný název, který nám klient bude posílat. Právě pro práci s těmito informacemi jsme si na server v minulé lekci importovali knihovnu „body-parser“. Díky ní budeme mít všechna data, která klient odeslal dostupná skrze „req.body“. Jedná se o stejná data, která doplňujeme do „body“ v přípravě Fetch API. Dostaneme tedy JSON a předpokládejme, že bude obsahovat „room“ s názvem dané místnosti. Tento název tedy pomocí funkce „push“ vložíme do naší proměnné a klientovi můžeme vrátit informaci o úspěšném zapsání místnosti na server.

```javascript
app.post('/create-new-room', (req,res) => {
    rooms.push(req.body.room);
    return res.send({
      status: 'success'
    });
});
```

Problémem u tohoto kódu je, že neověřujeme, zda k zápisu skutečně došlo a vždy vracíme informaci o úspěšném zápisu. Dokud zapisujeme čistě do proměnné, můžeme prozatím tento problém ignorovat, ale jakmile začneme data zapisovat do databáze, je vhodné si na toto dát pozor.

Nyní máme tedy máme možnost ze strany klienta získat seznam místností a vytvořit nové. Měli bychom ovšem vyřešit, jak se o nově vytvořené místnosti dozví i ostatní uživatelé, respektive jak informovat klienta o tom, že jsou nové místnosti, aby si opět stáhl seznam. Logicky se bude požadavek na seznam volat při načtení stránky a dále se nabízí možnost opakovat jej v pravidelném intervalu, ale vzhledem k tomu, že naše aplikace již využívá websockety, můžeme využít je a získat tak ideální řešení, kdy se při každé vytvořené místnosti rozešle informace mezi všechny klienty, aby se znovu dotázali serveru na místnosti. Zde u odesílání socketu musíme postupovat trošku jinak, jelikož se nenacházíme přímo v těle funkce „io.on()“ a nemůžeme tak použít předešlé „socket.emit“. Jelikož tedy nejsme uvnitř „io“ musíme při odesílání začít u něj.

```javascript
io.sockets.emit('room-updated');
```

Tímto způsobem jsme mimochodem schopni odeslat případnou notifikaci kdekoliv v aplikaci, kde budeme mít přístup k „io“. Naše výsledné enpointy by tedy měli vypadat asi takto.

```javascript
let rooms = ['Room1', 'Room2'];
app.get('/rooms-list', (req,res) =>{
    return res.send(rooms);
});
app.post('/create-new-room', (req,res) => {
    rooms.push(req.body.room);
    io.sockets.emit('room-updated');
    return res.send({
      status: 'success'
    });
});
```

Mimochodem tento způsob, kdy se při vytvoření místnosti rozešle informace na všechny klienty a ti začnou hromadně posílat požadavky na seznam místností, nemusí být vždy úplně vhodný, kvůli možnému vytížení serveru. Pro naše potřeby však naprosto postačí.

## Klient
Ještě, než začneme psát komunikaci skrze naši funkci pro Fetch API musíme si upravit cesty pro zobrazení stránek na našem serveru. Z repozitáře máme nyní „index.ejs“, ve kterém budeme seznam místností zobrazovat, a i vytvářet nové.  Zobrazit ho budeme chtít přímo na cestě „/“, kde jsme doposud měli náš chat (ten si prozatím můžeme přesunout na jinou adresu). Naše cesty na serveru by tedy měli vypadat následovně.

```javascript
app.get("/", (req,res) => {
    res.render('index.ejs');
});
app.get("/chat", (req,res) => {
    res.render('chatroom.ejs');
});
```

Nyní, když se nám správně zobrazuje naše hlavní stránka můžeme ji začít plnit daty. Spolu s naším vizuálem (index.ejs) máme z repozitáře k dispozici soubor „index.js“, který obsahuje funkci „createRoomList“, která je připravená, že jí v parametru předáme seznam místností, který obdržíme ze serveru a vytvoří nám na stránce seznam.

Začneme tím, že si naimportujeme naší dříve vytvořenou funkci pro komunikaci se serverem. Díky tomu, že jsme funkci napsali jako „export function“, můžeme ji jednoduše naimportovat přímo ze souboru.

```javascript
import { api } from "/js/fetchApi.js";
```

Teď máme tedy k dispozici naši funkci „api“, kterou použijeme v naší funkci pro načtení místností. Tu si můžeme pojmenovat například „loadRooms“. Uvnitř ní tedy použijeme funkci „api“, kde komunikaci budeme směřovat na náš endpoint pro získání seznamu místností, který jsme si vytvořili na serveru. U něj jsme definovali, že má přijímat metodu GET na adrese „/rooms-list“. Tyto informace tedy předáme do parametrů naší funkce, která bude komunikaci zpracovávat.

```javascript
function loadRooms(){
    api("rooms-list", "get")
}
```

Jak jsme si řekli, zde získáme pouze onen „promise“ a musíme tedy nadefinovat, co se má stát, jakmile opravdu dostaneme data ze serveru. Toho dosáhneme tak, že neukončíme řádek klasicky pomocí „;“, ale připojíme „.then()“. Právě zde budeme definovat, co se má stát. Přímo do jeho parametru si můžeme vložit funkci, která bude mít parametr data a vše zpracuje. Celé to bude tedy vlastně fungovat tak, že jakmile se nám vrátí data ze serveru, provede se „then“, který v sobě bude mít funkci, kterou zavolá. Uvnitř této funkce pak potřebujeme pouze zavolat předem dostupnou funkci „createRoomList“, které předáme příchozí data. Jelikož budeme chtít načíst místnosti ihned po příchodu na stránku, rovnou si funkci v kódu zavoláme.

```javascript
function loadRooms(){
    api("rooms-list", "get").then(data => {
        createRoomList(data);
    });
}
loadRooms();
```

Nyní když se podíváme na stránku naší aplikace, měli bychom vidět seznam našich místností, které jsme si definovali na straně serveru.
Zbývá nám vytváření místnosti. V našem rozhraní můžeme vidět v pravém dolním rohu ikonu „+“, na kterou pokud klikneme, zobrazí se nám formulář pro vytvoření místnosti. V souboru s logikou této stránky (index.js) již máme opět připravené odchycení události na odeslání tohoto formuláře („newRoomForm.addEventListener“). Zde máme již i dostupnou hodnotu, kterou uživatel vyplnil skrze „newRoomInput.value“. Potřebujeme již tedy pouze odeslat tuto informaci na server. Opět použijeme naši funkci pro Fetch API.

```javascript
api("create-new-room", "post", { room: newRoomInput.value })
```

V prvním parametru máme námi nadefinovanou cestu pro vytvoření místnosti a tentokrát použijeme metodu POST, zaprvé, protože odesíláme na server data a zadruhé, jelikož jsme si tak nadefinovali na serveru (kdybychom použili nyní například PUT, nebude nám komunikace fungovat, jelikož server očekává POST požadavek). Změna oproti našemu minulému požadavku na server ze strany klienta je třetí parametr. Ten je ohraničen složenými závorkami, jelikož chceme data poslat jako JSON, dále obsahuje klíč „room“, na který jsme se připravili již na straně serveru a k němu je přiřazena naše hodnota z pole, do kterého uživatel vyplnil název místnosti. Můžeme si opět nadefinovat, co se má stát, jakmile přijde ze serveru odpověď a třeba i „.catch()“, u kterého si můžeme nadefinovat, co se má stát, pokud by komunikace selhala.

```javascript
newRoomForm.addEventListener("submit", e => {
  e.preventDefault();
  const newRoomInput = document.getElementById("new-room-input");
  api("create-new-room", "post", { room: newRoomInput.value })
    .then(data => {
      console.log(data);
    })
    .catch(e => {
      console.error(e);
    });
});
```

Pokud nyní vytvoříme místnost, můžeme si všimnout, že pokud nyní vytvoříme místnost, zobrazí se nám až při obnovení stránky. Právě kvůli obnově seznamu místností jsme si na straně serveru nadefinovali, že se má rozeslat socket „room-updated“. Na ten tedy nyní musíme na straně klienta zareagovat a zavolat funkci „loadRooms“ a načíst tak znovu seznam ze serveru.

Nejprve si tedy nadefinujeme náš socket, tak jako v předešlé lekci, abychom s ním mohli pracovat, respektive odchytit informaci o změnách v místnostech.

```javascript
const socket = io("http://localhost:8000");
```

Nyní můžeme, stejně jako jsme to dělali při příjmu zpráv v chatu, odchytit daný socket pomocí „on“ a zavolat naši funkci pro obnovení místností.

```javascript
socket.on('room-updated', () => {
    loadRooms();
});
```

Pokud jsme vše provedli správně, měl by se při vytvoření místnosti seznam automaticky obnovit, a to všem uživatelům, kteří se na stránce zrovna nacházejí.
