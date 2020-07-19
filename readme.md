# Cvičení 8
Nyní když máme připravený Redis server, můžeme začít s úpravou naší aplikace, aby data neukládala do proměnných jako doposud, ale právě na Redis. Jeho použití není příliš složité, ovšem poměrně se liší od klasických databází, se kterými jste se mohli setkat. Převážně funkce pro výběr dat z této databáze nefunguje klasickým způsobem, kterým byste pravděpodobně čekali, ale vše je řízeno [callbacky](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function). Kvůli tomuto budeme muset udělat několik úprav v tom, jak je funkčnost některých prvků napsaná. Nejedná se ovšem o příliš složitou záležitost. Je pouze nutné pochopit, co to vlastně callback je, jak funguje a poté jsou již úpravy snadné. Nejnáročnější úprava bude u uživatelských účtů. Tu si ovšem necháme nakonec a nejprve si Redis do aplikace napojíme a začneme od jednodušších, jako jsou názvy místností.

## Napojení aplikace na Redis
Než začneme s ukládáním dat na Redis, potřebujeme si k němu vytvořit připojení. K tomu si nejprve budeme muset nainstalovat potřebnou knihovnu.

```bash
npm i redis 
```

Tu si následně na serveru inicializujeme, společně s proměnou, kde budeme uchovávat připojeného klienta, pro komunikaci s Redisem.

```javascript
const redis = require("redis");
let redisClient;
```

Vzhledem k tomu, že v předešlé lekci jsme mohli zvolit ze dvou možností, kde budeme Redis provozovat, napíšeme si nastavení klienta tak, aby respektoval obě možnosti. Jak bylo řečeno, z Heroku získáme informace o Redis databázi skrze enviromentální proměnnou. Pokud tedy zjistíme, že taková proměnná je nastavená, připojíme klienta skrze ni. V opačném případě budeme počítat s tím, že je Redis provozován lokálně. Nastavení klienta se provádí pomocí redis.createClient(), kde pokud nepřidáme žádný parametr do funkce, počítá se, že je Redis na lokální adrese. Pokud spustíme aplikaci na Heroku, kde máme Redis, musíme do parametru předat proměnou process.env.REDIS_URL.

```javascript
if(process.env.REDIS_URL){
  console.log('Running on Heroku redis...');
  redisClient = redis.createClient(process.env.REDIS_URL);
}else{
  console.log('No env.REDIS_URL, redis on local');
  redisClient = redis.createClient(process.env.REDIS_URL);
}
```

Knihovna, kterou používáme, má událost pro chybu, pro kterou si nastavíme její vypsání do konzole a případně následné ukončení celé aplikace. Při chybném napojení by totiž aplikace nespadla, ale v momentě, kdy bychom se snažili Redis použít, začali by se objevovat chyby. Událost si tedy odchytíme a provedeme zmíněné operace. 

```javascript
redisClient.on('error', (err) => {
  console.log(err);
  process.exit(1);
});
```

## Ukládání místností
Naše operace s místnostmi jsou poměrně snadné. V podstatě místnosti pouze na jednom místě vytváříme, na dalším místě si vypisujeme seznam místností a při přechodu mezi místnostmi ověřujeme, zda taková místnost skutečně existuje.

