# Attendance Auth Server (Cloudflare Workers + D1)

## API (APK ke liye)
POST /auth   body: {"key":"CLG-XXXX-XXXX-XXXX","hwid":"<device id>"}
- ok:true  -> {ok, name, roll, payload, sig}  (sig tab aata hai jab SIGN_SECRET set ho)
- error    -> {ok:false, error:"invalid key" | "blocked" | "device mismatch"}

Pehli baar login par key us device se bind ho jaati hai. Doosre phone se login nahi hoga.
Naya phone chahiye to admin panel me "Reset device".

## Admin panel
https://<tumhara-worker>.workers.dev/admin   (ADMIN_TOKEN daalo)

## Setup (phone se, bina wrangler ke)
1. Cloudflare dashboard -> Storage & Databases -> D1 -> Create -> naam: attendance
2. D1 ke Console me schema.sql ka content paste karke Run karo
3. D1 ka database_id copy karke wrangler.toml me PASTE_DATABASE_ID_HERE ki jagah daalo
4. git commit + push (GitHub)
5. Cloudflare -> Workers & Pages -> Create -> Import a repository -> GitHub repo chuno -> Deploy
6. Worker -> Settings -> Variables and Secrets:
   - ADMIN_TOKEN  (lamba random password, type: Secret)
   - SIGN_SECRET  (doosra lamba random, type: Secret)
