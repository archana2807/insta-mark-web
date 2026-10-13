# Insta Mark Website: Client Meeting Summary

- **Date:** 8 Oct 2026
- **Mode:** Google Meet (recording ~17 min)
- **Topic:** Insta Mark की नई company website की structure, content और design तय करना
- **Participants:** Insta Mark (client, call में "Srishti"), Prashant Makhija (agency lead), Shivani Singh (content/images), Archana Patel
- **Recording:** https://drive.google.com/file/d/1u-cw30QYawmdFcgXvRIxtrZ96d45QxLl/view

---

## 1. Website "catalogue के flow" पर बनेगी

- Client ने अपना **"Insta Architectural Signs Catalogue" PDF** (103 pages) screen share किया।
- Client की बात: *"Basically, just follow the flow of my catalog."* और *"I just want my catalog up there... my products is most important."*
- **नहीं चाहिए:** Fixtures, Processes, और शायद Materials भी।
- **ज़रूरी है:** Brand (about), Sectors, Working Process (Survey, Design, Manufacture, Install), Products, और आख़िर में Pictures।

## 2. Homepage structure

```
Banner (tagline) → About (1-2 lines) → Product Categories grid
→ Working Process → Industries We Serve → Clients / CTA
```

Grid की categories: Tailor-made, Modular, General, Braille, Fire & Safety, Emergency Lights, Road Signs, Road Safety Products।

## 3. Product Category page (हर category के लिए)

1. Shivani का लिखा content (overview, features)
2. Catalogue की stock images, यानी product profiles
3. Site पर executed काम की real photos (जैसे CCI residential tower, Kandivali, जो Tailor-made category में है)
4. Contact/enquiry form उसी page पर, ताकि user को कहीं और न जाना पड़े

## 4. Target users

- Visitors ज़्यादातर **site और procurement वाले लोग** होंगे, जो "not very tech friendly" हैं।
- Website **simple, short और picture-oriented** होनी चाहिए। Client की बात: *"Nobody wants to read, you put images."*
- **Fancy animation sections हटाने हैं।**

## 5. Design reference

- Video में आख़िर में जो template खुला था, वह **Crafto HTML template का "Branding Agency" demo** है: https://craftohtml.themezaa.com/demo-branding-agency.html. Final choice शायद यही है, पर video से 100% पक्का नहीं होता, इसलिए confirm करना है।
- Template का color cream है, client को **white** चाहिए।
- "Simple, nice, very professional", picture-heavy layout पसंद आया।
- Client के logo और banner की placement agency तय करेगी।

## 6. Images के action items

- Client के पास सारी photos हैं, पर sorted नहीं हैं। High-resolution files भेजेंगे, क्योंकि WhatsApp वाली compressed हैं।
- Client photos **Drive पर upload करके category के नाम से rename** करेंगे (target: weekend तक)।
- Client और Shivani का **30–40 मिनट का online session** (शाम 5 बजे) होगा, जिसमें हर project को सही category में डाला जाएगा।
- कोई image कम पड़े तो **AI से images generate** करने या Pinterest references लेने का option भी discuss हुआ।

---

## Content PDF (Website_Content_Insta_Mark.pdf): overview

| Page | Content |
|---|---|
| **Home** | Hero: *"Signage That Guides. Safety That Lasts."*, About, Our Expertise, Why Choose Us, Industries (12), Working Process (4 steps), Featured Projects, Trusted by Leading Brands, CTA, 5 FAQs |
| **Product Categories (8)** | Tailormade, Modular, General, Braille, Fire & Safety, Emergency Lights, Road Signs, Road Safety Products। हर एक में Overview, Key Features, Applications, CTA |
| **About Us** | Who We Are, Vision, Mission, Why Choose Us, Solutions, Industries, Manufacturing Capabilities, Our Process (5 steps) |
| **Projects** | Portfolio intro और CTA |
| **Contact** | Form: Name, Company, Email, Phone, Project Location, Requirement, Message। CTA: Request a Consultation / Get a Quote |

---

## Pending items

- [ ] Category के हिसाब से sorted high-res photos (client से)
- [ ] Client logos ("Pick logos from the website", यानी पुरानी website से)
- [ ] Catalogue PDF की copy
- [ ] Design reference की final confirmation (Crafto Branding Agency, white theme)
- [ ] Drive folder `1e1R0hHf7qJLwn-cDtWFFnseLQCUGUnRU` का access (अभी private है)

## Tech stack (तय)

Next.js (JavaScript, बिना TypeScript) + Tailwind CSS + shadcn/ui + PostgreSQL (Prisma) + Cloudinary + Vercel
