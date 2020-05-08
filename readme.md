# Cvičení 7
Aplikace v současném stavu obsahuje všechny funkce, kterými by měla základní chatovací aplikace disponovat. Stále sice zbývá napojení na databázi, které je mnohem vhodnější řešení než současné ukládání všech informací do proměnných, ovšem k tomuto se dostaneme až v další části, kdy budeme mít aplikaci nasazenou na serveru. Právě deploy na server, konkrétně Heroku, bude předmětem tohoto cvičení. Samotné Heroku bylo zvoleno, jelikož nabízí balíček zdarma bez nutnosti zadávat číslo platební karty, což by pro některé mohlo být nepřijatelné. Díky GitHub education (https://education.github.com/pack) také mají studenti možnost získat, mimo jiné, navýšený balíček zdarma na dva roky. Tento balíček není nutností a pro naše účely stačí i onen naprostý základ, který je omezený na jednu spuštěnou instanci, 550 celkových hodin v provozu za měsíc a také se server automaticky po 30 minutách bez jakéhokoliv příchozího requestu uspí, ale z takového stavu lze opět nastartovat například přístupem do aplikace.
## Deploy na Heroku
Po vytvoření účtu je čas nahrát a spustit nás kód. Pro samotný přenos kódu na Heroku využijeme GitHub, na kterém je tedy nutné si vytvořit repozitář a nahrát (ideálně do větve master) kód, který chceme na serveru spustit. Heroku sice nabízí i jiná řešení pro deploy aplikací, ovšem tento způsob nevyžaduje instalaci dalších programů a postačí nám pouze základní znalost gitu.

Poté, co se přihlásíme do Heroku, uvidíme seznam našich aplikací, který je nyní prázdný. Klikneme tedy na tlačítko „Create new app“ a do formuláře, který se nám objevil zadáme jméno naší aplikace. Toto jméno musí být unikátní a bude součástí URL adresy k naší aplikaci. Po potvrzení budeme přesměrováni do dashboardu aplikace, přímo na část pro deploy. Zde zvolíme GitHub a kliknutím na tlačítko „Connect to GitHub“ se nám objeví vyskakovací okno s přihlášením do GitHub. Po úspěšném přihlášení se objeví možnost vybraní konkrétního repozitáře. Zde stačí, když klikneme na tlačítko „Search“ a u příslušného repozitáře klikneme na „Connect“. Jakmile proběhne napojení vybraného repozitáře, můžeme nastavit automatické nasazování aplikace. To znamená, že kdykoliv commitneme do námi vybrané větve, Heroku automaticky aktualizuje kód i na serveru. Tento deploy ovšem proběhne až po příštím commitu a tak než abychom znovu commitovali, vybereme stejnou větev v sekci „Manual deploy“ a provedeme manuální deploy. Heroku nám dále zobrazí, zda veškeré fáze proběhly úspěšně a pokud ano, zobrazí tlačítko view, které nám otevře naší aplikaci (obrázek 1). 

![Ukázka nastaveného deploye na Heroku pomocí GitHubu](https://github.com/danielfialaa/vse-nodejs/blob/img/img/deploy.png)

Pokud se nyní ovšem pokusíme otevřít naši aplikaci, kterou jsme právě nasadili na server, zjistíme, že buď načítá, ale nic se nestane, případně se nám zobrazí chybová hláška. Problém je, že jsme aplikaci dosud nepřizpůsobili prostředí Heroku a také nám chybí vyžadovaný soubor zvaný „Procfile“, ve kterém Heroku řekneme, jaké příkazy provést, když se aplikace spouští (https://devcenter.heroku.com/articles/procfile). Nejedná se o žádné zásadní změny, spíše o často opomíjené chyby při vývoji pouze na lokálním stroji.

Nejprve si tedy v kořenovém adresáři naší aplikace vytvoříme soubor „Procfile“ (bez přípony). Jelikož se jedná o webovou aplikaci, která musí být přístupná i mimo Heroku, budeme nastavovat proces typu „web“ a zde nám bude stačit spouštět pomocí příkazu node, kterému předáme název naše hlavního souboru „server.js“. Tento konfigurační soubor je tak v našem případě velmi prostý a měl by obsahovat jen následující.

```bash
web: node server.js
```

První chyba, díky které se aplikace prakticky ani nespustí, je nastavení portu, na kterém běží. Při lokálním vývoji jsme si totiž nastavili, aby náš server běžel na portu 8000, ovšem Heroku nám nedovoluje si port, na kterém aplikace poběží, vybrat, ale aplikace jej dostane přidělený skrze takzvanou environmentální proměnou (https://codeburst.io/process-env-what-it-is-and-why-when-how-to-use-it-effectively-505d0b2831e7). Upravíme tedy kód tak, aby server naslouchal na portu, který mu bude touto proměnou přidělen. Abychom si ovšem tuto proměnou nemuseli nastavovat na svém stroji, když bychom aplikaci chtěli spustit na něm, přidáme podmínku, která použije proměnou s portem, pokud bude nastavená a v opačném případě použije port 8000 jako doposud. Pro přehlednost nebudeme toto psát přímo do funkce server.listen();, ale vytvoříme si nejprve konstantu a až tu až poté předáme této funkci.

```javascript
const PORT = process.env.PORT || 8000;
server.listen(PORT);
```

Druhou chybou, kterou musíme vyřešit než bude aplikace na Heroku fungovat je na straně kódu klienta. Na straně klienta, kde využíváme knihovnu socket.io, pro práci se sockety voláme funkci io(), která nám vše inicializuje. V parametru jí ovšem v obou případech předáváme adresu „localhost:8000“, což nejenže již po milé úpravě neplatí tento port, ale také již nechceme, aby aplikace běžela pouze lokálně. Mohli bychom přímo napsat adresu naší aplikace na Heroku, ale zase by nám přestala fungovat na našem stroji nebo případně na jiném serveru s jinou adresou. Využijeme tedy vlastnosti JavaScriptu, respektive jeho objektu „location“ (https://www.w3schools.com/js/js_window_location.asp), který uchovává informace o tom, jakou adresu má daná stránka atp. Z těchto vlastností použijeme informaci „host“. V souborech „chatroom.js“ a „index.js“ tedy změníme naši inicializaci na následovné.

```javascript
const socket = io(location.host);
```

Jelikož máme na Heroku nastavený automatický deploy po tom, co pushneme nový commit do naší produkční větve, zbývá tedy pouze nahrát do této větve (případně vhodněji nahrát do vývojové větve a z té provést merge na větev hlavní). Než ale uděláme tohle, je vhodné si otevřít logy, které najdeme v dashboardu naší aplikace. Zde můžeme vidět vše, co se serverem děje, a tedy i sledovat automatický deploy případně chyby, které by nastaly. Tyto logy najdeme v záložce „More“ v pravém horním rohu dashboardu, kde vybereme „View logs“. Po jejich otevření můžeme nahrát kód a na GitHub a počkat až se provede automatický deploy. 
