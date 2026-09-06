# The Jolly Gym — Handleiding voor Jolmer

Dit is alles wat je moet weten om de The Jolly Gym app zelf te onderhouden, fixen en verbeteren. Lees het één keer door en houd het bij de hand.

Casper heeft deze app gebouwd met Claude Code. Jij onderhoudt en verbetert hem op dezelfde manier. Je hoeft de code niet te begrijpen — maar je moet wel weten hoe je effectief met Claude werkt. Daar gaat deze handleiding over.

---

## De Enige Regel

**Deploy nooit door ergens op een knop te klikken. Deploy altijd via Claude.**

Als je tevreden bent met een wijziging, zeg je tegen Claude: **"Push dit naar productie."** Claude regelt de git commit en push. Vercel pikt het automatisch op, bouwt de app en deployt naar jollygym.nl. Houd vercel.com open in een tab zodat je kunt meekijken en problemen vroeg opmerkt.

Klik nooit op een deploy-knop in Vercel of Convex. Voer nooit zelf deploy-commando's uit. Laat Claude het afhandelen.

---

## Een Werksessie Starten

Elke sessie, zonder uitzondering:

1. Open Terminal
2. Voer uit: `cd ~/Documents/the-jolly-gym && claude`
3. Zeg tegen Claude: **"Lees CHANGES.md en CLAUDE.md en vertel me wat er open staat"** of **"Plak hier de starting message van de vorige sessie"**

Claude leest beide bestanden en weet precies waar alles staat. Deze ene gewoonte voorkomt 90% van de verwarring.

---

## Een Werksessie Afsluiten

Schrijf aan het einde van je sessie: **"Sluit de sessie af"**. Claude doorloopt dan automatisch deze stappen:

1. **Testen** — Controleert of localhost draait en of er fouten zijn
2. **Commit & push** — Maakt een git commit van alle wijzigingen en pusht naar GitHub (Vercel deployt automatisch)
3. **Localhost stoppen** — Stopt de lokale dev servers netjes
4. **CHANGES.md updaten** — Markeert afgeronde items als `[x]`, voegt een sessie-logregel toe
5. **Starting message** — Schrijft een bericht dat je kunt gebruiken om de volgende sessie te starten

Je hoeft alleen "sluit de sessie af" te zeggen — Claude doet de rest. Als er niks te committen of te pushen valt, slaat Claude die stap over.

Bij grotere features kun je optioneel ook `/code-review` en `/qa-agent` laten draaien voordat je afsluit.

---

## Hoe Je Met Claude Werkt

### De mindset

Jij bent de Engineering Lead. Claude is je developer. Jij neemt beslissingen, Claude schrijft de code. Je hoeft niet te snappen wat de code doet — maar je moet wel bijhouden *wat* Claude doet en *waarom*.

De grootste fout die Casper maakte was niet zorgen dat ze op één lijn zaten voordat Claude begon met bouwen. Maak die fout niet. Voordat Claude één regel code schrijft, zorg dat jullie het eens zijn over wat er gebouwd wordt.

### Voordat Claude begint aan een feature of fix

Stel altijd deze vragen voordat je "ga maar" zegt:

- "Wat ga je doen, stap voor stap?"
- "Welke bestanden ga je aanpassen?"
- "Heeft dit gevolgen voor andere delen van de app?"
- "Kan er iets misgaan?"

Als het plan logisch klinkt, zeg go. Als iets onduidelijk is, vraag opnieuw. Dit kost 2 minuten en bespaart uren ronddraaien.

### De starting message

Vraag aan het einde van elke sessie aan Claude:

> "Schrijf een starting message voor de volgende sessie die een nieuwe Claude volledig context geeft over wat we bouwen, wat we net gedaan hebben, en wat hierna komt."

Kopieer dat bericht. Gebruik het om je volgende sessie te starten. Zo houd je Claude scherp tussen sessies — Claude onthoudt geen eerdere gesprekken, dus jij geeft het het geheugen.

