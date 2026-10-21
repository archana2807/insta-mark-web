# Insta Mark Website: Admin Guide

यह guide Insta Mark की team के लिए है: website पर enquiries देखना, photos डालना और जानकारी बदलना। Buttons के नाम ठीक वैसे लिखे हैं जैसे screen पर दिखते हैं।

**Admin panel का पता:** `https://www.<your-domain>/admin`

---

## 1. Sign in

1. ऊपर दिए पते पर जाएँ।
2. अपना **Email** और **Password** डालें, फिर **Sign in** दबाएँ।
3. काम ख़त्म होने पर ऊपर दाईं ओर **Sign out** दबाएँ। 8 घंटे बाद आप अपने-आप sign out हो जाते हैं।

> **Password 5 बार गलत** डालने पर account 15 मिनट के लिए lock हो जाता है। तुरंत खुलवाना हो तो Admin user से कहें कि **Users** में आपका password reset करें (इससे account unlock भी हो जाता है)।
> अपना password बदलने के लिए ऊपर अपने नाम पर click करें, फिर **Change password**।

**Roles:**
- **Admin**: सब कुछ (users, settings, audit log भी)
- **Editor**: enquiries और website का content। Settings और users नहीं दिखते।

---

## 2. Enquiries (Leads)

**Dashboard** पर सबसे ऊपर दिखता है कि कितनी **नई enquiries** का जवाब बाकी है।

**Enquiries** menu में:
- **Search**: नाम, email, company, phone या location से ढूँढें।
- **Status / Solution** से filter करें, फिर **Filter** दबाएँ।
- किसी enquiry के नाम पर click करें, details खुल जाएँगी। Phone के पास **WhatsApp** link से सीधे chat कर सकते हैं।

**Follow-up करना:**
1. Enquiry खोलें।
2. **Status** बदलें:
   - **NEW**: अभी किसी ने संपर्क नहीं किया
   - **CONTACTED**: बात हो गई
   - **QUOTED**: quotation भेज दिया
   - **WON** या **LOST**: order मिला या नहीं मिला
   - **SPAM**: बेकार या fake (यह list से छिप जाती है, और 90 दिन बाद अपने-आप delete हो जाती है)
3. **Owner** में चुनें कि कौन इसे संभाल रहा है, फिर **Save** दबाएँ।
4. **Notes** में लिखें कि क्या बात हुई ("Site visit Monday को", "Quotation ₹…") और **Add note** दबाएँ।

**Excel में निकालना:** Enquiries पर **Export CSV** दबाएँ। जो filter लगा है, उसी हिसाब से file बनती है। हर महीने एक बार export करके backup रखें।

---

## 3. Categories & photos (8 solution pages)

**Categories & photos** में किसी solution पर **Edit** दबाएँ।

### Photos
- **Upload photos**: एक साथ कई photos चुन सकते हैं (JPG, PNG, WebP; हर photo 10 MB तक)।
  - ऊपर वाले box में पहले चुनें कि photos **Executed site photos** हैं (असली काम) या **Catalogue / product images**।
- हर photo के नीचे **Alt text** है, यानी photo में क्या दिख रहा है उसका एक छोटा वाक्य। Google और दृष्टिबाधित लोग इसी को पढ़ते हैं। अच्छे उदाहरण:
  - ✅ "Illuminated 3D letter signage for Joyville on a boundary wall"
  - ❌ "photo1", "IMG_2034", "signage"
  लिखकर **Save** दबाएँ।
- **↑ / ↓** से order बदलें। सबसे ऊपर वाली photos page पर सबसे पहले और बड़ी दिखती हैं।
- **Set cover**: वह photo जो home page के card और menu में दिखेगी।
- 🗑 से photo हटाएँ (पूछने पर OK दबाएँ)।

### Page content
- **Card text**: home page पर दिखने वाली एक line।
- **Overview, Key features** (हर feature अलग line में), **Applications**।
- **Icon**: list से चुनें।
- **Visible**: tick हटाने पर page website से छिप जाता है।
- **SEO title / description**: खाली छोड़ सकते हैं, तब अपने-आप बन जाते हैं।
- आख़िर में **Save changes** दबाएँ। Website कुछ seconds में update हो जाती है।

> **URL नहीं बदलता** (जैसे `/solutions/road-signs`), ताकि Google ranking बनी रहे।

---

## 4. Projects (Executed projects)

