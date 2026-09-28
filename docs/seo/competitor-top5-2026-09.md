# Rakip Analizi — Google İlk 5 (4 hedef kelime)

- **Tarih:** 2026-09-27
- **Pazar:** US (Google organic)
- **Kapsam:** 4 hedef kelime × ilk 5 organik sonuç = 20 sayfa; 19'u fetch edilip analiz edildi, 1'i kısmi (aşağıda).
- **Yöntem:** SERP `websearch` ile alındı. Sayfalar HTML olarak indirildi; `<script>/<style>/<!-- -->` temizlendi, etiketler strip edildi, boşluklar tek boşlukla normalize edildi, sonra boşlukla bölünüp en az bir alfanumerik karakter içeren token'lar sayıldı. **Kelime sayıları sayfa genelidir (nav/footer dahil), yaklaşıktır.** H2'ler `<h2>` etiketinden (veya markdown `##`) çıktı olarak alındı.
- **Reklam notu:** SERP çıktısında sponsor/reklam etiketi taşıyan sonuç yoktu; tablolar yalnızca organik sonuçlardır.

---

## 1. `pdf summarizer`

| # | Domain | URL | Title | Yaklaşık kelime | Format | Öne çıkan H2'ler |
|---|--------|-----|-------|-----------------|--------|------------------|
| 1 | adobe.com | https://www.adobe.com/acrobat/online/ai-summary-generator.html | Free AI summarizer: PDF summarizer \| Adobe Acrobat | ~2.065 (ana içerik ~1.670) | Aracı tanıtan + adım-adım kullanım + örnek prompt tablosu + FAQ | How to use the summary generator tool · Sample prompts to try with our AI Summarizer · Try our AI text summarizer tool for free · Questions about the text summarizer tool? We have answers · More resources · Use Acrobat tools for free · Try these Acrobat online tools |
| 2 | chatpdf.com | https://www.chatpdf.com/pdf-summary | PDF Summary \| Free and instant with AI | ~924 | Aracı tanıtan + nasıl yapılır + FAQ | Fast and easy PDF summarization… · Summarize any file, video or website · Fast and Simple AI PDF Summaries · How to summarize a PDF · Frequently Asked Questions |
| 3 | pdf-summarizer.com | https://www.pdf-summarizer.com/ | PDF Summarizer - Summarize PDFs up to 1500 Pages | ~496 | Minimal landing page + tek başına FAQ bloğu | Frequently Asked Questions *(tek H2)* |
| 4 | rewind.ai | https://rewind.ai/pdf/summarizer/ | Free AI PDF Summarizer \| Rewind.ai | ~1.014 | Aracı tanıtan + API bölümü + FAQ | How to Use PDF Summarizer · Use this tool via API · PDF Summarizer FAQ |
| 5 | genspark.ai | https://www.genspark.ai/tools/pdf-summarizer | Free AI PDF Summarizer: Summarize Long PDFs Fast | ~1.687 | Aracı tanıtan + kullanım senaryoları + "3 adımda" + karşılaştırma (ChatGPT/Claude) + FAQ | One PDF summarizer for every kind of reader · Summarize any PDF in 3 steps · Frequently Asked Questions · Explore more tools |

**Fetch notları:** adobe.com doğrudan `fetch`/`curl` ile timeout verdi; sayfa `r.jina.ai` proxy üzerinden indirilip sayıldı (H2 listesi ayrıca `webfetch` ile doğrulandı). Diğer 4 sayfa doğrudan indi.

### Eksik H2 fırsatları (Summify aksiyonları)

- **`Fiyatlandırma & ücretsiz plan limitleri` — hiçbir H2 yok.** Adobe/Genspark fiyat sinyalini sadece metin/CTA içinde veriyor, QuillBot ve chatpdf limiti FAQ içine gömüyor (günlük 2 PDF, 10 MB). → **Summify'da "Free vs Pro: limitler ve fiyat" H2'si + mini tablo** SERP'te tek başına durur.
- **`Gizlilik: dosyaların nereye gidiyor?` — H2 yok.** Sadece pdf-summarizer.com FAQ'sında tek cümlelik GDPR/HIPAA cevabı, Adobe FAQ'sında "eğitim verisi kullanılmıyor" var. → **"Your files are deleted after X minutes / never used for training" H2 + SOC2/GDPR rozetleri** güçlü bir ayrışma noktası.
- **`Limitler: sayfa, kelime, dosya boyutu` — H2 yok.** Sadece H1'de ("up to 1500 pages") ve FAQ'da dağınık. → **"Supported file types, size & page limits" H2 + tablo** (Sayfa / Kelime / MB / Dil).
- **`Kullanım adımları` — sadece 2'sinde var** (Adobe "How to use", Genspark "in 3 steps"). chatpdf'de var, pdf-summarizer.com ve rewind.ai'da yok. → **"Summarize a PDF in 3 steps (Upload → Choose length → Export)" H2 + ekran görüntüsü** Summify için zorunlu.
- **`Alternatifler / karşılaştırma tablosu` — ilk 5'te HATA olarak hiçbir sayfada yok.** Hepsi tek araç landing page'i. → **"Summify vs Adobe Acrobat vs QuillBot vs ChatPDF" karşılaştırma tablosu** bu kelime için düşük rekabetli, yüksek değerli bir açılım.
- **`Kullanıcı yorumu / puan` — hiçbir sayfada yok.** Adobe "110M+ özet üretildi" sosyal kanıtı veriyor ama H2 olarak yok. → **"What users say" H2 + puan/yorum bloğu (schema: Review/AggregateRating)**.
- **`Dil desteği` ve `Tarayıcı eklentisi/entegrasyon`** sadece metin içinde; H2 olarak yok. → SUMMIFY için H2'ye taşı.

