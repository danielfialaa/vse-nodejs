# Cvičení 1
Úkolem toho cvičení je vytvoření základní podoby chatovací aplikace v Node.js, pomocí websocketů, respektive knihovny Socket.io. Nejprve bude potřeba si nastavit samotný server, který musí obstarat jak komunikaci pomocí websocketů, tak i vracet příslušné html stránky prohlížeči, abychom nemuseli vytvářet další webový server. Dále bude potřeba přidat logiku i samotným stránkám, aby byla komunikace mezi klientem a serverem možná.

V gitovém repozitáři cvičení, ve větvi „cv1“ se nachází základ, ze kterého budeme vycházet. Jedná se zejména o základní soubor „package.json“, který obsahuje informace, jako jsou název aplikace, verze, primární  soubor, možné scripty a hlavně seznam závislostí na různé knihovny z výchozího správce balíčků [npm](https://www.vzhurudolu.cz/prirucka/package-json). Zde jsou již základní uvedeny a instalaci dalších si ukážeme v dalších cvičeních. Tato větev repozitáře dále obsahuje soubor chatroom.ejs, což je momentálně „hluchá“ stránka, kterou budeme zobrazovat na straně klienta obsahuje potřebný formulář pro odesílání zpráv a prostor pro jejich zobrazení. K této stránce patří i soubor „chatroom.js“, který je v podadresáři „js“ a stará se o logiku na klientovi. Jako poslední je obsažen soubor s kaskádovými styly, aby samotná aplikace alespoň nějak vypadala, ale nemuseli jsme s jejím stylováním nějak zdržovat.

## Spuštění Node.js serveru
Před samotným spuštěním serveru si musíme vytvořit základní soubor, který bude bude například definovat, na jakém portu server poběží a podobně. V package.json vidíme v části „main“ uveden název „server.js“, tento bude tedy node při spuštění hledat. Vytvoříme jej tedy na stejném místě, tedy kořeni adresáře server.

Jako první nadefinujeme základní prvky serveru. Jedná se o základní knihovny, které budeme pro chod aplikace potřebovat. Jako první je „cors“, což je balíček, který nám usnadní spoustu práce s komunikací, více o tomto se můžeme dočíst na webu [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). Dále budeme potřebovat „express“, což je minimalistický webový framework pro nodejs. Ten si poté uložíme do konstanty „app“ a z ní dále vytvoříme konstantu server. Následně potřebujeme naimportovat také naši knihovnu pro webcomponenty, tedy „socket.io“. Tu si opět vložíme do konstanty a při jejím importování předáme námi definovaný server, aby naše sockety naslouchaly na stejném portu jako webový server. Na závěr si ještě naimportujeme knihovnu „body-parser“, která nám umožní snadno zpracovat POST data přicházející na server. Momentálně by náš kód měl vypadat asi takto.

```javascript
const cors = require("cors");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require('body-parser');
```

Po naimportování všech požadovaných knihoven ještě zbývá říct serveru, na kterém portu chceme, aby běžel a přiřadit mu zbývající importované knihovny. Nadefinování požadovaného portu serveru uděláme pomocí funkce listen(PORT), které do parametru předáme číslo portu. Dále aplikace musíme říct, že chceme, aby použila naši knihovnu „cors“ a „body-parser“. K tomuto využijeme funkce use(NÁZEV KNIHOVNY), které do parametru předáme dříve naimportované knihovny. Jak by měl asi vypadat výsledek lze vidět níže. Posledním řádkem express serveru nadefinujeme cestu „/views“, ve které budeme mít veškeré soubory pro klienta.

```javascript
server.listen(8000);
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/views'));
```

Nyní bychom mohli vyzkoušet spustit server, jestli vše proběhne v pořádku. Spustit jej můžeme skrze příkazovou řádku při zadání npm start. Pokud jste zkusili, mohli jste si všimnout, že se v konzoli objevila chyba informující o chybějících knihovnách. Problém je, že knihovny máme nadefinovány v souboru „package.json“ a i je v našem serveru využíváme, ovšem stále jsme si je z balíčkovacího systému nestáhli. Proto musíme nejprve zadat příkaz npm install, který je pro nás z repozitáře stáhne. Pokud tento příkaz nedostane žádný další parametr, projde náš konfigurační soubor a stáhne všechny uvedené závislosti na knihovny. Pokud bychom je neměli nadefinovány, mohli bychom je jmenovitě uvést a opět by nám je script stáhl a rovnou i přidal do našeho konfiguračního souboru. Příklad takové instalace by v našem případě mohl být následující.

```bash
 npm install cors ejs express nodemon socket.io
```

Pokud jsme úspěšně nainstalovali, můžeme opět zkusit server spustit a měl by následně běžet na námi definovaném portu. Pokud se k němu pokusíme přistoupit z prohlížeče skrze adresu „localhost:8000“, měl by nám prohlížeč zobrazit hlášku „Cannot GET /“. Toto je naprosto v pořádku, jelikož jsme serveru nenadefinovali, co přesně má vracet na tento požadavek a dále tak učiníme.

Můžeme si všimnou, že po spuštění serveru se do konzole objevuje balíček „nodemon“, ale v kódu jsme jej nikde neimportovali. Jedná se o balíček, který pro nás restartuje server vždy, když změníme nějaký soubor, aby se nám usnadnil vývoj. Při spuštění serveru se objevuje, jelikož je v konfiguračním souboru uvedeno pro script „start“, aby provedl příkaz „nodemon sever.js“. Server tedy může zůstat spuštěný po celou dobu práce a bude se automaticky aktualizovat s každou změnou (pokud ovšem nedojde k nějaké větší chybě v programu a ten by se tak ukončil).

## Vykreslení HTML stránky

Nyní, když server úspěšně běží, můžeme vyřešit onu zobrazenou hlášku v prohlížeči. Prohlížeč totiž standardně při přístupu na nějakou webovou stránku zavolá GET požadavek na danou doménu a očekává, že mu bude ideálně vrácen HTML kód, který dále vykreslí. Z gitového repozitáře již máme naši stránku pro chatovací okno (chatroom.ejs) a musíme tak jen zařídit, aby server tuto stránku odeslal, pokud obdrží daný požadavek. Samotný express server má funkce pro definování, jak se má zachovat, podle toho, jaký typ požadavku (GET, POST, PUT atp.) obdrží a na jakou URL. Náš express server jsme si nadefinovali do proměnné „app“ a nyní mu tedy musíme nadefinovat reakci na GET požadavek s cestou „/“. Celý kód by měl vypadat asi takto.

```javascript
app.get("/", (req,res) => {
    res.render('chatroom.ejs');
});
```

Tímto kódem jsme tedy nadefinovali, že pokud express server obdrží GET požadavek na danou cestu, provede funkci, která má v parametrech dvě proměnné – „req“ a „res“. První reprezentuje „request“, tedy obsahuje všechny data, která klient poslal s požadavkem a druhá „response“ obsahuje naši odpověď. Zde chceme, aby klient vykreslil naši stránku, proto u odpovědi zavoláme funkci render(), která v parametru nese název požadované stránky. Nyní pokud přistoupíme na server skrze prohlížeč, měli bychom vidět naše chatovací okno. Tato stránka má zmíněný „chatroom.js“, který obstarává její logiku, ta ovšem nyní umí jen zobrazit námi napsanou zprávu. Zde přichází na řadu websockety, které nám tuto komunikaci obstarají. Nejprve je tedy nastavíme na straně serveru a následně přidáme jejich podporu klientovi.

## Komunikace skrze Socket.io

Ze strany serveru jsme danou knihovnu (socket.io) naimplementovali a máme ji uchovanou v proměnné „io“. Nyní musíme nadefinovat potřebné požadavky. Nejprve musíme říct, co se má stát, pokud se někdo skrze websocket připojí. K tomu má naše knihovna funkci on() s prvním parametrem „connection“, jelikož potřebujeme definovat, co se má stát po připojení. V druhém parametru je prakticky funkce, která se má zavolat. Ta má v parametru socket, který přišel od daného klienta a v ní budeme definovat možné druhy požadavků. Můžeme si prozatím přidat výpis do konzole, takže budeme moci později ověřit, že se klient skutečně připojil. 

```javascript
io.on("connection", (socket) => {
    console.log('Somebody just connected');
    // Zde se definují jednotlivé požadavky
});
```
Jednotlivé požadavky se dále definují již na „socket“, který máme jako parametr funkce, do které je definujeme. Opět použijeme funkce „on“ a můžeme si nadefinovat vlastní název požadavku. Řekněme tedy, že pokud bude klient posílat zprávu, odešle požadavek s názvem „send-chat-message“ a v tomto požadavku pošle text této zprávy. Takto nadefinovaný požadavek by měl vypadat asi takto.

```javascript
socket.on("send-chat-message", (msg) => {
    // Zde budeme definovat, co se má stát, pokud na server příjde zpráva
});  
```

Server je tedy schopen přijmout tento požadavek skrze websockety a očekává jeden parametr. Zbývá jen rozeslat přijatou zprávu mezi všechny ostatní klienty. K tomu můžeme použít socket.broadcast.emit() (broadcast – všem, emit – rozeslat), která rozešle vybraný požadavek mezi všechny známé klienty, společně s daty. V prvním parametru musíme uvést název požadavku (na tento název požadavku bude reagovat strana klienta) a jako další parametry můžeme přidat jakákoliv data (v našem případě tělo zprávy). Celá momentální logika pro naše websockety, by měla tady odpovídat kódu níže.

```javascript
io.on("connection", (socket) => {
    console.log('Somebody just connected');
    socket.on("send-chat-message", (msg) => {
        socket.broadcast.emit('chat-message', msg);
    });  
});
```

Teď musíme zařídit, aby klient po odeslání zprávy zavolal přes websockety požadavek „send-chat-message“ a aby byl připraven reagovat na příchozí požadavek „chat-message“.  Na začátek souboru s logikou klienta si nastavíme námi požitou knihovnu pro websockety. Zde musíme vyplnit adresu, na které náš server běží.

```javascript
const socket = io("http://localhost:8000");
```
V tomto souboru již máme vytvořenou funkci appendMsg(), která přidá zprávu do stránky a také je zde nadefinový [„event listener“](https://www.w3schools.com/js/js_htmldom_eventlistener.asp) pro odeslání zprávy, tedy co se má stát, pokud uživatel odešle zprávu. Nejprve tedy do tohoto eventu přidáme, aby odeslal naši zprávu přes websocket. Funkce pro socket jsou shodné s těmi na straně serveru, opět tedy použijeme „emit“, tentokrát ovšem bez „broadcast“, jelikož odesíláme požadavek serveru, a ne do širokého okolí. Do parametru nezapomeneme přidat tělo naší zprávy.  

```javascript
socket.emit("send-chat-message", msgInput.value);
```

Takto jednoduše jsme nadefinovali naše odeslání a zbývá už jen zprávy i přijímat. Pro toto jsme si na serveru nadefinovali, aby odeslal požadavek „chat-message“, ten tedy nyní musíme odchytit. Stejně jako na serveru použijeme funkci on(). Jak vidíme níže, je to velmi podobné jako například dříve definovaný GET požadavek na straně serveru. V prvním parametru tedy nadefinujeme název požadavku, tedy „chat-message“ a dále funkci, která má v parametrech všechna data, která odesíláme ze serveru. V samotném těle už pouze zavoláme již hotovou funkci appendMsg(), která nám zprávu přidá na stránku.

```javascript
socket.on("chat-message", (msg, from) => {
  appendMsg(msg, „Someone“, true);
});
```