1. **Projects** खोलें, फिर **New project**।
2. **Project title** (जैसे "CCI Residential Tower, Kandivali"), **Client**, **City**, **Year**, **Industry** भरें।
3. **Solutions used in this project** में tick करें।
4. **Create project** दबाएँ, फिर उसी page पर **Upload photos**।
5. **Featured** tick करने पर project ऊपर दिखता है। **Visible on website** का tick हटाने पर project छिप जाता है।

Website पर हर project का अपना page बनता है: `/projects/<project-name>`।
**Delete project** से project हमेशा के लिए हट जाता है।

---

## 5. Client logos

Home page की "Trusted by" पट्टी के लिए।
1. **Logo image** चुनें (बेहतर हो कि PNG हो, transparent background के साथ), **Company name** लिखें, चाहें तो **Website** डालें।
2. **Add** दबाएँ।
3. Order नंबर से क्रम बदलें। **On** का tick हटाने पर logo छिप जाता है।

> सिर्फ़ उन्हीं brands के logos लगाएँ जिनकी अनुमति हो।

---

## 6. FAQs

- **Shown on → Home + all solution pages (general)**: सामान्य सवाल
- **Shown on → <Solution> page only**: सिर्फ़ उस solution के page पर (उस page के general सवालों की जगह ये दिखेंगे)
- **Home page** tick: home page पर भी दिखे
- **Add FAQ** / **Save** / **Delete**

---

## 7. Home banner

Home page पर headline के बगल वाली बड़ी image। Desktop (बड़ी screens) और mobile (phones) के लिए अलग-अलग image upload करें।

**Design team के लिए sizes:**

| Banner | Upload size | Shape | Safe area (text/logo इसके अंदर रखें) | Format |
|---|---|---|---|---|
| Desktop | **1920 × 1720 px** | ≈ 10:9 | बीच का 1500 × 1600 px | JPG या WebP, ≤ 600 KB |
| Mobile | **1080 × 1080 px** | 1:1 (square) | बीच का 960 × 960 px | JPG या WebP, ≤ 300 KB |

1. **Home banner** खोलें, desktop या mobile में **Upload image** से file चुनें। Upload होते ही website पर आ जाती है।
2. इससे छोटी images (desktop 1600 × 1400, mobile 900 × 900 से कम) नहीं ली जातीं।
3. **Alt text** में image का छोटा विवरण लिखें (screen readers के लिए) और **Save alt text** दबाएँ।
4. **Remove** दबाने पर पुरानी photo वापस दिखने लगती है। Mobile image न हो तो phones पर desktop image दिखती है।

> Upload के लिए Cloudinary keys चाहिए (CLOUDINARY_* settings)।

## 8. Site settings (सिर्फ़ Admin)

- **Phone**: footer और mobile के call button में दिखता है।
- **WhatsApp number**: सिर्फ़ अंक, country code के साथ (जैसे `919876543210`)।
- **Email, Address, City, State**
- **Google Maps embed URL**: Google Maps पर अपना office खोलें, फिर **Share → Embed a map → Copy HTML**, और उसमें से सिर्फ़ `src="…"` के अंदर का link डालें।
- **Founded (year)**: इससे home page पर "X+ years" badge बनता है।
- **LinkedIn / Instagram / …** links

> जो field खाली है वह website पर नहीं दिखती। Website पर कोई नकली नंबर नहीं दिखता।

---

## 9. Users और Audit log (सिर्फ़ Admin)

- **Users → Add user**: नाम, email, role, शुरुआती password (10+ characters)। Password उस व्यक्ति को सुरक्षित तरीके से दें (एक ही message में email और password न भेजें)।
- किसी के जाने पर **Active** का tick हटाकर **Save** करें। उनका पुराना काम (notes वगैरह) बना रहता है।
- **Reset & unlock**: किसी का password भूल जाने या account lock होने पर।
- आप ख़ुद को deactivate नहीं कर सकते, और कम से कम एक Admin हमेशा रहना ज़रूरी है।
- **Audit log**: किसने कब क्या बदला (1 साल तक रहता है)।

---

## 10. मदद

| समस्या | क्या करें |
|---|---|
| Change website पर नहीं दिख रहा | 1 मिनट रुककर page refresh करें (Ctrl+F5) |
| "Upload could not be verified" या upload fail | Photo दोबारा upload करें। बार-बार हो तो developer को बताएँ। |
| Red box में error | Message पढ़कर field ठीक करें। आपका भरा हुआ बाकी data बना रहता है। |
| Login नहीं हो रहा | 15 मिनट रुकें, या Admin से password reset करवाएँ |
| कुछ और | Developer को screenshot और समय के साथ बताएँ |
