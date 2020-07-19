# Cvičení 3
Z minulé lekce máme dostupný seznam místností a jsme schopni si vytvářet nové. Nyní je potřeba ovšem vytvořit odkazy na ně, jelikož momentálně vedou na stránku s chybovou hláškou. Cestu k místnostem použijeme již tu, která se nám vytváří tedy „adresawebu/room/nazev místnosti“. Po přístupu na tuto adresu budeme tedy chtít vykreslit chatovací okno, které jsme si vytvořili v lekci první, zobrazit o jakou místnost se jedná a zajistit, aby zprávy z jedné místnosti nechodili uživatelům v místnosti jiné.
## Zobrazení místnosti a jejího názvu
Abychom se do místnosti vůbec dostali, potřebujeme si upravit náš endpoint na serveru, který se o tuto operaci stará. Z minulé lekce jsme náš chat dočasně přesměrovali na adresu „/chat“, ale nyní chceme cestu „/room/“, kdy za posledním lomítkem se bude nacházet název místnosti, kterou chceme zobrazit. Nebudeme ovšem vytvářet endpoint pro každou místnost zvlášť, ale přidáme do našeho endpointu parametr. Pro toto stačí na konec cesty přidat dvojtečku a název našeho parametru. Pokud tedy změníme naši cestu, tak jak jsme si nadefinovali a přidáme parametr, například id, měla by momentálně vypadat asi takto.

```javascript
app.get("/room/:id", (req,res) => {
    res.render('chatroom.ejs');
});
```

Všechny příchozí parametry jsou pak dostupné skrze položku „params“ našeho příchozího objektu (req). Pokud bychom tedy chtěli dostat náš parametr „id“, stačí nám k tomu jednoduše req.params.id. V tuto chvíli se již ze seznamu dostaneme do místnosti, ovšem stále nedokážeme jinak než z adresy odlišit, o jakou místnost se jedná, a i chatování funguje napříč místnostmi. Nejprve si tedy pojďme zobrazit název naší místnosti přímo v chatovacím okně. Možností, jak tohoto dosáhnout je spousta. Jelikož ale v naší aplikaci používáme Node.JS šablony s příponou „.ejs“, můžeme si přímo ze serveru při renderování stránky odeslat hodnoty do této šablony. Ze strany serveru to pro nás znamená přidat do naší renderovací funkce další parametr, kterým bude objekt, jehož součástí budou naše hodnoty, které budeme chtít zobrazit (v našem případě název místnosti, který jsme získali z parametru).

```javascript
app.get("/room/:id", (req,res) => {
    res.render('chatroom.ejs', { room : req.params.id });
});
```

Nyní se nám tedy odesílá hodnota „room“ při vykreslování do stránky „chatroom.ejs“. V té nám již nezbývá nic jiného než ji zobrazit. Takto získané hodnoty jsme schopni vykreslit pomocí <%=nazev_hodnoty%>. Nahradíme tedy náš prozatímní nadpis „Chat“, za proměnou přicházející ze serveru.

```javascript
<h1> <%= room %></h1>
```

Ještě bychom měli ošetřit, aby se uživatelé nepřipojovali do neexistující místnosti, protože nyní pokud by upravili URL adresu, tak, že by za „/room/“ napsali libovolný název, aplikace by skutečně místnost zobrazila a po dokončení lekce by dokonce i normálně fungovala. My ale chceme, aby uživatelé přistupovali jen do vytvořených místností. Před vykreslením tedy ověříme, jestli příchozí parametr, který obsahuje název místnosti, odpovídá nějaké místnosti v naší proměnné, ve které je uchováváme. Jelikož se jedná o pole a snažíme se pouze zjistit zda obsahuje daný řetězec (název místnosti), můžeme použít funkci .indexOf(), kterou aplikujeme na naše pole a do parametru zadáme hledanou hodnotu. Pokud hodnota nebude nalezena, návratová hodnota bude -1. V takovém případě budeme chtít vrátit informaci o neexistující místnosti.

```javascript
app.get("/room/:id", (req,res) => {
    if(rooms.indexOf(req.params.id) > -1){
        res.render('chatroom.ejs', { room : req.params.id });
        return;
    }
    return res.status(404).send('Room doesn´t exists');
});
```

Uvnitř naší podmínky nesmíme zapomenout na „return“ (ten nemusí být na začátku řádku, ale může být již před res.render). Pokud by totiž místnost existovala, prošli bychom podmínkou, vrátili klientovi stránku a kvůli chybějícímu „return“, by se vykonávala funkce dál, a tedy by se server pokusil vrátit i informaci o neexistující místnosti. Na klientovi bychom nic nemuseli poznat, jelikož ten čeká na jednu odpověď, tedy by zaznamenal jen jednu stránku (jeden požadavek, jedna odpověď), ovšem na serveru bychom si mohli všimnout chybové hlášky, že se pokoušíme odeslat další odpověď na již vyřešený požadavek.

