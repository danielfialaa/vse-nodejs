# Cvičení 5
V této části přímo navážeme na předchozí, kdy jsme vytvořili registraci uživatele. Nyní za pomoci knihovny Passport naimplementujeme samotné přihlášení. 
## Instalace Passport
Než začneme s jakoukoliv implementací, musíme si nainstalovat potřebné knihovny. Z npm repozitáře budeme potřebovat samotný Passport, ke kterému můžeme doinstalovat další velké množství podknihoven, které slouží k různým přihlašováním. Nyní se zaměřujeme na lokální přihlášení, přidáme tedy ještě knihovnu „Passport-local“. Dále, abychom byli schopní ukládat a udržovat informace o přihlášení uživatele (session), doinstalujeme si k našemu express serveru knihovnu „express-session“. Pro usnadnění si také doinstalujeme knihovnu „express-flash“, skrze kterou využívá i Passport a která nám umožní zobrazení potřebných informačních hlášek, ohledně přihlašování. Pro nainstalování všech těchto knihoven tedy do terminálu zadáme následující.

```bash
npm i passport passport-local express-session express-flash
```

## Implementace přihlášení
Jelikož se náš soubor s kódem serveru (server.js) pomalu stává nepřehledným, pro implementaci přihlášení na straně serveru si vytvoříme nový soubor „passport-config.js“, kde budeme mít všechnu potřebnou logiku pro přihlašování.

V tomto souboru si nejprve připravíme naši hlavní funkci, kterou můžeme pojmenovat „initPassport“. Této funkci dáme jeden parametr „passport“, jelikož jí budeme předávat naši knihovnu.

```javascript
function initPassport(passport){
}
```

Než budeme pokračovat, vrátíme se do souboru server.js, kde si naimportujeme knihovnu Passport, dále si naimportujeme právě vytvořenou funkci „initPassport“ a rovnou ji i zavoláme, kdy do parametru předáme naimportovanou knihovnu.

```javascript
const passport = require('passport');

const initPassport = require('./passport-config');
initPassport(passport);
```

Pokud se podíváme do konzole serveru, můžeme vidět, že se objevila chyba „initPassport is not a function“. Problém je, že importujeme funkci, kterou ale nejprve neexportujeme. Na konec souboru „passport-config.js“ tedy přidáme export této funkce.

```javascript
module.exports = initPassport;
```

Přesuneme se zpět do souboru „passport-config.js“. Zde si naimportujeme knihovnu „passport-local“, ze které budeme chtít část „Strategy“.

```javascript
const LocalStrategy = require('passport-local').Strategy;
```

V naší funkci „initPassport“ nyní přiřadíme tuto „LocalStrategy“, jako tu, kterou má Passport používat. Samotnou knihovnu zde máme přístupnou skrze parametr „passport“ a nyní ji pomocí passport.use() nastavíme, že chceme lokální přihlašování. Do parametru této funkce tedy vložíme vytvoření nové „LocalStrategy“.

```javascript
function initPassport(passport){
    passport.use(new LocalStrategy());
}
```

Nyní si musíme tuto strategii nakonfigurovat. Do parametrů naší strategie tedy vložíme JSON, ve kterém budeme muset učit, které pole je naše přihlašovací jméno a jakým způsobem označujeme heslo.

```javascript
passport.use(new LocalStrategy({usernameField: 'name', passwordField: 'password'}));
```
U nastavování LocalStrategy budeme ještě muset doplnit naši funkci, pro ověření uživatele. Nejprve si tedy předpřipravíme její tělo a následně ji přidáme jako druhý parametr. V této funkci budeme potřebovat tři parametry – přihlašovací jméno, heslo a „done“, což bude představovat funkci, kterou budeme volat jako funkci v momentě kdy dokončíme ověření uživatele. Tuto funkci si napíšeme jako tzv. arrow funkci. 

```javascript
const auth = (name, password, done) => {
}
passport.use(new LocalStrategy({usernameField: 'name', passwordField: 'password'}, auth));
```

Při předávání funkce, jako parametru jiné funkci („auth“ v new LocalStrategy()) si musíme dát pozor, abychom vynechali klasické závorky. Pokud bychom v parametrech uvedli funkci společně se závorkami, funkci bychom nepředávali dané funkci jako parametr, tedy že by ji mohla zavolat, ale rovnou by se při inicializaci zavolala.

