# Cvičení 7
Naše současná podoba aplikace disponuje možností přihlášení. Uživatel si tedy může vytvořit účet, přihlásit se a díky tomu máme také k dispozici jeho přihlašovací jméno. Ohledně přihlašování nám chybí zamezit přístup k seznamu místností a přímo do místností, pokud není uživatel přihlášen. Díky tomu, že máme k dispozici jméno daného uživatele, můžeme také zapracovat na příjemnějším použití aplikace. Přidáme oznámení do místnosti, jakmile se do ní nějaký uživatel připojí, zobrazíme jeho jméno u zpráv, které zaslal a také budeme zobrazovat seznam právě píšících uživatelů. Také budeme vypisovat informační hlášku, kterou jsme si při implementaci nachystali, pro informaci o chybném přihlášení.
## Zabezpečení přístupu do aplikace
Aplikace jako taková by neměla být přístupná bez předchozího přihlášení. Potřebujeme tedy na všech cestách (kromě těch pro registraci a přihlášení) kontrolovat přihlášení uživatele, od kterého na server požadavek přijde. Na toto si vytvoříme dvě funkce, jedna bude kontrolovat, jestli je uživatel přihlášen, pokud ano, bude vše probíhat dále. Pokud ovšem vyjde, že přihlášen není, přesměrujeme ho na přihlašovací obrazovku. Druhá funkce bude dělat víceméně opak. Tu budeme používat na přihlašovacím a registračním okně, abychom uživatele rovnou z těchto částí přesměrovali do seznamu místností, pokud už je dávno přihlášen.

Vzhledem k tomu, že využíváme knihovny Passport, je tato implementace poměrně snadná, jelikož si přihlášení můžeme při každém požadavku ověřit pomocí req.isAuthenticated(). Tato funkce nám jednoduše vrátí boolean, reflektující, zda je uživatel odesílající požadavek podle serveru přihlášen. Vytvoříme si tedy dvě výše popsané funkce.

```javascript
function checkAuth(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}
function checkNotAuth(req, res, next) {
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}
```

Na první pohled vypadají velmi podobně, jako naše arrow funkce v endpointech. S tím rozdílem (tedy kromě toho, že se jedná o běžný zápis funkce), že zde přibyl parametr **next**. Ta pro nás představuje funkci, kterou zavoláme, pokud budeme chtít pokračovat dále. V první funkci tedy pokud je uživatel přihlášen, v druhém případě pak naopak. První funkci tedy budeme chtít použít u endpointů, které mají být dostupné pouze přihlášeným uživatelům. Druhou funkci pak pro přesměrování přímo do seznamu místností, pokud by uživatel byl již přihlášen, ale ocitl se na přihlašovací obrazovce. Zakomponování těchto funkcí do jednotlivých endpointů je právě díky zmíněný funkce **next** velmi snadná. Stačí požadovanou funkci přidat každému endpointu do parametru, před arrow funkci, která se stará o jeho provedení. Například u zobrazení místností takto a obdobně přidáme požadované funkce k ostatním.

```javascript
app.get("/", checkAuth, (req,res) => { . . . }
```

## Zobrazení jména u zprávy a při připojení do místnosti
Mohlo by se zdát, že nyní zobrazení jména odesílatele bude jen otázkou přidání dalšího parametru u rozesílání daného socketu. Částečně je to pravda, ovšem nyní nastává jeden problém. Musíme se k dostat k danému jménu uživatele, které máme v naší session, z websocketů, které jsou od tohoto oddělené. Nedostaneme se k těmto datům tedy tak, jako při vyřizovaní klasického požadavku, odeslaného na endpoint. Musíme si tedy naši session propojit i se sockety. K tomu nám vypomůže knihovna ** express-socket.io-session**. Tu si tedy skrze npm nainstalujeme.

```bash
npm i express-socket.io-session
```

Nyní budeme muset pozměnit nastavení session na našem serveru, aby vše navzájem fungovalo.
Nejprve si změníme pro usnadnění náš import **express-session**.

```javascript
const session = require('express-session');
. . .
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

// Změníme na 
const session = require('express-session')({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true
});
. . .
app.use(session);
```

Nyní si naimportujeme před chvíli nainstalovanou knihovnu pro sdílení session se socket.io.

```javascript
const sharedsession = require("express-socket.io-session");
```

Vše je připraveno a zbývá pouze vše napojit na naše websockety. Respektive nastavit knihovně socket.io, aby použila sdílenou session, do které předáme naši hlavní **express-session**. Díky tomu budeme mít všechny údaje přístupné i při požadavcích skrze sockety.

```javascript
io.use(sharedsession(session));
```