### Houd sessies gefocust

Eén ding per sessie. Als je kwam om een bug te fixen, fix de bug — begin niet ook aan een nieuwe feature. Als je kwam om een feature te bouwen, maak hem af — laat Claude niet tussendoor andere dingen gaan refactoren. Claude stelt soms voor "nu we hier toch bezig zijn, kan ik ook..." — het is prima om nee te zeggen.

### Als je in cirkels draait

Dit gebeurt. Claude denkt dat het iets gefixt heeft, maar dat is niet zo. Dan probeert het opnieuw, en het werkt nog steeds niet. Signalen dat je in een loop zit:
- Claude zegt "dat zou nu gefixt moeten zijn" maar het probleem blijft
- Dezelfde error komt steeds terug
- Je bent al meer dan 30 minuten met hetzelfde bezig

Als dit gebeurt, **stop en begin opnieuw**. Zeg:

> "Laten we stoppen. Vergeet alles wat je geprobeerd hebt. Leg me in gewone taal uit wat volgens jou het probleem veroorzaakt en waarom. Stel dan een compleet andere aanpak voor."

Dit dwingt Claude om opnieuw na te denken in plaats van door te itereren op een kapotte fix. Als het daarna nog steeds niet lukt, probeer een nieuwe Claude-sessie met de starting message en beschrijf het probleem vanaf het begin.

### Modelkeuze maakt uit

Voor complexe dingen — auth, database-wijzigingen, grote nieuwe features — gebruik **Claude Opus** als je de optie hebt. Voor kleine UI-tweaks en bugfixes is Sonnet prima. De Clerk naar Convex Auth migratie duurde deels lang door modelkeuze. Als iets ingewikkeld en belangrijk is, gebruik het beste model dat beschikbaar is.

### Context window

Claude heeft een beperkt geheugen binnen één sessie. Als je ziet dat de context vol raakt (er is een indicator), start een nieuwe sessie met de starting message. Probeer niet meer in een bijna volle sessie te proppen — Claude begint fouten te maken als de context hoog is.

---

## Een Nieuwe Feature Bouwen

1. **Start de sessie** — lees CHANGES.md, vertel Claude wat je wilt bouwen
2. **Vraag eerst een plan** — "Beschrijf precies wat je gaat bouwen en hoe, voordat je code schrijft"
3. **Keur het plan goed** — zorg dat het overeenkomt met wat jij in gedachten had
4. **Bouw één ding tegelijk** — Claude bouwt het, jij test het lokaal
5. **Test het** — gebruik de feature daadwerkelijk op localhost:3000 voordat je pusht (zie Lokaal Testen hieronder)
6. **Push** — zeg tegen Claude "push dit naar productie", kijk op Vercel, check jollygym.nl

Push nooit iets dat je niet lokaal getest hebt.

---

## Een Bug Fixen

1. **Beschrijf de bug precies** — "Als ik X doe, gebeurt Y. Ik verwacht dat Z gebeurt."
2. **Vertel Claude waar** — welke pagina, welke knop, welke gebruikersrol (trainer of klant)
3. **Vraag eerst om de diagnose** — "Wat denk je dat dit veroorzaakt? Fix het nog niet, leg het alleen uit."
4. **Keur de fix goed** — "Heeft het fixen hiervan gevolgen voor iets anders?"
5. **Test het** — bevestig dat de bug weg is op localhost voordat je pusht (zie Lokaal Testen hieronder)
6. **Push** — zeg tegen Claude "push dit naar productie"

Als er iets kapot gaat in productie en je hebt een onmiddellijke fix nodig:
- Ga naar vercel.com → je project → Deployments → klik op de laatste werkende deployment → "Promote to Production"
- Dit draait de live app direct terug. Fix het daarna rustig op localhost en push opnieuw.

---

## De Codebase — Waar Je Voorzichtig Mee Moet Zijn

