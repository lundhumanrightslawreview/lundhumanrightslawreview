# Lund Human Rights Law Review

Plataforma web para que estudiantes del máster en derechos humanos de la **Universidad de Lund** publiquen sus artículos (PDF, nota AB, formato OSCOLA), con búsqueda, filtros por materia, *likes* y reportes por correo.

- **Frontend:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Lucide
- **Backend:** Supabase (Postgres + Auth + Storage) con RLS
- **Email:** Resend (opcional en desarrollo)

> **Interfaz en inglés.** Toda la capa visible (botones, menús, avisos, páginas de error y correos) está en inglés, como corresponde a Lund. Esta guía sigue en español para ti: los nombres de botones que se citan son los que verás en pantalla.

---

## Índice

1. [Qué hay en esta carpeta](#1-qué-hay-en-esta-carpeta)
2. [Requisitos](#2-requisitos)
3. [Paso 1 · Configurar Supabase](#3-paso-1--configurar-supabase)
4. [Paso 2 · Login con Google (solo @student.lu.se)](#4-paso-2--login-con-google)
5. [Paso 3 · Correos de reporte (Resend)](#5-paso-3--correos-de-reporte-resend)
6. [Paso 4 · Arrancar el proyecto](#6-paso-4--arrancar-el-proyecto)
7. [Paso 5 · Nombrar administrador](#7-paso-5--nombrar-administrador)
8. [Los archivos clave](#8-los-archivos-clave)
9. [Cómo funciona cada flujo](#9-cómo-funciona-cada-flujo)
10. [Publicar en internet (Vercel)](#10-publicar-en-internet-vercel)
11. [Modelo de seguridad](#11-modelo-de-seguridad)
12. [Problemas frecuentes](#12-problemas-frecuentes)
13. [Siguientes pasos](#13-siguientes-pasos)

---

## 1. Qué hay en esta carpeta

```
lund-law-review/
├── supabase/
│   ├── schema.sql          ← tablas, RLS, triggers, vista pública, permisos
│   └── storage.sql         ← bucket privado de PDFs + políticas
├── src/
│   ├── app/
│   │   ├── layout.tsx      ← HTML base, fuentes, Header + Footer
│   │   ├── globals.css     ← tema Tailwind (azul Lund + bronce)
│   │   ├── page.tsx        ← portada: destacados + catálogo + buscador
│   │   ├── actions.ts      ← borrado seguro de artículos
│   │   ├── articulos/[id]/page.tsx
│   │   ├── subir/page.tsx
│   │   ├── mis-articulos/page.tsx
│   │   ├── auth/{login,callback,actions}
│   │   └── api/reportes/route.ts
│   ├── components/         ← Header, ArticleCard, UploadForm, PdfViewer…
│   └── lib/                ← clientes Supabase, auth, categorías, email
├── middleware.ts           ← refresco de sesión + rutas privadas
├── .env.example
├── package.json
└── README.md
```

---

## 2. Requisitos

| Necesitas | Detalle |
|---|---|
| **Node.js 20 o 22 LTS** | [nodejs.org](https://nodejs.org). Evita versiones recién publicadas: Next 15 rinde mejor en LTS. |
| **Cuenta Supabase** | Gratis en [supabase.com](https://supabase.com). |
| **Cuenta Google Cloud** | Para el OAuth (gratis; no hace falta tarjeta). |
| **Resend** (opcional) | Solo para los correos de reporte. Sin esto, los reportes se guardan igual. |

Todo lo demás (`npm install`) se instala solo.

---

## 3. Paso 1 · Configurar Supabase

### 3.1 Crear el proyecto

1. Entra en [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Nombre: `lund-law-review`. Contraseña de base de datos: genera una y **guárdala**.
3. Región: **West EU (Ireland)** o **Central EU (Frankfurt)** (RGPD + latencia).
4. Espera ~2 minutos a que termine de aprovisionarse.

### 3.2 Crear las tablas y las políticas

1. En el menú lateral: **SQL Editor** → **New query**.
2. Abre `supabase/schema.sql`, copia **todo** el contenido y pégalo.
3. Pulsa **Run** (o `Ctrl+Enter`). Debe terminar con `Success`.

Ese archivo crea, en orden:

- Tipos y helpers (`is_allowed_email`, `is_admin`, `touch_updated_at`).
- Tablas `profiles`, `articles`, `article_likes`, `article_reports`.
- Trigger que crea el perfil al registrarse **y rechaza cualquier email que no sea `@student.lu.se`**.
- Triggers que mantienen `like_count` y `report_count` sincronizados.
- Vista `articles_public` (la única superficie de lectura del catálogo).
- Función `random_public_articles(limit)` para los destacados aleatorios.
- **RLS** (Row Level Security) y permisos por columna.

> Es idempotente: si algo falla, corriges y vuelves a ejecutarlo entero sin romper nada.

### 3.3 Crear el bucket de PDFs

1. SQL Editor → **New query**.
2. Pega el contenido de `supabase/storage.sql` → **Run**.

Esto crea un bucket **privado** llamado `articles`, con límite de 10 MB y solo `application/pdf`. Cada usuario sube a `articles/<su-user-id>/<uuid>.pdf` y nadie puede leer un PDF sin una URL firmada generada en el servidor.

### 3.4 Copiar las claves

**Project Settings → API** (o **API Keys**):

| Dato | Variable de entorno | ¿Pública? |
|---|---|---|
| Project URL (`https://xxxx.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` | Sí |
| `anon` / `publishable` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí (protegida por RLS) |
| `service_role` / `secret` key | `SUPABASE_SERVICE_ROLE_KEY` | **NO. Solo servidor.** |

> Si tu proyecto usa el formato nuevo (`sb_publishable_…` / `sb_secret_…`), úsalos en las mismas variables: funcionan igual.

---

## 4. Paso 2 · Login con Google

### 4.1 Crear las credenciales en Google Cloud

1. Entra en [console.cloud.google.com](https://console.cloud.google.com) → selector de proyecto → **New project** → nombre `Lund Law Review` → **Create**.
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → **Create**.
   - App name: `Lund Human Rights Law Review`; correo de soporte y de contacto: el tuyo.
   - **Save and continue** en el resto de pantallas (no necesitas scopes especiales: `email` y `profile` son básicos).
   - Deja la app en modo **Testing** mientras desarrollas. Para que cualquiera entre, pulsa **Publish app**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Supabase Auth`.
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://TU-DOMINIO.com
     ```
   - **Authorized redirect URIs** (¡exacta, sin barra final!):
     ```
     https://TU-PROYECTO.supabase.co/auth/v1/callback
     ```
     `TU-PROYECTO` es la referencia que aparece en la URL de tu panel de Supabase.
4. **Create** → copia **Client ID** y **Client secret**.

### 4.2 Activar el proveedor en Supabase

1. Supabase → **Authentication → Sign In / Providers → Google**.
2. Actívalo y pega Client ID + Client secret → **Save**.

### 4.3 Configurar las URLs de retorno

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (en producción, tu dominio).
- **Redirect URLs** (añade las tres):
  ```
  http://localhost:3000/auth/callback
  https://TU-DOMINIO.com/auth/callback
  http://localhost:3000/**
  ```

> `http://localhost:3000/**` facilita las pruebas; quítalo en producción si quieres máximo rigor.

### 4.4 Cómo se fuerza el dominio `@student.lu.se`

Hay **tres capas**, porque el filtro del navegador nunca es suficiente:

1. **Pista en el OAuth:** al iniciar sesión se envía `hd=student.lu.se`, así que Google solo ofrece cuentas de ese Workspace.
2. **Callback (`src/app/auth/callback/route.ts`):** tras el login se valida el email; si no acaba en `@student.lu.se`, se cierra la sesión y se vuelve a la portada.
3. **Base de datos (`handle_new_user` en `schema.sql`):** el trigger lanza una excepción si el email no pertenece al dominio. Aunque alguien manipulase el frontend, **no se crea el perfil** y no puede publicar ni dar likes.

---

## 5. Paso 3 · Correos de reporte (Resend)

Sin esta parte la app funciona: los reportes se guardan en `article_reports` y el administrador los ve en la página del artículo. Solo no se envían los avisos.

1. Crea una cuenta en [resend.com](https://resend.com) → **API Keys → Create** → copia la clave (`re_…`).
2. **Domains → Add domain**: añade tu dominio y configura los registros DNS (SPF/DKIM) que te indique. Sin dominio verificado solo puedes enviar desde `onboarding@resend.dev` y únicamente a tu propio correo (suficiente para probar).
3. Rellena en `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxx
   EMAIL_FROM="Lund Human Rights Law Review <no-reply@tudominio.com>"
   ADMIN_EMAIL=tu-correo@student.lu.se
   ```

Cada reporte dispara **dos correos** (autor + copia al administrador) con el motivo, los detalles, el contacto del reporter y un enlace al artículo. El artículo **no** se borra solo: la decisión es humana.

---

## 6. Paso 4 · Arrancar el proyecto

### 6.1 (Referencia) crear un Next.js desde cero

El proyecto **ya está creado** en esta carpeta. Este comando solo te sirve si algún día quieres empezar de cero y copiar los archivos encima:

```bash
npx create-next-app@15 lund-law-review --ts --tailwind --app --src-dir --import-alias "@/*"
```

> `create-next-app@15` ya instala **Tailwind v4**, que es lo que usa este proyecto (`@import "tailwindcss"` + bloque `@theme` en `src/app/globals.css`).

### 6.2 Instalar dependencias

Desde la carpeta `lund-law-review`:

```bash
npm install
```

> Si ves una carpeta `node_modules` de un intento anterior, bórrala antes (`rm -rf node_modules` en macOS/Linux, `rmdir /s /q node_modules` en Windows) para evitar restos.

### 6.3 Crear `.env.local`

Copia el ejemplo y rellena los valores:

```bash
cp .env.example .env.local      # Windows: copy .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_SITE_URL=http://localhost:3000

RESEND_API_KEY=
EMAIL_FROM="Lund Human Rights Law Review <no-reply@tudominio.com>"
ADMIN_EMAIL=tu-correo@student.lu.se
```

`.env.local` está en `.gitignore`: **nunca** lo subas a GitHub.

### 6.4 Arrancar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Deberías ver la portada, el menú de 13 materias y el botón **Sign in**.

Prueba el flujo completo:

1. **Sign in** → tu cuenta `@student.lu.se`.
2. **Publish** → sube un PDF de prueba (< 10 MB).
3. Vuelve a la portada: el artículo aparece con tu nombre de Google.
4. Abre el artículo → **Like** y **Report**.
5. **My articles** → elimina el artículo (borra también el PDF).

Otros comandos:

```bash
npm run typecheck   # TypeScript sin emitir
npm run build       # build de producción
npm start           # servir el build
```

---

## 7. Paso 5 · Nombrar administrador

No hay panel de administración: el rol vive en la base de datos. En **SQL Editor**:

```sql
-- 1) Ver quién está registrado
select id, email, full_name, is_admin from public.profiles order by created_at;

-- 2) Dar rol de administrador
update public.profiles
set is_admin = true
where email = 'tu-correo@student.lu.se';

-- 3) Quitarlo
update public.profiles set is_admin = false where email = '...';
```

Al recargar la página, esa cuenta verá:

- El botón **Remove (admin)** en cualquier artículo.
- El panel **Reports received** con motivo, detalles y contacto del reporter.
- El aviso de rol en **My articles**.

> `is_admin` no se puede escribir desde el navegador: la tabla `profiles` solo concede `select` al cliente, así que nadie puede auto-promoverse.

---

## 8. Los archivos clave

### `supabase/schema.sql` — la fuente de verdad

Lo más importante son tres piezas:

**(a) El trigger que verifica el dominio**

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_allowed_email(new.email) then
    raise exception 'Solo las cuentas @student.lu.se pueden acceder...'
      using errcode = '42501';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''),
             nullif(new.raw_user_meta_data ->> 'name', ''),
             split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**(b) La vista pública** — nadie lee `profiles` directamente; la vista expone el nombre y, **solo si el autor lo autorizó**, su email:

```sql
create view public.articles_public with (security_invoker = false) as
select a.id, a.title, a.category, a.abstract, a.pdf_path, a.pdf_size_bytes,
       a.like_count, a.report_count, a.created_at, a.author_id,
       p.full_name  as author_name,
       p.avatar_url as author_avatar_url,
       case when a.show_email then p.email else null end as author_email
from public.articles a
join public.profiles p on p.id = a.author_id
where a.is_published = true;
```

**(c) Las políticas de escritura**

```sql
-- Solo publicas como tú mismo, con perfil verificado
create policy "articles_insert_own" on public.articles for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and is_published = true
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

-- Borras lo tuyo; el admin borra cualquiera
create policy "articles_delete_own_or_admin" on public.articles for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());
```

Además, `like_count` e `is_admin` **no** están en los permisos de `insert`/`update` del cliente, así que no se pueden falsificar.

### `src/app/layout.tsx`

Fuentes (Inter + Lora), metadatos, skip-link accesible y estructura `Header / main / Footer`.

```tsx
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora  = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });

<html lang="es" className={`${inter.variable} ${lora.variable}`}>
  <body className="flex min-h-dvh flex-col">
    <Header />
    <main id="contenido" className="flex-1">{children}</main>
    <Footer />
  </body>
</html>
```

### `src/app/globals.css` — la paleta Lund

```css
@theme {
  --color-paper: #faf8f4;      /* fondo lectura */
  --color-navy-900: #0f2438;   /* azul institucional */
  --color-navy-700: #1e3f5c;
  --color-bronze-500: #ab7443; /* bronce / cobre */
  --color-bronze-200: #e7caa8;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-lora), ui-serif, Georgia, serif;
}
```

### `src/app/page.tsx` — portada

- Hero + contadores reales (`total` de artículos, 13 materias).
- **Destacados**: 3 artículos aleatorios vía RPC `random_public_articles`.
- **Catálogo**: búsqueda (`q`) + filtro (`categoria`) + paginación de 9, todo en la URL (compartible).
- Estado vacío y aviso claro si la base de datos aún no está configurada.

La búsqueda usa `ilike` con el término saneado para no romper la sintaxis de PostgREST:

```ts
if (q) {
  const term = escapeFilterValue(q);
  request = request.or(`title.ilike.%${term}%,abstract.ilike.%${term}%`);
}
```

### `src/components/ArticleCard.tsx` — la tarjeta

Toda la tarjeta es clicable con un pseudo-elemento (`after:absolute after:inset-0`), sin anidar enlaces: el chip de materia queda por encima con `relative z-10`.

```tsx
<h3 className="mt-3 font-serif text-[1.3rem] leading-snug tracking-tight text-navy-900">
  <Link href={`/articulos/${article.id}`}
        className="... after:absolute after:inset-0 after:content-['']">
    {article.title}
  </Link>
</h3>
```

### `src/components/UploadForm.tsx` — subida

Tres pasos visuales (PDF → ficha → privacidad), arrastrar y soltar, validación en cliente **y** en servidor, y limpieza si algo falla:

```ts
const path = `${user.id}/${crypto.randomUUID()}.pdf`;

const { error: uploadError } = await supabase.storage
  .from("articles")
  .upload(path, file, { contentType: "application/pdf", upsert: false });

const { data: inserted, error: insertError } = await supabase
  .from("articles")
  .insert({ author_id: user.id, title, category, abstract, pdf_path: path,
            pdf_size_bytes: file.size, show_email: showEmail })
  .select("id").single();

if (insertError) {
  await supabase.storage.from("articles").remove([path]); // sin huérfanos
}
```

El interruptor de privacidad es el que decide si `author_email` sale o no de la vista:

```tsx
<input type="checkbox" checked={showEmail}
       onChange={(e) => setShowEmail(e.target.checked)} className="peer sr-only" />
<span className="flex h-6 w-11 rounded-full bg-stone-300 peer-checked:bg-bronze-500 ..." />
<span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition peer-checked:translate-x-5" />
```

### `src/app/articulos/[id]/page.tsx` — lectura

- PDF servido con **URL firmada de 1 hora** generada en el servidor (`createSignedUrl`), más un enlace de descarga con nombre limpio.
- `LikeButton` recibe el estado inicial resuelto en servidor (¿ya te gusta?).
- `ReportButton` disponible para todo el mundo, con o sin sesión.
- `JSON-LD` `ScholarlyArticle` para que Google indexe bien los trabajos.
- Panel de reportes solo si `is_admin`.

### `src/app/api/reportes/route.ts` — reportes

Valida UUID, motivo y longitudes; aplica *rate limit* (5/hora por IP, en memoria) y *honeypot* anti-bots; guarda el reporte con `service_role` y luego envía los correos:

```ts
const { error: insertError } = await admin.from("article_reports").insert({
  article_id: article.id,
  reporter_id: user?.id ?? null,
  reporter_email: email || user?.email || null,
  reason,
  details: details || null,
});

const emailResult = await sendReportEmails({ ... });
```

### `src/lib/supabase/*.ts` — tres clientes, tres responsabilidades

| Archivo | Clave | Dónde se usa |
|---|---|---|
| `client.ts` | `anon` | Componentes `"use client"` (subida, likes) |
| `server.ts` | `anon` + cookies | Server Components y Server Actions |
| `admin.ts` | `service_role` | Solo servidor: firmar URLs, borrar, reportes |

---

## 9. Cómo funciona cada flujo

**Registro / login**
Google OAuth → `/auth/callback` canjea el código → se valida el dominio → el trigger crea `profiles` (o bloquea). La sesión vive en cookies gestionadas por `middleware.ts`, que además protege `/subir` y `/mis-articulos`.

**Publicación**
El navegador sube el PDF directo a Storage (con RLS: solo a tu carpeta) → inserta la fila en `articles` → redirección al artículo. Si el `insert` falla, se borra el PDF subido.

**Like**
`insert` en `article_likes` con PK `(article_id, user_id)` → 1 like por persona y artículo garantizado por la base de datos → un trigger actualiza `articles.like_count`. El botón es optimista y se revierte si hay error.

**Borrado**
Server Action `deleteArticle` comprueba en servidor que eres el autor o admin, borra **primero** el PDF y **después** la fila (sin huérfanos), y revalida las rutas.

**Reporte**
Cualquiera (anónimo o logueado) elige motivo + detalles → `POST /api/reportes` → se guarda el reporte → correo al autor y copia al admin. El artículo sigue publicado hasta que una persona decida.

**Búsqueda y filtros**
Todo en la URL: `/?q=climate&categoria=migration-law&pagina=2`. Sin estado de cliente, así que se puede compartir y funciona con el botón atrás.

---

## 10. Publicar en internet (Vercel)

1. Sube el proyecto a GitHub (sin `.env.local`).
2. [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo. Framework: **Next.js** (autodetectado).
3. **Environment Variables**: añade las mismas de `.env.local`, pero:
   - `NEXT_PUBLIC_SITE_URL=https://tu-dominio.com`
   - `ADMIN_EMAIL` con tu correo real.
4. **Deploy**.
5. Añade el dominio nuevo en **Supabase → Authentication → URL Configuration** (`https://tu-dominio.com/auth/callback`) y en **Google Cloud → Credentials → Authorized redirect URIs** (la de Supabase no cambia; añade el origen `https://tu-dominio.com` en *JavaScript origins*).
6. Verifica el dominio en Resend para que los correos salgan con tu remitente.

---

## 11. Modelo de seguridad

| Riesgo | Mitigación |
|---|---|
| Cuenta externa se registra | Trigger en `auth.users` + validación en el callback + `hd` en Google |
| Alguien se hace admin | `is_admin` no está en los permisos del cliente; solo SQL |
| Falsificar likes | PK `(article_id, user_id)` + `insert` solo con `user_id = auth.uid()` |
| Inflar contadores | `like_count`/`report_count` fuera de los `grant` de escritura |
| Leer PDFs ajenos o borradores | Bucket privado + URL firmada de 1 h generada en servidor |
| Ver el email de otro autor | `profiles` con RLS (solo tu fila); la vista lo oculta si `show_email = false` |
| Borrar artículos ajenos | Policy de `delete` + comprobación en la Server Action |
| Spam de reportes | Honeypot + límite por IP (en memoria: ver nota) |
| Fuga de la `service_role` | Solo en `src/lib/supabase/admin.ts`, importado únicamente por servidor |

> **Nota honesta:** el rate limit de reportes vive en memoria del proceso. En Vercel cada instancia tiene la suya. Para producción con tráfico real, cámbialo por [Upstash Ratelimit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) o una tabla con índice por IP.

---

## 12. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `relation "articles_public" does not exist` | No ejecutaste `schema.sql` (o falló a medias). Vuelve a ejecutarlo entero. |
| `new row violates row-level security policy` al publicar | Tu `profiles` no existe: tu email no es `@student.lu.se` o el trigger no está creado. Revisa `select * from profiles where id = auth.uid()`. |
| `Database error saving new user` al entrar con Google | Es el trigger bloqueando un email fuera de `@student.lu.se`. Es el comportamiento esperado. |
| El PDF no se ve y sale aviso de *service role* | Falta `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (y reinicia `npm run dev`). |
| El reporte se guarda pero no llega el correo | Falta `RESEND_API_KEY`, o el dominio no está verificado en Resend (revisa *Logs*). |
| `redirect_uri_mismatch` en Google | La URI debe ser exactamente `https://TU-PROYECTO.supabase.co/auth/v1/callback`. |
| Los correos caen en spam | Verifica el dominio en Resend (SPF + DKIM) y usa un `EMAIL_FROM` de ese dominio. |
| `Cannot read properties of null (reading 'useContext')` durante `next build` en Windows | Fallo conocido de Next en Windows con ciertas versiones de Node. Prueba **Node 20 LTS**, borra `.next` y `node_modules`, y si persiste despliega en Vercel (Linux), donde no ocurre. `npm run dev` no se ve afectado. |
| Estilos sin aplicar | Asegúrate de que `postcss.config.mjs` usa `@tailwindcss/postcss` (Tailwind v4) y de que `globals.css` empieza por `@import "tailwindcss";`. |
| Cambié una materia y no aparece | Las materias están en **dos sitios**: `src/lib/categories.ts` y el `check` de `articles.category` en `schema.sql`. Actualiza ambos. |

---

## 13. Siguientes pasos

Ideas para cuando la base esté estable:

1. **Edición de metadatos** (título/resumen) con una policy de `update` limitada a columnas seguras y ventana de 24 h.
2. **Moderación**: pasar reportes a `reviewed`/`dismissed` y usar `is_published = false` en lugar de borrar.
3. **Etiquetas OSCOLA**: validar el PDF con `pdf.js` (contar notas al pie) antes de aceptar la subida.
4. **Notificaciones**: avisar por email al autor cuando alguien da like (con *digest* semanal, no uno por like).
5. **Búsqueda full-text** en Postgres (`tsvector` + `websearch_to_tsquery`) con índice GIN, en lugar de `ilike`.
6. **Analíticas** de descargas por artículo (tabla `article_downloads`) para destacar lo más leído de verdad.
7. **Perfil público de autor** en `/autores/[id]` con su producción.

---

Hecho con cariño para el máster. Si algo no cuadra, el sitio donde mirar primero es siempre el **SQL Editor** de Supabase y los **logs** de Vercel.