Dále budeme potřebovat funkci, která nám serializuje uživatele, abychom ho mohli uložit do naší session. K tomu využijeme funkci dostupnou v knihovně Passport a to konkrétně passport.serializeUser(). Do parametru si vložíme arrow funkci o dvou parametrech – „user“ a „done“. To samé, akorát s „id“ místo „user“, uděláme pro passport.deserializeUser().

```javascript
passport.serializeUser((user, done) =>{
});
passport.deserializeUser((id, done) => {
});
```

Přesuneme se k naší funkci pro ověření uživatele. Zde z parametru získáme přihlašovací jméno a podle něj se pokusíme získat uživatele. Do proměnné si tedy budeme ukládat reprezentaci uživatele, kterou získáme z funkce, která ji bude vracet na základě přihlašovací jména. Tu jsme si zatím nevytvořili, ale předpokládejme, že bude vypadat následovně „getUserByName(name)“.  Tuto funkci si také předáme jako druhý parametr do funkce „initPassport“. Na základě hodnoty této proměnné si vytvoříme sadu podmínek, co má přihlašovací funkce provést, dle výsledku, který dostaneme při hledání uživatele. Pokud bude hodnota „null“, budeme chtít vrátit informaci, že uživatele neexistuje, pokud bude nalezen, pokusíme se ověřit heslo a pokud nebude platit, budeme chtít informovat o chybném přihlášení.

```javascript
if (user == null){
    //uživatel nenalezen
}
if(await bcrypt.compare(password, user.password)){
    //uživatel nalezen a heslo souhlasí
}else{
    //uživatel nalezen ale nesouhlasí heslo
}
```

Pro ověření hesla použijeme funkci z knihovny bcrypt compare(), která porovná zadané heslo (prví parametr) a uložené zahashované heslo, které máme uložené u uživatele na serveru. Pro použití bcryptu nesmíme zapomenou jej na začátku souboru naimportovat.

```javascript
const bcrypt = require('bcryptjs');
```

Řekli jsme si, že třetí parametr naší funkce pro ověření uživatele (done) je funkce, která bude informovat o tom, jak samotné ověření dopadlo. V každé možnosti podmínek tedy budeme volat tuto funkci (nesmíme zapomenout přidat return, jelikož potřebujeme, aby se v danou chvíli funkce ukončila). Ve funkci „done“ budeme potřebovat tři parametry. První bude reprezentovat chybu, jako druhý vrátíme nalezeného uživatele (pokud jej nenalezneme, nebo nedojde k úspěšnému ověření hesla, vrátíme „false“) a třetím parametr bude reprezentovat zprávu pro uživatele, kterou uvedeme jako JSON, kdy zprávu předáme pod klíčem „message“.

```javascript
function initPassport(passport, getUserByName){
    const auth = (name, password, done) => {
        const user = getUserByName(name);
        if (user == null){
            return done(null, false, { message: 'No user'} );
        }
        if(await bcrypt.compare(password, user.password)){
            return done(null, user);            
        }else{
            return done(null, false, { message: 'Wrong password'});
        }
    }
   . . .
```
Pokud se nyní podíváme do konzole serveru, uvidíme chybu „SyntaxError: Unexpected identifier“ v naší podmínce ve které ověřujeme heslo. Problém zde vyvolává „await“, který zde máme kvůli asynchronní funkci z bcryptu. Před výpisem možných parametrů u funkce „auth“ tedy připíšeme „async“, čímž definujeme, že se jedná o asynchronní funkci a budeme tak moci použít „await“. Celou tuto podmínku také opět vložíme do „try-catch“ bloku, respektive do „try“ a v části „catch“ přidáme další volání funkce „done“, kde předáme chybovou hlášku.

```javascript
const auth = async (name, password, done) => {
    const user = getUserByName(name);
    if (user == null){
        return done(null, false, { message: 'No user'} );
    }
    try {
        if(await bcrypt.compare(password, user.password)){
            return done(null, user);            
        }else{
            return done(null, false, { message: 'Wrong password'});
        }
    } catch (error) {
        return done(error);            
    }
}
```
Stále nám chybí naimplementovat funkci „getUserByName“, kterou chceme použít při ověřování uživatele. Momentálně očekáváme, že tuto funkci dostaneme z parametru funkce „initPassport“, přejdeme tedy do souboru „server.js“, kde tuto funkci voláme a zde, v jejích parametrech, můžeme nadefinovat arrow funkci, která se pokusí najít uživatele dle zadaného jména v proměnné, kde registrované uživatele uchováváme. Pro vyhledávání v naší proměnné použijeme funkci find().

