# Drini Travel – Gjenerator Emailesh

Ndërtues ofertash për email (HTML/CSS/JS i thjeshtë) me backend në Vercel Functions + Neon Postgres
për ruajtjen e shablloneve. Live: https://drini-offers.vercel.app

## Struktura

```
index.html                     aplikacioni (forma, preview, kopjo / PDF / "Shiko si Email", shabllonet)
api/login.js, logout.js, me.js hyrja me fjalëkalim (cookie JWT, 30 ditë)
api/templates/index.js         GET lista (?q= kërkim), POST krijo
api/templates/[id]/index.js    GET një shabllon, PUT ndrysho, DELETE fshi
api/templates/[id]/duplicate.js POST dyfisho ("<emri> (kopje)")
api/upload.js                  ngarkon foton hero në Vercel Blob (JPEG/PNG/WEBP, maks. 5 MB)
api/_lib/                      ndihmës të përbashkët (nuk janë rrugë API)
db/schema.sql                  tabela `templates`
```

## Shabllonet: si funksionojnë

1. Plotëso ofertën si zakonisht.
2. **💾 Ruaj shabllonin**: jep një emër dhe oferta ruhet në databazë.
3. **📂 Shabllonet e ruajtura**: kërko, pastaj zgjidh:
   - **Hap**: e ngarkon për ndryshim. Butoni bëhet **Ruaj ndryshimet** dhe përditëson të njëjtin shabllon.
   - **Përdor si të re**: ngarkon përmbajtjen, por ruajtja krijon shabllon të ri
     (p.sh. oferta e vitit të kaluar me data/çmime të reja).
   - **Dupliko**, **Riemërto**, **Fshi**.
4. **+ E re** pastron formularin. Nëse ke ndryshime të paruajtura, aplikacioni të pyet më parë.

Pa hyrje, ndërtuesi punon si më parë (lokalisht). Ruajtja, shabllonet dhe ngarkimi i fotos hero
kërkojnë fjalëkalimin e stafit.

## 1. Krijo databazën Neon

1. Hyr në https://console.neon.tech dhe krijo një projekt të ri. Rajoni: *AWS US East 1 (N. Virginia)*,
   afër rajonit të paracaktuar të Vercel Functions (`iad1`).
   (Projekti ekziston tashmë: **drini-offers**, `shiny-night-81765731`.)
2. Hap **SQL Editor**, ngjit përmbajtjen e `db/schema.sql` dhe shtyp **Run**.
3. Te **Dashboard → Connect** kopjo *connection string*-un (`postgresql://...?sslmode=require`).
   Ky është `DATABASE_URL`.

> Alternativë: në Vercel → projekti → **Storage → Create Database → Neon**. Kjo e lidh databazën
> dhe e shton `DATABASE_URL` automatikisht. Pastaj ekzekuto `db/schema.sql` në Neon SQL Editor.

## 2. Krijo Vercel Blob store

1. Vercel → projekti **drini-offers** → **Storage → Create Database → Blob**.
2. Jepi një emër (p.sh. `drini-offers-images`), zgjidh qasje **Public** dhe lidhe me projektin
   (Production, Preview, Development).
3. Vercel shton automatikisht `BLOB_READ_WRITE_TOKEN`.

## 3. Variablat e mjedisit në Vercel

Vercel → projekti → **Settings → Environment Variables** (për Production, Preview dhe Development):

| Variabla | Vlera |
|---|---|
| `DATABASE_URL` | connection string nga Neon |
| `APP_PASSWORD` | fjalëkalimi i përbashkët i stafit |
| `SESSION_SECRET` | sekret i gjatë i rastësishëm, p.sh. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `BLOB_READ_WRITE_TOKEN` | shtohet automatikisht nga Blob store |

Pas ndryshimit të variablave bëj **Redeploy**. Ndryshimi i `SESSION_SECRET` nxjerr jashtë të gjithë
përdoruesit (duhet të hyjnë përsëri).

## 4. Nisja lokale

```bash
npm install
npm i -g vercel        # nëse nuk e ke
vercel link            # lidhe me projektin drini-offers
vercel env pull .env   # shkarkon variablat (ose kopjo .env.example -> .env dhe plotësoje)
vercel dev
```

Hap http://localhost:3000. Skedari `.env` nuk futet kurrë në git (është në `.gitignore`).

## Shënime

- Fotot hero ruhen si URL publike (Vercel Blob), jo base64, sepse Gmail/Outlook i bllokojnë fotot
  base64 në email. Fusha "Foto Hero (URL)" punon si më parë.
- Fotot e hoteleve dhe kartat për "Kopjo" ngarkohen ende në Cloudinary, si më parë.
- Kufiri i Vercel për trupin e kërkesës është ~4.5 MB. Prandaj aplikacioni e kompreson foton
  (1200px, JPEG) para ngarkimit.
- Pas 10 tentimeve të gabuara, hyrja bllokohet për 15 minuta. Çdo tentim i gabuar ka 1 sekondë vonesë.