### Dingen die solide zijn — niet aanraken zonder reden
- De auth flow (`convex/auth.ts`, `convex/ResendOTP.ts`, `middleware.ts`) — het werkt en het is niet simpel. Niet aanpassen zonder specifieke reden.
- Het workout snapshot systeem — workouts worden bevroren op het moment dat ze aan een sessie worden toegewezen. Dit is bewust. Verander niet hoe dit werkt.
- Soft-deletes — er wordt nooit iets permanent verwijderd. `cancelled`, `archived` en `deleted` flags worden overal gebruikt. Houd dit patroon aan.

### Dingen die aandacht nodig hebben
- **Database schema** (`convex/schema.ts`) — vraag altijd aan Claude voordat je dit wijzigt. Een verkeerde schema-wijziging kan queries op bestaande data breken. Zeg tegen Claude: "Ik wil X toevoegen — is dit een schema-wijziging? Wat is het risico?"
- **De `userId` velden** — in de `attendance`, `workoutLogs`, `sessions` en `workouts` tabellen is `userId` opgeslagen als een plain string, niet als een typed ID. Dit was een bewuste keuze na een migratie. Verander deze niet naar `v.id("users")` zonder Claude de migratie goed te laten afhandelen.
- **Het `EnrichedSession` type** — dit TypeScript type is gedefinieerd in 5 verschillende bestanden. Als je een nieuw veld toevoegt aan een sessie-query, moet je mogelijk alle 5 updaten. Claude weet hiervan — zeg gewoon dat je een veld toevoegt en laat Claude het regelen.

### Twee Convex databases — verwar ze nooit
| Naam | Wat het is | Gebruikt door |
|---|---|---|
| `robust-hornet-740` | **PRODUCTIE** — echte klantdata | jollygym.nl (via Vercel) |
| `academic-cat-468` | **DEV** — test sandbox | alleen localhost:3000 |

De live app gebruikt altijd `robust-hornet-740`. Je lokale dev gebruikt `academic-cat-468`. Tegen Claude zeggen dat hij moet pushen is het enige veilige pad naar productie — Vercel is correct geconfigureerd en handelt dit automatisch af.

---

## Handige Claude Skills (Slash Commands)

Type deze in Claude Code om specifieke workflows te starten:

| Commando | Wanneer gebruiken |
|---|---|
| `/fix-errors` | Er is iets kapot en je wilt dat Claude het diagnosticeert en fixt |
| `/code-review` | Voor het pushen van een grote wijziging — laat Claude het checken |
| `/debug` | Als je vastloopt op een bug en een frisse aanpak nodig hebt |
| `/qa-agent` | Laat Claude de app testen en bugs vinden voordat je klanten dat doen |
| `/next` | Ga naar het volgende item op de todo-lijst |
| `/progress` | Bekijk waar je staat in de feature backlog |

---

## De Accounts Die Je Beheert

| Service | Wat het doet | Login |
|---|---|---|
| GitHub | Slaat de code op | github.com — JollySAms account |
| Vercel | Host en deployt de app | vercel.com |
| Convex | De database | convex.dev |
| Resend | Verstuurt login-code e-mails | resend.com |
| Hostnet | Het jollygym.nl domein | hostnet.nl |

Als een klant zegt dat ze geen logincode ontvangen, check **Resend → Emails** eerst. Daar zie je of de e-mail is afgeleverd of gebounced.

Als jollygym.nl ineens onbereikbaar is, check eerst Vercel (mislukte build?) en dan Hostnet (domein verlopen?).

---

## De Feature- & Buglijst

Alles wat gedaan moet worden staat in `CHANGES.md` in deze map. Open het aan het begin van elke sessie. Update het aan het einde. Het is de single source of truth voor wat af is en wat nog moet.

Huidige openstaande items (bijgewerkt 6 september 2026):

### Bugs
- **#23** — Aanwezigheid soms niet goed aangegeven
- **#25** — Verkeerd homescherm (klant ziet verkeerde training)