## Chatování v místnostech
V tuto chvíli zbývá vyřešit, aby se zprávy odeslané v dané místnosti zobrazili pouze uživatelům, kteří se v ní nachází. Budeme tedy muset rozlišit uživatele, respektive jejich sockety, do skupin, které v našem případě budou reprezentovat místnost, ve které se nachází. V jeden moment tedy bude možné být pouze v jedné místnosti.

Nejprve ze strany klienta informujeme při připojení server, konkrétně službu socket.io, do které místnosti jsme se právě připojili, abychom mohli zařadit náš socket. Dříve, než toto provedeme, musíme v našem souboru s logikou (chatroom.js) zjistit v jaké místnosti se nacházíme. Název si můžeme přečíst například z elementu „h1“, který jsme si vyplnili výše, nebo si pro jednoduchost vytáhneme název místnosti z naší adresy v prohlížeči, jelikož je v ní na konci obsažená.

```javascript
const room = window.location.pathname.split("/")[2];
```

Prakticky jsme si přímo z informací okna vyjmuli naši adresu, „pathname“ již reprezentuje informace za doménou prvního řádu (.cz, .com atp.). Pro nás to znamená, že dostaneme hodnotu například „/room/Mistnost“, ale pro nás je důležitá jen ono „Mistnost“, proto použijeme funkci split(), která nám tento řetězec rozdělí a vezmeme si ten na druhém indexu. Nyní tedy zbývá tento údaj odeslat z klienta na server. Opět použijeme socket.emit, jako první parametr můžeme zvolit „join“, jelikož se fakticky připojujeme do místnosti a jako druhý pak předáme náš název místnosti.

```javascript
socket.emit("join", room);
```

Toto by mohlo být ze strany klienta prakticky celé, jelikož socket na jeho straně nemá informace o tom, v jaké skupině se nachází ani nic podobného. Všechna tato logika se odehrává na straně serveru, který si skupiny hlídá sám a rozhoduje, kterým klientům je nutné zprávy rozeslat. Dokonce ani při odesílání zprávy není teoreticky nutné uvádět místnost, ale můžeme vše vyřešit na serveru. Jelikož je to ale komplikovanější, budeme uvádět naši současnou místnost společně s každou odeslanou zprávou z klienta. Prakticky to pro nás pouze znamená přidat naší proměnou „room“ jako další parametr do výrazu, který odesílá zprávy skrze sockety.

```javascript
socket.emit("send-chat-message", msgInput.value, room);
```

Nyní se tedy přesuneme na stranu serveru, kde budeme chtít odchytit před chvílí vytvořený požadavek „join“ ze strany klienta. Jelikož se jedná o požadavek skrze sockety, budeme pracovat uvnitř jejich logiky, která prozatím vypadá nějak takto.

```javascript
io.on("connection", (socket) => {
    console.log('Somebody just connected');
    socket.on("send-chat-message", (msg) => {
        socket.broadcast.emit('chat-message', msg);
    });
    // Zde odchytáváme události ohleděn socketů
});
```

Potřebujeme tedy pomocí socket.on() odchytit náš požadavek a přiřadit socketu skupinu. K zařazení do skupiny slouží join(), kde v prvním parametru uvedeme název skupiny a ve druhém můžeme mít callback, tedy funkci, která se má po vykonání zavolat (zde si můžeme například vypsat do serverové konzole informaci, že se někdo připojil do dané místnosti).

```javascript
socket.on("join", (room) => {
    socket.join(room, e => {
        ("Someone joined room " + room);
    });
});
```

Tímto máme zařazeného uživatele do skupiny po tom, co se připojí do místnosti. Musíme ovšem ještě upravit naše rozesílání zpráv, konkrétně část kódu socket.on("send-chat-message", jelikož socket.broadcast.emit() rozesílá informace všem klientům. Vzhledem k tomu, že socket.io nativně podporuje místnosti, samozřejmě podporuje i rozesílání pouze na konkrétní místnost, takže tato část je velmi snadná a rychlá úprava. Rozeslání na skupinu omezíme pomocí .to(), které vložíme před „broadcast“ a do parametru vložíme název skupiny, který nám přišel od klienta.

```javascript
socket.on("send-chat-message", (msg, room) => {
   socket.to(room).broadcast.emit("chat-message", msg);
});
```