Při připojení do místnosti odešle klient socket **join**. Právě zde budeme chtít k danému socketu nastavit jméno uživatele (které získáme ze sdílené session), které budeme využívat k zobrazení, kdo se připojil do místnosti, odesílatele a seznamu píšících uživatelů. Cesta k samotným údajům se může zdát poměrně zmatená. Skrze socket se k session dostaneme skrze socket.handshake.session. Odkud se potřebujeme dostat k session, kterou vytvořil Passport, tedy přidáme .passport a nakonec z této session chceme část dat o uživateli, kterou najdeme v části .user, kde máme uložené ID uživatele. Pomocí něj budeme hledat v našem seznamu uživatelů, podobně jako jsme to dělali v naší arrow funkci, která byla jako poslední parametr ve funkci initPassport(). Toto vše si jednoduše uložíme do našeho socketu, například pod klíčem **username**.

```javascript
socket.on("join", (room) => {
	socket.username = users.find(user => user.id === socket.handshake.session.passport.user).name;
        socket.join(room, e => {
	console.log(socket.username + " joined room " + room);
        });
});
```

V tuto chvíli, když se uživatel připojí do místnosti, najde se podle ID jeho jméno v seznamu uživatelů a přiřadí se k jeho socketu. Dále budeme o této skutečnosti informovat i ostatní uživatele v místnosti. Rozešleme tedy socket (například **joined**) všem v místnosti, v němž pošleme jméno onoho uživatele.

```javascript
socket.join(room, e => {
    socket.to(room).broadcast.emit("joined", socket.username);
    console.log(socket.username + " joined room " + room);
});
```

Než se pustíme do reakce na tento socket na straně klienta, přidáme si nově získané jméno uživatele k zprávě, kterou rozesíláme pomocí socketů.

```javascript
socket.on("send-chat-message", (msg, room) => {
    socket.to(room).broadcast.emit("chat-message", msg, socket.username);
});
```

Na zobrazení odesílatele na straně klienta máme vše připraveno, pouze využijeme druhý, dosud nepoužitý, parametr pro reakci na socket **chat-message** (soubor chatroom.js). Druhý parametr ve funkci appendMsg() nahradíme za parametr **from**.

```javascript
socket.on("chat-message", (msg, from) => {
  appendMsg(msg, from, true);
});
```

Co se týče zobrazení, že se uživatel připojil do místnosti, musíme zareagovat na dříve naimplementovaný socket **joined**. Zde v parametru dostaneme jméno uživatele. Nebudeme řešit implementaci zobrazení nějaké speciální hlášky a využijeme tedy naši funkci pro vykreslení zpráv 

```javascript
appendMsg(), kde si místo předání zprávy napíšeme informační hlášku a jako odesílatele nastavíme například **Info**.
socket.on("joined", (user) => {
  appendMsg(user + " has joined a room!", "Info", true);
});
```

## Seznam právě píšících uživatelů
Implementace této funkčnosti se dá zvládnout poměrně snadno. V principu musíme zachytávat událost, kdy má uživatel označené pole pro psaní zprávy a stiskne nějakou klávesu. Dále na základě obsahu tohoto pole určíme, jestli píše (něco je vyplněné), případně psát přestal, a odešleme websocket s touto informací na server. Server bude mít proměnou, ve které bude uchovávat seznam uživatelů, u kterých eviduje, že píší. Po přijetí socketu vyhodnotí, zda uživatel píše, nebo pole právě vymazal, dle toho upraví seznam píšících uživatelů a dále už jen zbývá uživatelům v dané místnosti rozeslat websocket s tímto seznamem.

Podobně jako máme event pro odeslání formuláře, odchytíme událost pro stisknutí klávesy (použijeme keyup, aby se neodesílali sockety dokola při držení klávesy). V tomto kódu si dále vytvoříme proměnou, kde vyhodnotíme obsah tohoto pole. Nebudeme přímo odesílat obsah, ale pouze **true**, pokud něco obsahuje, případně **false**, pokud je pole prázdné. Následně jen odešleme websocket na server pomocí socket.emit(). Jako cíl můžeme vybrat například **typing**, dále odešleme místnost, ve které se uživatel nachází a naší proměnou reprezentující, zda uživatel píše.

```javascript
msgInput.addEventListener("keyup", e => {
  const isTyping = e.target.value.length > 0 ? true : false;
  socket.emit("typing", room, isTyping);
});
```

Než se pustíme do implementace funkce, která bude na tento socket reagovat na straně serveru, na klientovi si ještě připravíme kód, který bude reagovat na příchozí socket se seznamem píšících uživatelů. Tento socket může být například **users-typing**, ve kterém budeme očekávat jeden argument a tím bude pole obsahující seznam píšících uživatelů. Při obdržení socketu budeme pouze volat funkci uvedenou níže, kterou si vložíme do kódu. Tato funkce více méně jen na základě příchozích hodnot mění, zda má být pole píšících uživatelů viditelné a jak se mají jména zobrazit.