```javascript
initPassport(passport, name => users.find(user => user.name === name));
```

Když máme nakonfigurovaný Passport, potřebujeme ještě serveru říct, jak jej má použít. Začneme tím, že si na serveru naimportujeme zbylé dvě knihovny, které jsme instalovali (express-session a express-flash). Také musíme nadefinovat, že je má server použít a to pomocí funkce app.use().

```javascript
const flash = require('express-flash');
const session = require('express-session');

app.use(flash());
app.use(session());
```

Knihovna pro session přijímá několik parametrů, respektive jako první parametr přijímá JSON, ve kterém si můžeme nadefinovat několik věcí. Jako první si nastavíme „secret“, jedná se o klíč, kterým se bude vše šifrovat. Ten bychom neměli správně mít přímo v kódu, ale uložený jako proměnnou serveru. Toto nyní přejdeme a nějaký klíč si nadefinujeme přímo zde. Další nastavíme „resave“ na false. Tato část definuje, pokud se má opakovaně ukládat session i pokud se nic nezměnilo. Jako poslední přidáme „saveUninitialized“, kde opět nastavíme false. Tímto jsme nastavili, že nechceme, aby se nastavovala prázdná session i bez přihlášení. Také musíme serveru nastavit (pomocí app.use()), aby používal dvě funkce z knihovny Passport a to konkrétně initialize(), což je vnitřní funkce knihovny, která nastaví některé potřebné prvky, a session(), která bude fungovat s naší dříve nastavenou session z knihovny „express-session“.

```javascript
app.use(flash());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
```

Nyní si připravíme endpoint, na který se budou odesílat vyplněná data z přihlašovacího formuláře. U něj máme nastaveno, že se má metodou POST odeslat na URL „/login“. Zde ovšem nepoužijeme standardní arrow funkci (res,req) => {}, ale přímo funkci z Passport authenticate(). Jako první parametr jí nastavíme „local“. V druhém parametru si nastavíme několik událostí, které se mají vykonat na základě výsledku přihlašování. V tomto případě nastavíme tedy, kam chceme klienta přesměrovat v případě úspěšného přihlášení, v případě neúspěšného přihlášení a také, že chceme zobrazovat naše zprávy, které jsme si nadefinovali ve funkci pro ověřování uživatele, konkrétně ve funkci done().

Pokud se nyní vyzkoušíme zaregistrovat (nesmíme zapomenout, že uživatele ukládáme v proměnné na serveru, která se při každém restartu vymaže), můžeme zkusit přihlášení. V případě chybně zadaných údajů nás server správně přesměruje na adresu „/login“. Pokud zadáme správné údaje, prohlížeč načítá, ovšem nakonec se nic nestane. V souboru „passport-config.js“ jsme totiž ještě nenaimplementovali funkce pro serializaci a deserializaci uživatele. 

Pro serializaci vložíme do arrow funkce pouze naši funkci done(), kde první parametr bude „null“, jelikož nevracíme chybu, a v druhém parametru vrátíme ID uživatele.

```javascript
passport.serializeUser((user, done) => done(null, user.id));
```

U deserializace vidíme, že v parametrech máme místo „user“ (oproti serializaci) k dispozici jen ID uživatele, přitom zde ale potřebujeme do funkce done() jako druhý parametr předat „celého“ uživatele. Budeme tedy potřebovat funkci pro získání uživatele na základě jeho ID. Tu si vytvoříme stejně jako jsme si vytvořili funkci pro získání uživatele podle jména. Budeme si ji tedy předávat do parametru naší funkce initPassport().

```javascript
function initPassport(passport, getUserByName, getUserById){
	. . .
	. . .
    passport.deserializeUser((id, done) => {
        done(null, getUserById(id));
    });
```

V souboru server.js, v místě kde voláme funkci initPassport() přidáme do parametru další arrow funkci, která bude velmi podobná té předchozí, kterou zde již máme. Prakticky jen nahradíme „name“ za „id“.

```javascript
initPassport(passport, 
    name => users.find(user => user.name === name),
    id => users.find(user => user.id === id)    
);
```
Pokud se nyní zaregistrujeme a pokusíme se přihlásit, měli bychom být přesměrování na seznam místností.