---

## 2. `contract summary`

> **SERP karakteri:** Bu kelime ilk 5'te **hiç ticari içerik üretmiyor** — 2'si devlet PDF formu, 3'ü devlet veri/mevzuat sayfası. Yani hedef kelime geniş (informational/navigational) bir niyet taşıyor; ilk 5'te hiçbir AI özeti aracı, blog yazısı veya ürün sayfası yok.

| # | Domain | URL | Title | Yaklaşık kelime | Format | Öne çıkan H2'ler |
|---|--------|-----|-------|-----------------|--------|------------------|
| 1 | cragenda.broward.org | https://cragenda.broward.org/docs/2013/CCCM/20130827_358/14706_EXHIBIT%2001_Agreement%20Summary.pdf | Agreement Summary Sheet | ~391 | PDF form (devlet ihale özeti) | AGREEMENT SUMMARY EXHIBIT 1 *(tek H2)* |
| 2 | purchasing.nv.gov | https://www.purchasing.nv.gov/siteassets/content/statewide-contracts/SampleSummary.pdf | CONTRACT SUMMARY | ~797 | PDF form (kurul onay formu) | CONTRACT SUMMARY · I. DESCRIPTION OF CONTRACT · II. JUSTIFICATION · III. OTHER INFORMATION |
| 3 | cms.gov | https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/monthly-contract-and-enrollment-summary-report/contract-summary-2025-01 | Contract Summary 2025 01 \| CMS | ~1.666 | Devlet veri indirme sayfası | Downloads · Get email updates · Connect with CMS *(H2'ler çoğunlukla nav)* |
| 4 | legislation.gov.uk | https://www.legislation.gov.uk/eur/2019/2243/contents | Commission Implementing Regulation (EU) 2019/2243 … template for the contract summary | ~1.164 | Mevzuat içeriği/indeksi | legislation.gov.uk · Search Legislation · You are here: · What Version · Opening options · More Resources · Legislation originating from the EU · Changes to legislation · Options/Help *(H2'ler tamamı nav)* |
| 5 | apps.des.wa.gov | https://apps.des.wa.gov/DESContracts/Home/ContractSummary/00217 | Contract Summary | ~1.063 | Devlet sözleşme kayıt sayfası (tablo/form alanı) | — *(H2 yok)* |

**Fetch notları:** 1 ve 2 numaralı sonuçlar PDF; doğrudan HTML analizi mümkün değil, `r.jina.ai` üzerinden metne çevrilip kelime/H2 çıkarıldı. 3–5 doğrudan indi. Hepsi FETCH OK.

### Eksik H2 fırsatları (Summify aksiyonları)

- **İlk 5'te tek bir "contract summary nedir / AI ile nasıl üretilir" içerik yok.** → Summify için **tamamen boş bir niş:** yeni bir sayfa/hub ("Contract Summary: What It Is + Free AI Contract Summary Generator") bu SERP'e girmenin tek yolu.
- **`What is a contract summary (definition + example)`** — H2 olarak hiçbir yerde yok, sadece formlar var. → **Tanım + gerçek bir sözleşme özeti örneği (redacted)** H2'si.
- **`AI ile sözleşme özeti: adımlar (Upload → Extract key clauses → Export)`** — yok. → Sayfanın ana H2'si bu olmalı.
- **`Önemli maddeler nelerdir? (taraflar, süre, ödeme, fesih, sorumluluk, yenileme)`** — NV formunda "I. DESCRIPTION / II. JUSTIFICATION" başlığı var ama içerik olarak madde listesi yok. → **"6 kritik madde + her biri için tek cümlelik özet"** H2'si rekabetin yapmadığı değer.
- **`Şablon / ücretsiz PDF indir`** — yok. → lead magnet olarak **indirilebilir contract summary şablonu** H2'si.
- **`Gizlilik & yasal uyarı` (hukuki tavsiye değildir, avukat inceleği gerekir)** — yok. → Summify'a özgü **"Not legal advice" + gizlilik H2'si** hem güven hem E-E-A-T için şart.
- **`Fiyat / limitler`** — yok (ticari sayfa hiç yok). → ilk 5'teki tek ticari sayfa Summify olursa fiyat H2'si otomatik ayrıştırıcı.
- **`Kullanıcı yorumu`** — yok.

---

## 3. `notebooklm alternatives`

| # | Domain | URL | Title | Yaklaşık kelime | Format | Öne çıkan H2'ler |
|---|--------|-----|-------|-----------------|--------|------------------|
| 1 | toolworthy.ai | https://www.toolworthy.ai/blog/notebooklm-alternatives | 10 NotebookLM Alternatives 2026 — Research, Privacy, Export | ~7.544 | Uzun listicle + puanlı karşılaştırma tablosu + detaylı inceleme + migration rehberi + use-case yönlendirme + FAQ | Why People Are Leaving NotebookLM in 2026 · Top 10 NotebookLM Alternatives Compared · Detailed Reviews · Honorable Mentions · Migrating from NotebookLM — A Practical Guide · Best NotebookLM Alternatives by Use Case · How to Choose the Right NotebookLM Alternative · Frequently Asked Questions · Get ToolWorthy Weekly · Related Posts · Built a tool that belongs in this decision set? |
| 2 | androidauthority.com | https://www.androidauthority.com/notebooklm-alternatives-3672278/ | 5 apps you should use instead of NotebookLM | ~1.318 | Editoryal liste (H2 = araç adları), karşılaştırma tablosu yok | Notion · Obsidian · Recall AI · Atlas · OpenNotebook |
| 3 | atlasworkspace.ai | https://www.atlasworkspace.ai/blog/notebooklm-alternatives | 8 Best NotebookLM Alternatives (2026): AI-Powered Research | ~3.205 | 6 sütunlu puanlı karşılaştırma tablosu + sıralı liste + seçim tablosu + FAQ | Summary · Map your sources in Atlas · Frequently Asked Questions · Atlas is built for source-grounded research · Further reading |
| 4 | notebooktoolkit.com | https://notebooktoolkit.com/blog/best-notebooklm-alternatives-2026 | Best NotebookLM Alternatives in 2026: Full Comparison | ~780 | Kısa liste + "İhtiyaç → Doğru araç" tablosu + öneri | Table of Contents · Why Look for NotebookLM Alternatives? · The Top Alternatives · Choosing the Right Alternative · Our Recommendation · Ready to supercharge your Gemini Notebook workflow? · Related Articles |
| 5 | kenkyu.ai | https://www.kenkyu.ai/en/blog/notebooklm-alternatives | 8 Best NotebookLM Alternatives in 2026 | ~4.637 | 9 sütunlu puanlı karşılaştırma tablosu + numaralı H2 listeler + skorlama metodolojisi + FAQ | At a glance: the best NotebookLM alternatives compared · What is NotebookLM? · 1. Kenkyu.ai, Editor's pick… · 2. SciSpace… · 3. Anara… · 4. Paperguide… · 5. Elicit… · 6. Liner… · 7. Consensus… · 8. NotebookLM: the source-grounded synthesis and study tool you are comparing · How we scored the best NotebookLM alternatives · Frequently asked questions · You might also like · Start your research journey today · Product · Resources · Legal · Support |

**Fetch notları:** 5/5 doğrudan indi, FETCH OK.

### Eksik H2 fırsatları (Summify aksiyonları)

- **`Ücretsiz plan limitleri / fiyat karşılaştırması` — H2 olarak 0/5.** Fiyat sadece tablo hücrelerinde (atlas, kenkyu) veya metinde geçiyor. → **"Free plans & what you actually get" H2 + fiyat/limit tablosu** (kaynak sayısı, aylık özet, dışa aktarma).
- **`Gizlilik & veri sahipliği (Google bulutuna veri gidiyor mu)` — 1/5 (toolworthy'nin "Why People Are Leaving" bölümü altında).** → **Ayrı H2: "Is NotebookLM private? What happens to your sources"** — Summify'ın gizlilik konumlandırmasıyla birebir örtüşür.
- **`Sesli özet / Audio Overview alternatifi` — hiçbir H2'de yok** (sadece tek cümleler halinde geçiyor). → Summify'ın podcast/audio çıktısı için **"Looking for an Audio Overview alternative?" H2'si** — hiç kimsenin yapmadığı ayrışma.
- **`Migration: NotebookLM'den nasıl taşınır` — sadece toolworthy'de var (1/5).** → **"Move your notebooks in 4 steps" H2** + ekran görüntüsü.
- **`Test methodology / nasıl puanlandı` — sadece kenkyu'da var (1/5).** → **"How we tested (X tool, X gün, aynı kaynak seti)" H2** E-E-A-T + güven için.
- **`Kim hangi aracı seçmeli (use-case routing)` — 2/5 (toolworthy, notebooktoolkit).** → **"Best for students / researchers / teams / privacy-first" H2 matrisi**.
- **`NotebookLM'in sınırı: 50 kaynak limiti` ayrı H2 olarak yok** (hepsi giriş paragrafında). → H2'ye taşı.
- **`Kullanıcı yorumu` — 0/5.**
- **`Alternatifler tablosu` H2'si var, ama "rakip alternatifleri" (tool vs tool) H2'si yok** → toolworthy'deki "Honorable Mentions" benzeri bir **"Also considered" H2'si** Summify'da listeyi derinleştirir.

---

## 4. `best ai summarizer tools 2026`

| # | Domain | URL | Title | Yaklaşık kelime | Format | Öne çıkan H2'ler |
|---|--------|-----|-------|-----------------|--------|------------------|
| 1 | paperpal.com | https://paperpal.com/blog/news-updates/ai-summarizer-tools | 4 Best AI Summarizer Tools in 2026 (Reviewed) | ~2.453 | Karşılaştırma tablosu + numaralı araç listesi + pros/cons + seçim rehberi + dos-and-don'ts + FAQ | Top 4 AI Summarizer Tools Compared · 1. Paperpal · 2. Scholarcy · 3. Wordtune · 4. SciSpace · How to Choose the Right AI Summarizer · Using AI Summarizing Tools: Dos and Don'ts · Frequently Asked Questions |
| 2 | smallppt.com | https://smallppt.com/blog/ai-tools/best-ai-summary-tools | 5 Best AI Summary Tools of 2026 | ~1.793 | Liste (H2 = araç adları) + karşılaştırma tablosu + kapanış | Smallppt · QuillBot · AskYourPDF · Linnk.ai · Sharly · Comprehensive Comparison of AI Summary Tools (2026) · Final Thoughts · More on this topic · Create stunning presentations with AI in minutes |
| 3 | sembly.ai | https://www.sembly.ai/blog/best-ai-document-article-summarizers/ | 11 Best AI Document & Article Summarizers in 2026 | ~2.687 | Uzun liste (11 araç) + 6 sütunlu tablo + kavramsal bölüm + FAQ | How AI Summarization for Document & Article Works · Choosing the Right AI Summarizer: What Matters Most? · 11 Best AI Document Summarizers You Can Rely on in 2026 · AI Summarization vs. Human Summarization for Documents & Articles · Generate Summaries and Grasp Key Points with Semblian · FAQs · You might also like · Related articles |
| 4 | jotform.com | https://www.jotform.com/ai/best-ai-summarizer/ | The 8 best AI PDF summarizer tools in 2026 | ~5.972 | En uzun listicle + **test/seçim metodolojisi H2'si** + fiyat tablosu + tool alt başlıkları (H3) | The 8 best AI summarizer tools · How this list was tested and selected · 8 best AI summarizers in 2026: A quick comparison · The 8 best AI summarizers in 2026 · AI summarizers that work the way you read |
| 5 | airbyte.com | https://airbyte.com/agentic-data/best-ai-summarizer-tools | 9 Best AI Summarizer Tools for Business in 2026 | ~3.248 | TL;DR + karşılaştırma tablosu + tool alt başlıkları + soru-cevap + CTA | TL;DR · What are the best AI summarizer tools for business action in 2026? · How these AI summarizer tools compare · Why Airbyte Agents is the right foundation for cross-system summarization · Frequently Asked Questions · Try Airbyte Agents · Build with Airbyte |

**Fetch notları:** 5/5 doğrudan indi, FETCH OK.

### Eksik H2 fırsatları (Summify aksiyonları)

- **`Fiyat & ücretsiz plan` H2 — 0/5** (jotform ve paperpal bunu tabloya gömdü, H2 yapmadı). → **"Best free AI summarizers (and what the free tier actually limits)" H2** — "free" uzantılı aramaları da yakalar.
- **`Gizlilik / veriler eğitimde kullanılıyor mu` H2 — 0/5.** Sadece paperpal'ın seçim rehberinde tek madde ("Privacy: prioritize enterprise-grade data security"). → **Ayrı H2 + tabloya "Data privacy" sütunu ekleyen tek sayfa Summify olsun.**
- **`Limitler (kelime/dosya/sayfa)` H2 — 0/5; tablo sütunu olarak da yok** (jotform tablosunda "input method" var ama limit yok). → **"Input limits compared" H2 + tablo.**
- **`Kullanım adımları` H2 — 0/5** (listicle formatı bunu hiç içermiyor). → Summify sayfasında **"How it works in 3 steps" H2** + ürün ekran görüntüsü, listicle denizinde ayrışır.
- **`Hangisi ne için iyi? — iş/akademik/eğitim ayrımı` H2 — 1/5 (paperpal "How to Choose").** sembly bunu H2 yaptı ("Choosing the Right AI Summarizer"). → **"Best by use case: students, researchers, legal, business" H2 matrisi.**
- **`Test methodology` H2 — 1/5 (jotform "How this list was tested").** airbyte'da versiyon/tarih notu var ama H2 değil. → **"How we tested + last updated date" H2** (2026 kelimesinde tazelik sinyali kritik).
- **`Kullanıcı yorumu / puan` H2 — 0/5.**
- **`Alternatifler tablosu` var (5/5'te tablo mevcut), ancak `Toplam maliyet / gizlilik / limit` sütunları tabloda yok.** → Summify tablosuna **3 ek sütun (Free limit, Privacy, Max input)** ekleyerek geride kalanların önüne geç.

---

## İçgörü

### Kelime başına uzunluk aralığı (ilk 5, sayfa geneli)

| Kelime | Min | Medyan | Max | Baskın uzunluk |
|--------|-----|--------|-----|----------------|
| `pdf summarizer` | 496 (pdf-summarizer.com) | 1.014 (rewind.ai) | 2.065 (adobe.com) | **500–2.000 kelime** — kısa araç landing page'leri |
| `contract summary` | 391 (Broward PDF) | 1.063 (WA DES) | 1.666 (CMS) | **400–1.700 kelime** — ama hiçbiri içerik pazarlığı değil |
| `notebooklm alternatives` | 780 (notebooktoolkit) | 3.205 (atlas) | 7.544 (toolworthy) | **1.700–7.500 kelime, 3/5'i 3.000+** — uzun listicle baskın |
| `best ai summarizer tools 2026` | 1.793 (smallppt) | 2.687 (sembly) | 5.972 (jotform) | **1.800–3.300 kelime, Jotform 5.972 ile outlier** |

### Baskın formatlar

- **`pdf summarizer` → aracı tanıtan (tool landing) + FAQ.** İlk 5'in 5'i de tek ürün sayfası; karşılaştırma/liste formatı yok. H2 sayısı çok düşük (1–5 arası). FAQ + "3 adımda" en sık yapı.
- **`contract summary` → devlet belgesi/formu.** İlk 5'in 5'i kamuya ait (2 PDF form, 2 veri sayfası, 1 mevzuat indeksi). Format: form alanları, indirme listeleri. **Hiçbirinde pazarlama içeriği, H2'li anlatı veya FAQ yok.**
- **`notebooklm alternatives` → karşılaştırma tablosu + numaralı liste + FAQ.** 4/5'te puanlı karşılaştırma tablosu var; 3/5'te FAQ H2'si. Baskın yapı: *"Neden bırakılır"* girişi → *"Top N"* tablo → araç başına H2/H3 inceleme → *"Nasıl seçilir"* → FAQ.
- **`best ai summarizer tools 2026` → liste + karşılaştırma tablosu.** 5/5'te tablo var, 3/5'te FAQ var. Baskın yapı: *"Top N hızlı liste"* → *"karşılaştırma tablosu"* → araç başına inceleme (H2 veya H3) → *"Nasıl seçilir"* → FAQ/CTA.

### Ortak H2 kalıpları (4 kelime genelinde)

| H2 konusu | pdf summarizer | contract summary | notebooklm alt. | ai summarizer 2026 |
|---|---|---|---|---|
| Karşılaştırma tablosu (H2 olarak) | 0/5 | 0/5 | 3/5 | 3/5 |
| Araç başına H2 inceleme | 0/5 | 0/5 | 4/5 | 3/5 |
| "Nasıl seçilir" rehberi | 0/5 | 0/5 | 2/5 | 2/5 |
| Kullanım adımları ("in 3 steps") | 2/5 | 0/5 | 0/5 | 0/5 |
| SSS / FAQ | 5/5 | 0/5 | 3/5 | 3/5 |
| **Fiyat / plan H2** | **0/5** | **0/5** | **0/5** | **0/5** |
| **Gizlilik / veri H2** | **0/5** | **0/5** | **1/5** | **0/5** |
| **Limitler (sayfa/kelime/MB) H2** | **0/5** | **0/5** | **0/5** | **0/5** |
| **Kullanıcı yorumu / puan H2** | **0/5** | **0/5** | **0/5** | **0/5** |
| **Alternatifler / rakip tablosu H2** | **0/5** | **0/5** | 0/5 (tablo var, H2 farklı ad) | 0/5 (tablo var, H2 farklı ad) |
| **Test / değerlendirme metodolojisi H2** | 0/5 | 0/5 | 1/5 | 1/5 |

### Stratejik çıkarım (Summify için)

1. **Dört kelimenin ortak boşluğu:** fiyat, gizlilik, limitler ve kullanıcı yorumu — **hiçbir rakipte H2 olarak yok.** Summify bu dördünü H2 olarak yayınlarsa, içerik uzunluğu rekabetin gerisinde kalsa bile yapısal olarak ayrışır ve People-Also-Ask / snippet adayları üretir.
2. **`pdf summarizer` kısa sayfa istiyor (500–2.000 kelime)** ama **listicle formatında hiç rakip yok** — "Best PDF summarizer tools" bölümü bu kelime için düşük rekabetli bir genişleme.
3. **`contract summary` ilk 5'i tamamen kamuya ait belge.** Ticari bir sayfanın bu SERP'e girmesi için tek şart: **tanım + örnek + AI ile adımlar** içeren, devlet formlarının yapamadığı işi yapan bir sayfa. Rekabet burada yapısal olarak yok, otoriteye dayalı.
4. **`notebooklm alternatives` ve `best ai summarizer tools 2026` uzunluk + tablo + FAQ zorunlu.** 3.000 kelimenin altına inen tek sayfa (notebooktoolkit, 780) 4. sırada; ilk 2'nin ikisi de 2.400+ ve puanlı tablo içeriyor. → **Hedef uzunluk 2.500–4.000 kelime, en az 1 puanlı karşılaştırma tablosu, 6+ soruluk FAQ.**
5. **`notebooklm alternatives` içinde sesli özet (Audio Overview) alternatifi hiçbir H2'de işlenmiyor** — Summify'ın podcast/özet ses özelliği için doğrudan boşluk.

---

## Rakip İlk 5 — `contract summary ai` (2026-09)

> **Kaynak & yöntem (bu iki bölüme özel):** Kelime `websearch` ile ayrı ayrı arandı (İngilizce, US odaklı). İlk 5 organik sonuç **aynı HTML pipeline'ıyla** indirildi (`<script>/<style>/<!-- -->` strip → etiket strip → boşluk normalize → token sayma; H2'ler `<h2>` etiketinden). `webfetch` bu bölümlerde SERP çapraz kontrolü için kullanıldı. **Dikkat:** `websearch` aynı kelimeyi ikinci kez aradığımızda farklı sonuç seti/sıra döndürdü; stabiliteyi ölçmek için bağımsız bir HTML SERP (DuckDuckGo) ile çapraz kontrol yapıldı ve **iki kaynak örtüşmedi** (tek ortak domain: docs.oracle.com). Bu yüzden **sıra numaraları yaklaşıktır**, kesin Google rank'ı değildir.

> **SERP karakteri:** `contract summary` kelimesinden tamamen farklı — **ilk 5'in 5'i de ticari.** Devlet formu/veri sayfası yok: 4'ü AI aracı landing page'i, 1'i Oracle ürün dokümantasyonu. Hepsi kısa (298–1.637 kelime) ve "araç tanıtımı + adım + FAQ" kalıbında; blog/rehber formatı ilk 5'te hiç yok.

| # | Domain | URL | Title | Yaklaşık kelime | Format (+ hedef kelime çıkarımı) | Öne çıkan H2'ler |
|---|--------|-----|-------|-----------------|--------|------------------|
| 1 | esign.ai | https://www.esign.ai/features/ai-summarizer | Extract Key Clauses from Long Contracts with AI \| eSign.AI | ~1.637 | Ürün özellikleri sayfası + fiyat tablosu + müşteri vakaları + FAQ · Hedef: `ai contract summary` | What is AI Contract and Agreement Summaries? · A faster way to understand long contracts · Feature value · Typical business scenarios · Customer Cases · **Simple Pricing, Clear Plans** · AI Contract and Agreement Summaries FAQ · See how this feature fits your business scenario |
| 2 | products.contractize.ai | https://products.contractize.ai/ai-contract-summarizer | Contractize - AI Contract Generator | ~298 | Kısa araç landing (JS ağırlıklı) · Hedef: `ai contract summarizer` | Overview · Why AI Contract Summarizer? · How to summarize a contract in 3 easy steps: · Perfect for · Start summarizing contracts with AI |
| 3 | theresearcher.ai | https://theresearcher.ai/tools/contract-summarizer | Summarize a Contract Instantly - Free AI Contract Summarizer \| TheResearcher.ai | ~492 | Araç landing + özellik listesi + FAQ · Hedef: `contract summarizer / summarize a contract` | Summarize a Contract in Seconds with AI Features · How to Use Our Summarize a Contract in Seconds with AI · Summarize a Contract in Seconds with AI Use Cases · Frequently Asked Questions · Best For · Related Articles · Ready to Try… · Related Tools |
| 4 | docs.oracle.com | https://docs.oracle.com/en/cloud/saas/sales/fascc/generate-contract-summarization.html | Generate Contract Summarization | ~537 | Ürün dokümantasyonu (SaaS CRM) · Hedef: `contract summarization AI` (informational) | Generate Contract Summary Using AI Agent *(tek H2)* |
| 5 | eudoxic.ai | https://eudoxic.ai/tools/contract-summary | Contract Summary Generator · Free Online Tool · Eudoxic | ~663 | Araç landing + kullanım senaryoları + FAQ · Hedef: `ai contract summary generator` | How It Works · Generate a Contract Summary Your Team Can Actually Read · Frequently Asked Questions |

**Gözlem (H2 denetimi, 5 sayfa):** İlk 5'te **`gizlilik`, `limit`, `kullanıcı yorumu` ve `test/metodolojisi` H2'lerinin dördü de 0/5**; `fiyat` H2'si yalnızca 1/5'te var (eSign.AI "Simple Pricing, Clear Plans": Trial ücretsiz · Basic **US$24,9/ay** · Professional). Yani rakiplerin tamamı "aracı anlatıyor", kimsenin "plan/limit/gizlilik" sorusuna H2 ile cevabı yok. FAQ H2 3/5, "kullanım adımları" H2 2/5 (Contractize "3 easy steps", TheResearcher "How to Use").

**Fetch notları:** 5/5 FETCH OK (ham HTML indirildi; kelime/H2 aynı pipeline'dan çıkarıldı).

**Çapraz kontrol (DuckDuckGo HTML, aynı kelime):** 1. `docs.oracle.com/…/scm/25d/proc25d/25D-procurement-wn-f39824.htm` · 2. `harvey.ai/blog/ai-contract-summary` · 3. `legly.io` · 4. `apps365.com/blog/ai-contract-summary/` · 5. `summize.com/clm-hub/contract-summaries`. Çekilenler: harvey.ai **3.642 kelime** (H1: "What Makes an AI Contract Summary Decision-Ready?"), apps365 **3.420 kelime** (H1: "AI Contract Summary: What Every Business Should Know [2026]"), summize **1.681 kelime** → 3/3 FETCH OK; **`legly.io` bu turda çekilmedi (veri yok, uydurulmadı)**. Bu üçü **içerik/rehber tabakası** ve üçünde de `fiyat/gizlilik/limit/yorum/metodolojisi` H2'si yok.

### Eksik H2 fırsatları (Summify aksiyonları)

- **`Fiyat & ücretsiz plan limitleri` H2 — 1/5.** Tek örnek eSign.AI'ın fiyat tablosu; eudoxic/theresearcher "ücretsiz" iddiasını sadece H1/metne gömüyor, plan/limit H2'si açmıyor. → **"Free vs Pro: limits & price" H2 + tablo** bu SERP'te hâlâ düşük rekabetli.
- **`Gizlilik: sözleşmen nereye gidiyor?` H2 — 0/5.** "Privacy/GDPR" sadece nav-footer'da. → **"Your contract is deleted after X min / never used for training" H2 + GDPR rozeti**, hukuki doküman yükleyen kullanıcı için birincil karar kriteri ve tamamen boş.
- **`Limitler (dosya boyutu, sayfa, karakter)` H2 — 0/5.** → **"Supported formats, size & page limits" H2 + tablo** (PDF/DOCX · MB · sayfa · karakter).
- **`Kullanıcı yorumu / puan` H2 — 0/5.** eSign.AI'daki "Customer Cases" vaka anlatımı (Canada Goose, CUHK) — puan/yorum metni yok. → **"What users say" H2 + AggregateRating schema** ilk kez Summify'da.
- **`Test / değerlendirme metodolojisi` H2 — 0/5.** → **"How we built & tested this mode" H2** E-E-A-T için hiçbir rakipte yok.
- **`Örnek sözleşme özeti (redacted NDA)` H2 — 0/5.** Tüm rakipler "yapabilirsin" diyor, **hiçbiri gerçek çıktı örneğini göstermiyor** → örnek çıktı bloğu + ekran görüntüsü en güçlü ayrışma.
- **`Rehber/blog formatı ilk 5'te websearch setinde yok`** (yalnız çapraz kontrol setinde). → Araç sayfasının yanına **"How to Create a Contract Summary With AI (2026)" rehberi**, hem araç hem içerik tabakasını hedefler.

---

## Rakip İlk 5 — `ai contract summary` (2026-09)

> **Kaynak & yöntem:** Aynı yöntem (ayrı `websearch` sorgusu + aynı HTML pipeline). Bu kelime için de `websearch` tekrar çalıştırmasında sıra/set değişti; çapraz kontrol DuckDuckGo ile yapıldı.

> **SERP karakteri:** Yine **tamamen ticari** — 4'ü AI araç landing page'i, 1'i Oracle ürün dokümantasyonu. Hiçbirinde devlet belgesi, forum, rehber veya karşılaştırma listesi yok. Tek fark, birinci kelimeye kıyasla **fynk'ın çok H2'li, uzun bir ürün özellikleri sayfası** olması.

| # | Domain | URL | Title | Yaklaşık kelime | Format (+ hedef kelime çıkarımı) | Öne çıkan H2'ler |
|---|--------|-----|-------|-----------------|--------|------------------|
| 1 | products.contractize.ai | https://products.contractize.ai/ai-contract-summarizer | Contractize - AI Contract Generator | ~298 | Kısa araç landing (JS ağırlıklı) · Hedef: `ai contract summarizer` | Overview · Why AI Contract Summarizer? · How to summarize a contract in 3 easy steps: · Perfect for · Start summarizing contracts with AI |
| 2 | fynk.com | https://fynk.com/en/features/ai-summary/ | AI summary \| fynk | ~1.318 | Ürün özellikleri sayfası + çok H2 + müşteri istatistik CTA + FAQ · Hedef: `ai contract summary` (feature page) | Get to the point of every contract. Fast. · Summaries you can trust. · Easy-to-read · Faster reviews · Understand any document, in a minute. · No surprises · Less reading, more insights. · Yes, we actually read the contract. · Customers like you love fynk. · Real impact. Whichever team you're on. · More product features to explore. · Frequently asked questions. |
| 3 | docs.oracle.com | https://docs.oracle.com/en/cloud/saas/readiness/sales/25d/sfau-25d/25D-sf-automation-wn-f39824.htm | Generate Contract Summary Using AI Agent | ~1.329 | Sürüm notu/dokümantasyon (Sales 25D) · Hedef: `contract summary using AI` (informational) | Steps to enable and configure · Access requirements |
| 4 | theresearcher.ai | https://theresearcher.ai/tools/contract-summarizer | Summarize a Contract Instantly - Free AI Contract Summarizer \| TheResearcher.ai | ~492 | Araç landing + özellik listesi + FAQ · Hedef: `contract summarizer / summarize a contract` | Summarize a Contract in Seconds with AI Features · How to Use Our Summarize a Contract in Seconds with AI · Summarize a Contract in Seconds with AI Use Cases · Frequently Asked Questions · Best For · Related Articles · Ready to Try… · Related Tools |
| 5 | esign.ai | https://www.esign.ai/features/ai-summarizer | Extract Key Clauses from Long Contracts with AI \| eSign.AI | ~1.637 | Ürün özellikleri sayfası + fiyat tablosu + müşteri vakaları + FAQ · Hedef: `ai contract summary` | What is AI Contract and Agreement Summaries? · A faster way to understand long contracts · Feature value · Typical business scenarios · Customer Cases · **Simple Pricing, Clear Plans** · AI Contract and Agreement Summaries FAQ · See how this feature fits your business scenario |

**Gözlem (H2 denetimi, 5 sayfa):** Yine **`gizlilik` 0/5, `limit` 0/5, `kullanıcı yorumu` 0/5, `test/metodolojisi` 0/5**; `fiyat` H2'si 1/5 (sadece eSign.AI). fynk'ın "Customers like you love fynk." H2'si testimonial sandığı kadar güçlü değil — içeriği tek satırlık *"See all customer stories"* CTA'sı, **sayfada yorum metni/puan yok**. FAQ H2 3/5 (Contractize ve Oracle dokümanı hariç), "kullanım adımları" H2 2/5.

**Fetch notları:** 5/5 FETCH OK. **Domain bazlı örtüşme: 4/5** (Contractize, TheResearcher, eSign.AI + Oracle aynı domain), **birebir URL örtüşme: 3/5**. Oracle'daki iki URL aynı dokümanın iki sürümü (Sales FASCC vs Sales 25D readiness), içerik aynı: "Generate Contract Summary Using AI Agent".

**Çapraz kontrol (DuckDuckGo HTML, aynı kelime):** 1. `docs.oracle.com/…/proc25d/…` (**bu sürüm çekilmedi**) · 2. `aipass.one/apps/contract-summary` (FETCH OK ama JS shell → 86 kelime, H2 yok) · 3. `harvey.ai/blog/ai-contract-summary` (3.642 k) · 4. `summize.com/clm-hub/contract-summaries` (1.681 k) · 5. `apps365.com/blog/ai-contract-summary/` (3.420 k) — 4/5 çekildi.

### Eksik H2 fırsatları (Summify aksiyonları)

- **`Fiyat & plan` H2 — 1/5** (eSign.AI). fynk "Pricing"ı sadece nav'da tutuyor. → **Fiyat + limit H2'si** yine boş.
- **`Gizlilik / veri işleme` H2 — 0/5.** fynk footer'da "Security & GDPR" linki veriyor, H2 değil. → **Ayrı H2 + DPA/SOC2 satırı**.
- **`Limit` H2 — 0/5.** → **Format/boyut/sayfa limiti tablosu**.
- **`Kullanıcı yorumu / puan` H2 — 0/5** (fynk'ın testimonial başlığı CTA, yorum değil).
- **`Test metodolojisi` H2 — 0/5.**
- **`Karşılaştırma: Summify vs Contractize vs eSign vs fynk` H2 — 0/5.** İlk 5'te **tek bir "vs/alternatif" sayfası yok**; hepsi tek ürün sayfası. → **"Summify vs [bu 4'ü]" karşılaştırma tablosu** bu SERP'in yapısında tamamen rakipsiz.
- **`AI contract summary nedir (tanım)` H2 — 1/5** (yalnız eSign.AI "What is AI Contract and Agreement Summaries?"); diğer 4'ünde tanım H2'si yok (uygulama sayfaları direkt özelliğe giriyor). → **Tanım + örnek + adım üçlüsü** ana H2 olmalı.

---

## Bu iki kelime için içerik boşluğu

**1. Devlet formuna giden sonuç var mı?** **Hayır — 0/10.** `contract summary` kelimesinin ilk 5'i tamamen devlet belgesiyken (2 PDF form + 3 veri/mevzuat sayfası), bu iki kelimenin ilk 5'inde **tek bir .gov sonucu yok**. Yerini alan tek "non-pazarlama" sonuç **Oracle ürün dokümantasyonu** (her iki SERP'te 1/5, iki farklı URL). Yani niyet **büyüklük oranında ticari**: kullanıcı araç arıyor, belge değil.

**2. Ticari niyet var mı?** **Evet, 5/5 — ama dar.** Tüm ticari sonuçlar tek tip: "aracı tanıtan kısa landing page + FAQ" (298–1.637 kelime). **Hiçbirinde fiyat/limit/gizlilik H2'si yok** (fiyat 1/5), karşılaştırma tablosu yok, test metodolojisi yok, kullanıcı yorumu yok. Uzun-format **rehber/içerik tabakası ilk 5'te görünmüyor** — ancak çapraz kontrol setinde harvey.ai (3.642 k) ve apps365 (3.420 k) gibi 3.400+ kelimelik rehberler var; yani Google bu sorgularda **"araç" ve "rehber" tabakasını ayrı ayrı sıralıyor** ve ilk 5'in hangi tabakadan geleceği sorgu biçimine göre değişiyor (SERP oynak).

**3. İki kelime ayrı sayfa mı istiyor?** **Hayır.** İki SERP'in **5 sonucun 4'ü aynı domain**, 3'ü birebir aynı URL; farklılık tek sırada (`contract summary ai` → Eudoxic, `ai contract summary` → fynk). → **Tek sayfa iki kelimeyi de hedeflemeli**; H1'de biri, ilk H2'de/description'da diğeri geçsin. İki ayrı sayfa yayınlamak kanibalizasyon riski yaratır.

**4. Rekabetin yapısal zayıflığı (0/5 olan H2'ler):**

| H2 konusu | `contract summary ai` | `ai contract summary` |
|---|---|---|
| Fiyat / plan H2 | **1/5** (eSign.AI) | **1/5** (eSign.AI) |
| Gizlilik / veri H2 | **0/5** | **0/5** |
| Limit (boyut/sayfa/karakter) H2 | **0/5** | **0/5** |
| Kullanıcı yorumu / puan H2 | **0/5** | **0/5** |
| Test / metodoloji H2 | **0/5** | **0/5** |
| Karşılaştırma / "vs" H2 | **0/5** | **0/5** |
| FAQ H2 | 3/5 | 3/5 |
| Kullanım adımları H2 | 2/5 | 2/5 |

**5. Summify için yapısal avantaj:**

- **İndeksleme sorunu yok, derinlik sorunu var:** `www.summify.app/modes/contract-analyzer` (H1: "AI Contract Summary — Clauses & Obligations") bu kelimelerden birinde `websearch` çalıştırmasında **2. sırada** göründü. Yani sayfa zaten SERP'in içinde; ilk 5 kalıcı hale gelmek için **içerik derinliği + eksik H2'ler** gerekiyor.
- **Sayfa şu an 369 kelime** — ilk 5'teki 4 rakibin altında. H2'leri: `Use cases · Workflow · Example outputs · Run Contract Summary on your next document` → **fiyat, gizlilik, limit, kullanıcı yorumu, test metodolojisi H2'lerinin hiçbiri yok** (aynı 0/5 hastalığı).
- **→ Yapılacak (aynı URL içinde, yeni sayfa açmadan):** 1.200–1.800 kelimeye çıkar ve şu H2'leri ekle: `Free vs Pro: limits & price` · `Your contract is deleted after X minutes — never used for training` · `Supported formats, size & page limits` · `Example contract summary (redacted NDA)` · `How we tested this mode` · `Summify vs Contractize vs eSign.AI vs fynk` (karşılaştırma tablosu). **Bu altı H2'nin hiçbiri ilk 10 sonuçta yok.**
- **Ek avantaj:** Rakiplerin hiçbiri "not legal advice" uyarısını **H2 olarak** yapmıyor (hepsi metin/FAQ içinde). Summify'ın mevcut disclaimer'ını H2'ye taşımak hem güven hem E-E-A-T için ilk yapan taraf olmak demek.
- **Ek avantaj 2 — konumlandırma:** İlk 5'teki rakiplerin çoğu özeti **yan özellik** olarak sunuyor: eSign.AI = e-imza platformu, fynk = CLM/imzalama, Oracle = CRM sürüm notu, Contractize = AI contract generator. Özeti **tek başına ürün** olarak sunanlar TheResearcher ve Eudoxic (yalnız `contract summary ai` setinde). **Düzeltme/limit:** Contractize ve TheResearcher **hem yükleme hem yapıştırma** destekliyor → "upload" tek başına farklılaştırıcı **değil**; asıl farklılaştırıcı `Example outputs` H2'si (hiçbir rakipte gerçek çıktı örneği yok), çok formatlılık (PDF · DOCX · Web) ve lens/workspace yapısı.
