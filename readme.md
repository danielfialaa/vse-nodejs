# Cvičení 4
V současné podobě naše aplikace umožňuje chatování, a to ve více místnostech, které si je schopen uživatel i vytvářet. Omezujícím prvkem je momentálně to, že nejsme schopni určit, kdo danou zprávu v místnosti odeslal (tedy pouze u příchozích zpráv, kde místo jména vidíme pouze „Someone“ a u námi odeslaných „You“). Nyní by tedy bylo vhodné naimplementovat do aplikace registraci a přihlašování uživatelů. K tomuto účelu využijeme knihovnu Passport, která je v Node.js jednou z nejpopulárnějších. Nejprve si vytvoříme klasické lokální přihlašování, tedy že budeme celý proces řídit my a v dalších částech přidáme přihlašování pomocí cizí služby, jako je například Facebook. Právě na takový případ použití, kdy chceme více možností přihlášení do aplikace, je knihovna Passport velmi nápomocný, jelikož s takovým použitím přímo počítá.

V repozitáři nám přibyly dva soubory stránek pro přihlášení a registrace. Tentokrát k nim není přiložen žádný soubor pro logiku na straně klienta, jelikož se jedná o prosté formuláře a prozatím si vystačíme pouze s tím. Tyto soubory si tedy nejprve stáhneme a vložíme do projektu, případně si naklonujeme tuto větev repozitáře.
## Registrace uživatele
Prvním krokem v implementaci přihlašování je umožnit uživatelům se do naší aplikace nejprve zaregistrovat. Nejprve budeme tedy potřebovat připravit cestu k registračnímu formuláři, který již máme vytvořený (register.ejs). Server nám jej může vracet například pod cestou „/register“. Vytvoříme si tedy tuto cestu, stejně jako již několikrát předtím.


```javascript
app.get("/register", (req,res) => {
    res.render('register.ejs');
});
```

Pokud se podíváme do souboru s naším registračním formulářem, můžeme vidět, že má v parametrech action="/register" method="POST". Po jeho odeslání tedy odešle vyplněné údaje na server pomocí metody POST na endpoint „/register“, ten si budeme musíme vytvořit. Nejdříve ale ovšem musíme upravit nastavení na našem serveru. Prohlížeč totiž neposílá data z formuláře formou, jakou je posíláme my například pomocí našeho FetchAPI. Do kódu našeho serveru tedy přidáme řádek níže, který nám umožní číst data z těchto formulářů stejným způsobme, jako jsme tomu dělali u ostatních endpointů doposud.

```javascript
app.use(express.urlencoded({ extended: false }));
```

Prakticky jediné, co tento řádek dělá, je, že říká naší aplikaci, že budeme chtít mít data odeslaná z formulářů přístupná standardně z parametru „req“ u našich endpointů.

Nyní, když se budeme moci dostat k příchozím datům cestou jakou jsme zvyklí (req.body), můžeme si tedy připravit endpoint pro registrační formulář na straně serveru. Do jeho těla si zatím můžeme jen vložit vypsání přijatých dat do konzole, abychom se ujistili, že tato část funguje tak jak potřebujeme.

```javascript
app.post('/register', (req,res) => {
    console.log(req.body);
});
```

Při odeslání registračního formuláře bychom tedy měli v konzoli serveru vidět vyplněná data (na stranu klienta neodesíláme žádnou odpověď, tudíž po chvíli dojde k chybě). Když máme k dispozici data, mohli bychom data o uživateli uložit, než ale dojde na samotné uložení, měli bychom zahashovat heslo, které uživatel vyplnil. Ukládání nezahashovaných uživatelských hesel je snad nejhorší chyba, které se můžeme při práci s takto citlivým daty dopustit. K tomuto použijeme knihovnu „bcrypt“, kterou si nejdříve budeme muset nainstalovat. Do konzole tedy zadáme následující.

```bash
npm i bcryptjs 
```

Potřebná knihovna se nám nyní nainstaluje a my si ji na serveru naimportujeme.

```javascript
const bcrypt = require('bcryptjs');
```

Nyní můžeme pokračovat v našem endpointu pro registraci uživatele. Nejprve změníme naši funkci na asynchroní. Toho dosáhneme tak, že před parametry „req,res“ přidáme „async“ a do těla funkce si vložíme try-catch blok. Do části „try“ budeme psát kód, který budeme chtít, aby se provedl. Pokud v této části dojde k nějaké chybě, místo aby program spadl, skočí do části „catch“ a vykoná, co bude v ní. 

```javascript
app.post('/register', async (req,res) => {
    try{
    }catch{
    }
});
```

Do těla „try“, vložíme kód pro zahashování uživatelského hesla. K tomu využije funkci bcryptu bcrypt.hash(). Této funkci předáme dva parametry. První bude heslo, které uživatel vyplnil (req.body.password) a druhý bude číslo, které určí, kolikrát má funkce vygenerovat hash. Vzhledem k tomu, že se jedná o asynchroní funkci, ale pro nás je výstup funkce zásadní, než budeme pokračovat (ukládat data), musíme před funkci přidat „await“. To zajistí, že program počká, než se funkce dokončí, než bude pokračovat dále. Kdybychom tohle neudělali, program by hashovací funkci provedl asynchroně, takže by se pravděpodobně nestihla dokončit, před uložením dat a hash bychom tak nemohli uložit. Jelikož funkce vrací zahashované heslo, uložíme si tento výstup do proměnné, a nakonec uložíme všechny data o uživateli do naší dočasné proměnné (tu si nezapomeneme vytvořit, bude prakticky stejná jako ta pro místnosti, jen ji nazveme například „users“), která nám prozatím nahrazuje databázi (stejně jako u chatovacích místností).

```javascript
app.post('/register', async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 5);
        users.push({
            name: req.body.name,
            password: hashedPassword
        });
    }catch{
    }
});
```

Na závěr úspěšné registrace budeme ještě chtít uživatele přesměrovat na stránku s přihlášením. Za kód, kde vkládáme uživatele do naší proměnné „users“, tedy přidáme.

```javascript
res.redirect('/login');
```

Pokud dojde k nějaké chybě, můžeme uživatele prozatím přesměrovat na registraci (takže mu prakticky obnovit stránku). Do „catch“ bloku tedy vložíme opět kód na přesměrování, který ale nyní bude směřovat na „/register“. Na úplný konec našeho endpointu (mimo try-catch blok) si můžeme vložit výpis všech uložených uživatelé do konzole, abychom měli přehled, že se vše vykonává, jak má.

```javascript
app.post('/register', async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 5);
        users.push({
            name: req.body.name,
            password: hashedPassword
        });
        res.redirect('/login');
    }catch{
        res.redirect('/register');
    }
    console.log(users);
});
```

Před vyzkoušením si ještě přidáme endpoint na metodu GET pro cestu „/login“, aby se nám při přesměrování po registraci vykreslila přihlašovací stránka.

```javascript
app.get("/login", (req,res) => {
    res.render('login.ejs');
});
```
Přihlašovací formulář samozřejmě prozatím nefunguje. Celou jeho logiku, respektive logiku pro ověření budeme řešit právě pomocí v úvodu zmíněné knihovny Passport.