Pro vytvoření záznamu použijeme funkci [„SADD“](https://redis.io/commands/sadd), která nám zjednodušeně vytváří pod klíčem pole unikátních hodnot. Pokud by již hodnota existovala, prostě se vložení ignoruje. V našem endpointu, kde dochází k vytváření místností tedy nahradíme vkládání názvu místnosti do pole, za zavolání zmíněné funkce skrze našeho klienta pro Redis. Do parametru si dále nejprve vložíme klíč k naší položce, která bude uchovávat seznam místností a dále příchozí název místnosti.

```javascript
// rooms.push(req.body.room);
redisClient.sadd('rooms', req.body.room);
```

Nyní můžeme vyzkoušet aplikaci spustit a pokusit se vytvořit místnost. Stále se nám nezobrazí, ovšem můžeme přejít na náš Redis a zjistit, zda se daný záznam vytvořil. U Heroku ve webovém rozhraní, které bylo zmíněno v minulé lekci. V případě lokálního Redis serveru v něm můžeme zadat příkaz [„SMEMBERS“](https://redis.io/commands/smembers), který slouží k vypsání obsahu právě takovýchto položek.

Názvy příkazů přímo odpovídají názvům funkcí použitelných skrze našeho Redis klienta. Funkci, kterou jsme tedy právě použili po ověření, zda se nám záznam uložil použijeme u endpointu, který uživateli odesílal seznam dostupných místností, které se následně zobrazí v nabídkovém seznamu. Zde se poprvé setkáme s vracením hodnot z Redis serveru do aplikace a dost možná narazíme na první problém. Tyto funkce totiž nevrací hodnoty standardně, tak jak bychom čekali, a nemůžeme si je tak uložit tak jak bychom standardně čekali. Tedy, že zavoláme funkci, ta nám vrátí hodnotu a tu si buď rovnou vracíme dále nebo ji uložíme do proměnné. Namísto toho fungují tyto funkce asynchroně a hodnoty vrací skrze callback, což prakticky znamená, že do parametru volané funkce vložíme funkci jinou, která se zavolá v momentě, kdy nám server vrátí hodnotu, a právě v této funkci budeme mít danou hodnotu dostupnou. Odpověď na tento náš endpoint tedy bude muset být právě v této callback funkci, jinak by se odpověď poslala dříve, než by dotaz na databázi proběhl. Tyto callback funkce Redisu mají jako první parametr možnou zprávu o chybě a jako druhý dotazovanou hodnotu. Tělo našeho endpointu by tak mělo vypadat zhruba takto.

```javascript
// return res.send(rooms);
redisClient.smembers('rooms', (err, obj) => {
      return res.send(obj);
});
```

Jako další musíme vyřešit kontrolu, zda existuje místnost, která se provádí, pokud se uživatel snaží vstoupit do místnosti. Použijeme opět stejnou funkci, jakou jsme použili, když jsme potřebovali seznam místností a jelikož nám tyto místnosti přijdou v poli, tedy ve stejné podobě, v jaké jsme je uchovávali doposud, bude i kontrola totožná (pouze se bude vykonávat v callbacku).

```javascript
// if(rooms.indexOf(req.params.id) > -1){
//     res.render('chatroom.ejs', { room : req.params.id });
//     return;
// }
// return res.status(404).send('Room doesn´t exists');
redisClient.smembers('rooms', (err, rooms) => {
   if(rooms.indexOf(req.params.id) > -1){
      res.render('chatroom.ejs', { room : req.params.id });
      return;
   }
   return res.status(404).send('Room doesn´t exists');
});
```

## Píšící uživatelé
Dále přepíšeme ukládání píšících uživatelů, tak aby se tyto údaje ukládali do naší Redis databáze. V podstatě budeme používat identické funkce jako v případě místností, ovšem potřebujeme oddělit píšící uživatele v jednotlivých místnostech, takže použijeme název místnosti jako součást klíče k seznamu našich hodnot, respektive píšících uživatelů. Navíc také budeme nastavovat životnost. Redis umožňuje na hodnoty s klíčem nastavit [životnost](https://redis.io/commands/expire), tedy dobu, po které bude záznam vymazán.

Na straně serveru řešíme logiku píšících uživatelů při příchodu socketu „typing“. Nejprve si vytvoříme klíč pro píší uživatele v dané místnosti (například složením „typing:“ a název místnosti, ve které uživatel právě píše). Poté můžeme využít funkce expire(), která nám udá, za jakou dobu se záznamy odstraní. V prvním parametru ji předáme vytvořený klíč a v druhém parametru čas ve vteřinách. Máme zde také dostupnou hodnotu „typing“, která nám udává, zda uživatel píše nebo již psát přestal. Dle toho budeme podmínkou rozhodovat, zda budeme záznam o psaní do databáze přidávat pomocí sadd(), případně zda budeme záznam odebírat skrze srem(). Po těchto krocích opět využijeme funkce smemmbers(), v jejímž callbacku budeme seznam píšících uživatelů odesílat zpět na uživatele.

```javascript
let typingKey = 'typing:' + room;
redisClient.expire(typingKey, 60);
if(typing){
    redisClient.sadd(typingKey, socket.username);
}else{
    redisClient.srem(typingKey, socket.username);
}
redisClient.smembers(typingKey, (err, obj) => {
socket.to(room).broadcast.emit("users-typing", obj);
});
```

## Uživatelé
Ukládání registrovaných uživatelů je již poněkud komplikovanější, jelikož vše musíme napojit na námi využívanou knihovnu Passport. V této časti tedy bude nutné značně větší množství úprav než v případě předešlých, jelikož budeme muset spoustu funkčnosti přepsat do callbacků, tak aby vše fungovalo s Redis databází.

Nejprve se zaměříme na volání funkce initPassport(), kde v parametrech předáváme arrow funkce, která reprezentují nalezení uživatele skrze jméno, respektive pomocí ID. Toto budeme muset nahradit. Funkce si napíšeme zvlášť a pouze je v parametrech předáme. Nejprve si tedy upravme tuto inicializaci Passportu.

```javascript
initPassport(passport, getUserByName, getUserById);
```

Nyní si tyto do parametrů přidané funkce budeme muset vytvořit. Bude se jednat z podstaty Redisu o asynchronní funkce, které se budou dotazovat Redisu na existenci uživatele. Obě tyto funkce budou mít dva parametry. První bude reprezentovat hodnotu, dle které se má uživatel vyhledávat, druhý bude reprezentovat callback, který se má zavolat, jakmile budeme mít výsledek. Řešení je to poměrně chaotické ale fungovat to bude následovně. Funkce, které nyní vytvoříme se předají při vytváření do Passportu. Ten si je při ověřování zavolá a předá jim současně také callback funkci, kterou potřebuje, aby se vykonala, jakmile bude získaná hodnota. Vzhledem k tomu, jakým stylem jsou hodnoty v Redisu ukládané, již nebudeme používat generované ID uživatele, ale jako klíč nám poslouží „user:“, za které doplníme jméno uživatele. V případě hledání skrze ID se tedy budeme dotazovat našeho Redis serveru pomocí funkce [hgetall()](https://redis.io/commands/hgetall). V callbacku volání Redis serveru ověříme, zda nám byli vráceny nějaké informace o uživateli a případně je vrátíme (jelikož námi používané ID u uživatele je klíč v Redis databázi, budeme jej ještě do záznamu muset před vrácením přidat, jelikož není součástí odpovědi z databáze).

```javascript
async function getUserById(id, callback){
  await redisClient.hgetall(id, (err, obj) => {
    if(!obj) return callback(null);
    obj.id = id;
    return callback(obj);
  });
}
```

Vzhledem k tomu, že jméno uživatele a ID uživatele se liší pouze v prefixu „user:“, tak nám při hledání skrze jméno uživatele stačí tento prefix přidat a zavolat funkci pro vyhledání skrze ID.

Nyní přejdeme na úpravy v konfiguraci Passportu (passport-config.js). Zde voláme výše přepisované funkce, které ale nyní očekávají v parametru nejen hodnotu, dle které mají volat, ale také callback, tedy funkci, kterou mají vykonat. V podobě, v jaké máme kód Passportu napsán teď vlastně nejprve voláme funkci, danou hodnotu si uložíme do proměnné a dále s ní pracujeme. V logice samotné změny v podstatě dělat nemusíme, ale je nutné tuto logiku, která doteď pracovala s proměnnou, přeměnit na callback. Toho dosáhneme, pokud změněným funkcím přidáme do parametru arrow funkci, která bude mít v těle zmíněnou logiku. Musíme tedy kód změnit z následujícího.

```javascript
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
```

Na kód následující, který je předělaný na callback.

```javascript
const user = getUserByName(name, async(user) => {
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
});
```

Jak je názorně vidět, do parametru na začátku volané funkce se vložila arrow funkce, která obsahuje shodně pojmenovanou proměnnou, se kterou jsme dříve pracovali. Do arrow funkce jen přesuneme dříve použitou logiku a máme předěláno na callback funkci.

Dále musíme upravit druhou funkci, kterou zde dostáváme v parametru a sice funkci getUserById(). Tu používáme u deserializace uživatele. Zde musíme prakticky pouze otočit logiku. Nyní voláme funkci done(), které v prvním parametru předáme nulovou hodnotu a v druhém parametru hodnotu z funkce pro nalezení uživatele skrze ID. Nyní k tomuto musíme přejít opačně. Nejprve si zavoláme o uživatele pomocí jeho ID a při volání právě díky callbacku určíme, co se má s hodnotou stát, jakmile ji dostaneme. Předělání této logiky by mělo vypadat nějak takto.

```javascript
getUserById(id, (user) => {
    done(null, user);
});
```

Nyní máme předěláno přihlášení uživatele skrze Passport. Dále musíme upravit samotnou registraci. Musíme tedy nahradit dosavadní ukládání uživatele do proměnné za uložení do Redis databáze. K tomuto použijeme funkci [hmset()](https://redis.io/commands/hmset), kde jako první parametr předáme ID uživatele (složenina z „user:“ a jména uživatele), respektive klíč k záznamu v databázi. Jako druhý parametr vložíme pole, ve kterém se střídají klíč a hodnota. To znamená, že jako první položku vložíme „name“, další bude přijaté jméno z registrace, následuje „password“ a konečně a zahashované heslo. Jako třetí parametr si můžeme přidat callback, který pokud nastane chyba, přesměruje uživatele opět na stránku registrací.

```javascript
redisClient.hmset('user:' + req.body.name, 
 ['name', req.body.name, 'password', hashedPassword],
 (err, reply) => {
    if(err){
        return res.redirect('/register');
    }else{
        return res.redirect('/login');
    }
});
```

Přechod na ukládání do Redis databáze máme prakticky hotový, zbývá pouze změnit výběr jména uživatele, které rozesíláme v socketu, pokud se uživatel připojí do místnosti (socket „join“), respektive způsob, jakým přiřazujeme do socketu uživatelské jméno. Díky tomu, že máme spojený Passport a naše sockety, můžeme se dostat k ID uživatele z našeho socketu. Vzhledem k tomu, že ID uživatele je složené u prefixu a samotného jména, můžeme si z tohoto ID vyparsovat pouze jméno, a to k socketu nastavit.

```javascript
// socket.username = users.find(user => user.id === socket.handshake.session.passport.user).name;
socket.username = socket.handshake.session.passport.user.split(':')[1];
```

Přihlašování by již tedy mělo fungovat a data o uživatelích by se měla ukládat na náš Redis server. Pokud ovšem nepoužíváte lokální Redis server, s vysokou pravděpodobností narazíte při registraci uživatele na chybu „Error [ ERR_HTTP_HEADERS_SENT ]“. Jedná se o chybu v našem endpointu pro registraci. Tato chyba obecně nastává, pokud se snažíme odeslat více než jednu odpověď na stejný požadavek a obvykle se s ní setkáme u asynchronních funkcí. Pokud se podíváme na náš kód pro založení uživatele při registraci, při zamyšlení jak funguje náš Redis klient, tedy asynchronně a hodnoty vrací do callbacků, můžeme si všimnout, že zavoláme na našem klientu funkci hmset(). Ta je ovšem asynchronní a než nám databáze vrátí výsledek, server pokračuje ve vykonávání příkazů. Pokud není databáze „dostatečně rychlá“, pošle se uživateli odpověď s přesměrováním na stránku s přihlášením a uživatel tak dostal svou odpověď od serveru. Poté ovšem doběhne náš dotaz z databáze a kód se vrátí do callbacku naše volání u Redis klienta. Zde se ověří, zda se vyskytla nějaká chyba a dle výsledku uživateli odešle odpověď na přesměrování. Jedná se ovšem o druhou odpověď na tentýž dotaz, server vypíše chybu a ukončí se.

```javascript
app.post('/register', checkNotAuth, async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 5);
        redisClient.hmset('user:' + req.body.name, 
                ['name', req.body.name, 'password', hashedPassword],
                (err, reply) => {
                    if(err){
                        return res.redirect('/register');
                    }else{
                        return res.redirect('/login');
                    }
        });
        res.redirect('/login');
    }catch{
        res.redirect('/register');
    }
});
```

V našem případě se ale nejedná o žádnou složitou chybu, jelikož přesně víme, v jakém místě se odesílá nadbytečná odpověď. Stačí tedy odstranit řádek s přesměrováním na přihlašovací stránku, který není v těle zmíněného callbacku a je hotovo.
