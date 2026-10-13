# Insta Mark Project: Chat History

- **Date:** 12 Oct 2026
- **Topic:** Insta Mark website project की planning: content समझना, tech stack, database, client meeting summary

---

## 1. Project किस चीज़ से जुड़ा है?

**User:** Insta Mark के नए project का Drive folder दिया
(https://drive.google.com/drive/folders/1sU4nO0S4S8wSf4R2V0KyEFOT8zRPpylm)। पूछा कि project किस चीज़ से जुड़ा है, किस tech stack में बनाना चाहिए और plan क्या होगा। Development शुरू नहीं करनी थी।

**Claude:**
- Folder में text document नहीं है, सिर्फ़ photos हैं, जो 3 categories में रखी हैं:
  - **Modular Signs**: Goa और Lucknow (airport) projects, door signs, hanging wayfinding signs
  - **Road Safety Products** (81 photos): speed breakers, corner guards, parking level marking
  - **Tailor Made Signages**: Branding, Full Project, Hanging Signages, Pylons, Wall Mounted
- **Conclusion:** Insta Mark एक B2B signage और road safety products कंपनी है। Project उसकी **company website है, जिसमें product catalog, portfolio और quote/enquiry की सुविधा होगी**।
- **Plan:**
  - Phase 1: Home, Products, Projects/Portfolio, Request a Quote, WhatsApp button, SEO
  - Phase 2: Admin panel (products, photos, enquiries)
  - Phase 3: Quotation PDF, sign customizer, B2B login (ज़रूरत हो तो)
- Client से लेने वाली चीज़ें: logo, product specs, client list, domain, language।

## 2. React + Node.js या कुछ और?

**User:** क्या इसे React और Node.js से बना सकते हैं? Best option कौन-सा है?

**Claude:**
- React (Vite) + Express अलग-अलग: बन सकता है, पर SPA होने से **SEO कमज़ोर** रहता है।
- **Next.js** भी React + Node.js ही है, बस SSR/SSG के साथ, जिससे SEO strong, एक codebase, built-in image optimization।
- **Recommendation: Next.js**, क्योंकि यह public catalog website है जिसका काम leads लाना है।

## 3. Database कौन-सा?

**User:** Project content के हिसाब से database कौन-सा लें?

**Claude:**
- **PostgreSQL**, क्योंकि data relational है (Category → Sub-category → Product → Project → Enquiry)।
- अलग-अलग product specs के लिए JSONB column।
- Images Cloudinary पर रहेंगी, DB में सिर्फ़ URL।
- Hosting: Neon या Supabase।
- Basic tables: categories, products, product_images, projects, project_images, project_products, enquiries, clients, users।

## 4. Final tech stack

**User:** Final tech stack बताइए।
**User:** TypeScript नहीं चाहिए, normal JavaScript use करें।

**Claude:** Payload CMS TypeScript पर बना है, इसलिए उसे हटाकर Prisma और custom admin panel रखा। **Final stack (JavaScript):**

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + JavaScript |
| UI | Tailwind CSS + shadcn/ui, Framer Motion |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Admin Panel | Custom (`/admin`) + Auth.js login |
| Images | Cloudinary |
| Forms | React Hook Form + Zod |
| Email | Resend |
| WhatsApp | Click-to-chat |
| SEO / Analytics | Next.js Metadata, sitemap, Schema, GA4, Search Console |
| Hosting | Vercel |
| Version Control | Git + GitHub |

## 5. Client meeting video

**User:** Client discussion का video दिया
(https://drive.google.com/file/d/1u-cw30QYawmdFcgXvRIxtrZ96d45QxLl/view) और उसकी summary माँगी।

**Claude:** Video (~17 min, Google Meet, 8 Oct 2026) को speech-to-text से transcribe करके summary बनाई।
→ पूरी summary: [meeting-summary.md](meeting-summary.md)

Key points:
- Website client के **catalogue के flow** पर बनेगी। Products सबसे ज़रूरी हैं।
- Homepage: Banner → About → Product Categories grid → Working Process → Industries → CTA
- Category page: content, फिर catalogue images, फिर executed site photos, फिर उसी page पर enquiry form
- Users site और procurement वाले लोग हैं, इसलिए website simple, picture-heavy, कम animation वाली होनी चाहिए
- Design reference: Crafto "Branding Agency" demo, white theme में (confirm करना बाकी)
- Client category-wise sorted high-res photos Drive पर देंगे

## 6. Client content PDF

**User:** Client का content file दिया
(https://drive.google.com/file/d/1vUhkVfGEm1TMMhAb7UqZadZZ3k0n1rQC/view)।

**Claude:** शुरू में file private थी। Sharing ठीक होने के बाद पढ़ी: **Website_Content_Insta_Mark.pdf** (8 pages)। इसमें पूरी website का text है:
- **Home:** Hero "Signage That Guides. Safety That Lasts.", About, Expertise, Why Choose Us, Industries, Working Process, Featured Projects, CTA, FAQs
- **8 Category pages:** Tailormade, Modular, General, Braille, Fire & Safety, Emergency Lights, Road Signs, Road Safety Products
- **About Us, Projects, Contact** (form fields: Name, Company, Email, Phone, Project Location, Requirement, Message)

**User:** एक और Drive folder दिया (https://drive.google.com/drive/u/1/folders/1e1R0hHf7qJLwn-cDtWFFnseLQCUGUnRU)।

**Claude:** यह folder private है (401)। "Anyone with the link" sharing चाहिए। **अभी pending है।**

## 7. Files

**User:** Meeting summary अलग file में save करो। Client discussion file मत बनाओ।

**Claude:**
- `docs/meeting-summary.md` बनाई।
- Transcript वाली file बनाई थी, user के कहने पर delete कर दी।
- यह chat history `docs/chat-history.md` में save की।

---

## Current status

- ✅ Project समझ लिया, tech stack और database तय
- ✅ Meeting summary और content PDF का review हो गया
- ⏳ Pending: sorted high-res photos, client logos, catalogue PDF, design reference की confirmation, private Drive folder का access
- ⛔ Development अभी शुरू नहीं हुई है (user के कहने पर)
