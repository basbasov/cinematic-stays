/* ============================================================
   CINEMATIC STAYS — SUPABASE CONNECTION
   ============================================================
   Fill these in once you've created your free Supabase project
   (see README.md → "Setting up the real backend" for steps).

   Where to find them: Supabase dashboard → your project →
   Project Settings (gear icon) → API →
     - "Project URL"       → paste into `url` below
     - "anon" "public" key → paste into `anonKey` below

   This anon key is SAFE to expose in public site code — it only
   allows what the Row Level Security rules in supabase_schema.sql
   permit (anyone can read hotels; only a signed-in admin can
   add/edit/delete). It is NOT a secret/admin password.

   Until you fill these in, the site automatically uses the
   bundled hotel list in data.js instead — nothing breaks either way.
   ============================================================ */

const SUPABASE_CONFIG = {
  url: "",       // e.g. "https://abcdefghij.supabase.co"
  anonKey: "",   // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
};