```javascript
socket.on("users-typing", typing => {
  showTyping(typing);
});

function showTyping(typing) {
  const meTyping = e.target.value.length > 0 ? 2 : 1;
  const typingUsers = document.getElementById("typing-users");
  if (typing.length === (meTyping - 1)) {
    typingUsers.style.visibility = "hidden";
  } else {
    typingUsers.style.visibility = "visible";
    typingUsers.style.fontSize = "8px";
    typingUsers.style.color = "grey";
    typingUsers.innerText =
      typing.toString() + (typing.length > meTyping ? " are " : " is ") + "typing";
  }
}
```

Tímto jsme prakticky vyřešili stranu klienta (prvek pro zobrazení píšících uživatelů je již součástí šablony – chatroom.ejs).

Z toho, co jsme právě naimplementovali vyplívá i co musíme udělat na straně serveru. Tedy být schopni zareagovat na socket **typing**, na základě něj provést výše popsané úkony a rozeslat socket **users-typing**. Toto budeme implementovat do těla funkce io.on("connection".. stejně, jako ostatní reakce na příchozí sockety. U příchozího socketu **typing** si z klienta odesíláme dvě hodnoty – místnost, ve které je uživatel a informaci, zda uživatel píše. Odsud tedy budeme dále odesílat zpět socket se seznamem uživatelů. 

```javascript
socket.on("typing", (room, typing) => {
    socket.to(room).broadcast.emit("users-typing", typingUsers);
});
```

Máme připravené sockety, chybí nám ovšem nyní odesílaná proměnná **typingUsers**. Vytvoříme si tedy tuto proměnou s tímto názvem stejně, jako máme proměnou **rooms** pro místnosti nebo **users** pro registrované uživatele. Logika celé funkce bude poměrně snadná. Nejprve zkontrolujeme, zda v ní již daný uživatel není. Následně pokud v našem seznamu uživatel není a dle příchozí hodnoty uživatel píše, přidáme jej do naší proměnné (jelikož se jedná o pole, použijeme funkci .push()). Pokud bychom zjistili přesný opak, tedy že uživatel nepíše a v seznamu se nachází, musíme jej pomocí .splice() ze seznamu odebrat. Pokud se nepotvrdí ani jedna z podmínek, nemusíme seznam nijak upravovat a rovnou odešleme socket se seznamem píšících uživatelů.

```javascript
socket.on("typing", (room, typing) => {
    const index = typingUsers.indexOf(socket.username);
    if(typing && index < 0){
        typingUsers.push(socket.username);
    }else if(!typing && index > -1){
        typingUsers.splice(index, 1);
    }
    socket.to(room).broadcast.emit("users-typing", typingUsers);
});
```

## Zobrazení informačních hlášek u autorizace
Informační hlášky o chybném přihlášení jsme si již nadefinovali v minulé lekci. Také jsme si naimportovali knihovnu **express-flash**, která se o zobrazení těchto hlášek stará. Vzhledem k tomu, že využíváme template soubory express serveru (soubory s příponou .ejs), zobrazení těchto hlášek je záležitostí několika řádků. Server totiž před vykreslením stránky, respektive před vrácením html kódu, vyhodnotí kód, který je ohraničen <% %>. Informační zprávu máme i napojenou a zobrazení pro nás tedy v tuto chvíli znamená doplnění tří řádku do souboru s formulářem pro přihlášení (login.ejs).

```javascript
<% if(messages.error) { %>
    <%= messages.error %>
<% } %>
```

Tento text můžeme umístit na stránce kam budeme chtít, stejně tak jej vložit do nějakého elementu a případně si jej i více nastylovat.

## Odhlášení uživatele
Naše aplikace má na stránce se seznamem místností v pravém horním rohu ikonku, na kterou když klikneme, objeví se menu, kde je možnost odhlášení. Dosud jsme ovšem tuto možnost nenaimplementovali a je nutné ji dodělat.
V souboru, kde toto menu najdeme (index.ejs) musíme nejprve nastavit cestu pro odhlášení. Najdeme tedy část kódu, kde se tlačítko na odhlášení nachází a nastavíme cestu například na **/logout**.

```html
<li><a href="/logout">Logout</a></li>
```

Nyní se přesuneme k úpravě na serveru. Jelikož se jedná o standardní odkaz, bude se jednat o požadavek s metodou GET. Vytvoříme si tedy endpoint, který bude tento požadavek zpracovávat.

```javascript
app.get('/logout', (req, res) => {
});
```

Samotné odhlášení je pak v principu snadné. Potřebujeme zrušit stávající session uživatele a přesměrovat jej ideálně na přihlašovací obrazovku. Vzhledem k použití knihovny Passport můžeme jednoduše zavolat funkci req.logOut() a uživatel bude pro systém odhlášen. Přesměrování na přihlašovací obrazovku pak provedeme pomocí funkce res.redirect() a máme hotovo.

```javascript
app.get('/logout', (req, res) => {
    req.logOut();
    return res.redirect('/login');
});
```