### Laatste MVP item
- **#9b** — Push notificaties (OneSignal + Convex crons)

### Feature changes
- **#3** — Exercise vervangen (huidige flow beoordelen)
- **#17** — Eerdere sessies zien in agenda
- **#19** — Lettertype groter (leesbaarheid boomers)
- **#20** — Bevestigingen positiever en gevarieerder
- **#21** — Progressie automatisch tonen (feedback Poelie — verduidelijken)
- **#22** — Homescherm uitbreiden (meer dan alleen agenda)

### Grotere features
- **#10** — Sessie-specifieke workout aanpassen
- **#11** — Workout dupliceren
- **#12** — Progressie graph
- **#13** — Achievements
- **#18** — Klant eigen workout starten

### Recent afgerond (6 sep 2026)
- **#1** — Drag-to-reorder exercises in workout builder (met @dnd-kit)
- **#4** — Workout toewijzen aan meerdere sessies tegelijk
- **#24** — Trainer login dev omgeving gefixt
- **#26** — RSVP capacity bug gefixt + duidelijke "Sessie is vol" melding
- Exercise rename (pencil icon in exercise picker)

---

## Als Je Twijfelt

Stel jezelf de vraag: **"Begrijp ik wat Claude gaat doen?"**

Zo niet — vraag Claude om het anders uit te leggen. Blijf vragen tot je het begrijpt. Het is prima om te zeggen "leg dit uit alsof ik nog nooit code heb gezien." Keur niks goed dat je niet begrijpt.

Als iets niet goed voelt — dan klopt het waarschijnlijk ook niet. Vertrouw dat gevoel. Zeg "dit voelt niet goed, laten we een stap terug doen" voordat Claude verder gaat.

Als Claude heel zelfverzekerd is maar iets werkt nog steeds niet — dat is de gevaarlijkste situatie. Claude kan zelfverzekerd fout zitten. Als een fix na twee pogingen niet werkt, stop en vraag om een compleet andere aanpak.

---

## Lokaal Testen

Voordat iets live gaat, test je het op je eigen machine. Dit is je vangnet — wijzigingen hier raken nooit echte klanten.

**De lokale app starten:**

Zeg tegen Claude: **"Start de lokale app"** — Claude start hem op de achtergrond.

Open dan je browser en ga naar **localhost:3000**. Je ziet de app lokaal draaien met testdata, volledig gescheiden van wat klanten zien.

Je kunt inloggen met:
- `jolmer@jolmer.com` — trainer account
- `jolmer.schukken@triplepartners.com` — klant account (om de klantweergave te testen)

**De lokale app stoppen als je klaar bent:**

Zeg tegen Claude: **"Stop de lokale app"** — Claude sluit hem netjes af.

Als je vergeet hem te stoppen, draait hij op de achtergrond maar veroorzaakt geen problemen. Hij stopt automatisch als je je Mac herstart.

---

## Snelreferentie

**Sessie starten:**
```
cd ~/Documents/the-jolly-gym && claude
```
Zeg dan: *"Lees CHANGES.md en CLAUDE.md en vertel me wat er open staat"*

**Lokaal testen starten:**
Zeg tegen Claude: *"Start de lokale app"* — open dan localhost:3000

**Lokaal testen stoppen:**
Zeg tegen Claude: *"Stop de lokale app"*

**Deployen naar productie:**
Zeg tegen Claude: *"Push dit naar productie"*

**Terugdraaien als iets kapot gaat:**
vercel.com → Deployments → klik op vorige werkende deploy → "Promote to Production"

---

*Gebouwd door Casper voor Jolmer — The Jolly Gym 2026*

## Open vragen

- **Control+E bij toestemmingsprompts** — Aanname van Casper: als de the-jolly-gym folder naar binnen de Claude Mastery Starter omgeving wordt verplaatst, kun je Control+E gebruiken voor uitleg bij toestemmingsprompts en de kosten per commando zien. Niet geverifieerd — met Casper afstemmen als dit gewenst is.
