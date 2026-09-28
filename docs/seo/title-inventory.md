# Summify — SEO Title Inventory (Index'li Sayfalar)

> Üretim tarihi: 2026-09-27 · Kaynak: repo statik taraması (runtime değil)
> Tüm URL'ler site köküne göre path olarak verilmiştir → base: `https://www.summify.app`

## 0. Yöntem & Kurallar (kodda doğrulandı)

| Kural | Kaynak |
|---|---|
| Title `buildPageMetadata()` → `title.absolute`; marka eki ` \| Summify` **yalnızca title "Summify" içermiyorsa** eklenir | `src/lib/seo.ts:72-76, 143-184` |
| `createPageMetadata()` her zaman ` \| Summify` ekler (dashboard/auth) | `src/lib/metadata.ts:19-30` |
| Blog title'ı: `override > seoTitle > post.title`; **>55 karakterse 52'ye kesilir + `…`**, sonra ` \| Summify` | `src/lib/seo.ts:186-210` |
| Sitemap kaynakları: `CORE_STATIC_PATHS`, `FORMAT_PATHS`, `AUDIO_STUDY_PATHS`, `SEGMENT_PATHS`, 6 core mode id, 7 blog kategorisi, 5 guide, 4 compare, 4 use-case + tüm public blog postları | `src/lib/sitemap/build-sitemap.ts:23-100, 147-167` |
| Sitemap'te **yok**: `/login`, `/account`, `/dashboard*`, `/contact`, `/status`, `/launch`, `/billing/*`, `/share/*` | aynı dosya |
| `robots.txt` disallow: `/api/`, `/auth/`, `/login`, `/account`, `/dashboard(/)`, `/billing/`, `/share/` | `src/app/robots.ts:33-42` |
| Layout title template: `%s \| Summify` (sadece string title'larda devreye girer) | `src/app/layout.tsx:52-55` |
| H1 kaynağı: `PublicHero`/`FormatLandingTemplate` → hero `title` prop'u; blog/guide/compare/use-case layout'ları; `HomeHero`, `ModeDetailSections.modeHeroTitle()` | ilgili bileşenler |
| **Statik blog post = 18 adet** (`BLOG_POSTS` 8 + `AUDIO_STUDY_BLOG_POSTS` 10). Ekstra CMS postları Supabase `cms_blog_posts` tablosunda → repoda listelenemez. | `src/data/blog-posts.ts:33-467`, `src/lib/blog/resolvePost.ts:20-31` |

---

## 1. Çekirdek + Money SEO + Persona yüzeyleri

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/` | Free AI Summarizer — PDF, PowerPoint, YouTube & Articles \| Summify | 66 | Free AI summarizer for PDFs, decks & videos. | ai summarizer / free ai summarizer (informational → transactional) |
| `/upload` | AI Summarizer Workspace — Upload PDF, Link or Text \| Summify | 60 | Add a source | ai summarizer workspace, upload pdf summarize (transactional) |
| `/pricing` | Summify Pricing — Free & Pro Plans | 34 | Plans for every workflow | summify pricing, ai tool pricing (transactional) |
| `/faq` | FAQ — AI Summarizer, Formats, Privacy & Study Tools \| Summify | 61 | Common questions | ai summarizer faq (informational) |
| `/login` | Sign In \| Summify | 17 | Sign in to Summify | **NOINDEX** (`pageSeo.login.noindex` + robots disallow) |
| `/account` | Your Account \| Summify | 22 | Your account | **NOINDEX** (`pageSeo.account.noindex` + robots disallow) |
| `/summarize-pdf` | PDF Summarizer — Free AI Summary Online \| Summify | 49 | AI PDF Summarizer — Summarize PDFs Instantly | pdf summarizer, summarize pdf online, ai pdf summarizer (commercial) |
| `/summarize-powerpoint` | PowerPoint Summarizer for PPT & PPTX Decks \| Summify | 52 | PowerPoint summarizer — summarize PPT decks | powerpoint summarizer, pptx summarizer (commercial) |
| `/summarize-youtube-video` | YouTube Video Summarizer AI — Instant Transcript Summary \| Summify | 66 | YouTube summarizer AI — instant transcript summaries | youtube summarizer, summarize youtube video (commercial) |
| `/summarize-docx` | DOCX Summarizer AI — Summarize Word Documents Online \| Summify | 62 | Summarize Word documents with AI document intelligence | docx summarizer, word document summarizer (commercial) |
| `/summarize-web-articles` | Summarize Web Articles Online in Minutes \| Summify | 50 | Summarize web articles online from a URL | summarize web articles online, article summarizer (commercial) |
| `/summarize-mp3` | Podcast & Audio Summarizer — Transcripts to Notes \| Summify | 59 | Summarize audio and podcasts with transcript intelligence | podcast summarizer, audio summarizer (commercial) |
| `/audio-study` | Audio Study Mode — AI Voice Lessons \| Summify | 45 | Audio-first studying for walking, workouts, and passive study time | audio study, AI voice study (commercial) |
| `/for-students` | AI Summarizer for Students — Notes, Flashcards & Quizzes \| Summify | 66 | AI summarizer for students — notes, flashcards & quizzes | ai summarizer for students, exam prep ai (persona) |
| `/for-researchers` | Research Paper Summarizer AI — Literature Review Notes \| Summify | 64 | Literature review from PDFs, preprints, and web articles | research paper summarizer, literature review ai (persona) |
| `/for-creators` | AI Content & Video Summarizer for Creators \| Summify | 52 | Podcast summarizer and YouTube to content ideas | content repurposing ai, youtube summarizer for creators (persona) |
| `/for-teams` | AI Document Summarizer for Teams — Briefs & Decks \| Summify | 59 | Shared document intelligence for reports, decks, and recordings | team document summarizer, executive brief ai (persona) |
| `/for-freelancers` | AI Contract Summary Tool for Freelancers \| Summify | 50 | Client briefs, SOWs, and contracts — first-pass intelligence | contract summary ai, ai contract summary (persona) |

---

## 2. Sitemap'teki diğer core statik landing'ler

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/ios-app` | Summify iOS App: AI Summary & Learn on iPhone | 45 | Summify iOS App: AI Summary & Learn on iPhone | ai summary app for iphone (navigational/commercial) |
| `/adhd-study-tool` | ADHD Study Tool — Digestible AI Lessons & Cards \| Summify | 57 | The AI Study Tool Built for How ADHD Brains Actually Learn | adhd study tool, adhd friendly study ai (informational→commercial) |
| `/study-while-walking` | Study While Walking — AI Audio From Lecture Notes \| Summify | 59 | Turn Your Dead Time Into Study Time | study while walking, audio study commute (informational) |
| `/lecture-note-summarizer` | AI Lecture Note Summarizer — Study Cards & Audio \| Summify | 58 | From Messy Lecture Notes to Structured Study System | lecture note summarizer (commercial) |
| `/research-paper-study-tool` | AI Research Paper Study Tool — Summarize, Learn, and Listen \| Summify | 69 | Research Papers Are Hard. Your Study Tool Shouldn't Be. | research paper study tool (commercial) |
| `/study-podcast-generator` | AI Study Podcast Generator — Any Source to Podcast \| Summify | 60 | Turn Any Study Material Into a Podcast You Actually Want to Listen To | ai study podcast generator (commercial) |
| `/turn-notes-into-podcast` | Turn Notes Into a Podcast — AI Study Discussions \| Summify | 58 | Your Notes, Your Podcast, Your Study Session | notes to podcast, notes into podcast (commercial) |
| `/ai-study-workflow` | AI Study Workflow — Upload, Analyze, Learn, Listen \| Summify | 60 | One Workflow. Every Study Format You Need. | ai study workflow (informational→commercial) |
| `/best-ai-for-studying` | Best AI for Studying 2026 — Summarize, Flashcards & Quizzes \| Summify | 69 | Turn Any Study Material Into a Complete Learning System | best ai for studying (list/commercial) |
| `/pdf-to-podcast` | PDF to Podcast — Turn Documents Into Audio Study Sessions \| Summify | 67 | Turn PDFs into podcast-style learning sessions | pdf to podcast, pdf to audio (commercial) |
| `/ai-note-tool` | AI Note Tool — Structured Notes From Any Source \| Summify | 57 | AI note tool for calm, structured revision | ai note tool, ai study notes (commercial) |
| `/blog` | Blog — AI PDF Summarizer, Study Notes & Tool Guides \| Summify | 61 | AI PDF, YouTube, Learn cards & quiz workflows | blog hub / AI PDF summarizer (hub) |
| `/about` | About Summify — AI Summarizer & Study Workspace | 47 | AI summarizer with a built-in study workspace | brand / about (navigational) |
| `/privacy` | Privacy Policy \| Summify | 24 | Privacy | privacy policy (navigational) |
| `/terms` | Terms of Use \| Summify | 22 | Terms of use | terms of use (navigational) |

---

## 3. Audio-study landing ailesi (AUDIO_STUDY_PATHS → sitemap)

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/pdf-to-audio-study` | PDF to Audio Study — Turn PDFs Into Audio Lessons \| Summify | 59 | Convert PDFs into audio study sessions | pdf to audio study (commercial) |
| `/ai-audio-study-guide` | AI Audio Study Guide — Listen Instead of Rereading \| Summify | 60 | AI audio study guide: listen instead of rereading | ai audio study guide (informational) |
| `/learn-by-listening` | Learn by Listening — AI Audio Study & Podcasts \| Summify | 56 | Learn by Listening | learn by listening, audio learning (informational) |
| `/teacher-style-ai-learning` | Teacher-Style AI Learning — Spoken Lessons From Documents \| Summify | 67 | Teacher-style AI learning from your documents | teacher-style ai learning (informational) |

---

## 4. Modes (`/modes` + 6 core lens — sitemap'te)

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/modes` | AI Summarizer Modes — Study, Executive, Contract & More \| Summify | 65 | 6 intelligence lenses. Four free today. | ai summarizer modes, document intelligence modes (hub) |
| `/modes/general-summary` | AI Document Summarizer — General Summary Mode \| Summify | 55 | AI Document Summarizer — General Summary | document summarizer, ai summarizer (commercial) |
| `/modes/executive-brief` | AI Executive Brief — Decision-Ready Document Summary \| Summify | 61 | AI Executive Brief — Decision-Ready Summary | executive brief, executive summary ai (commercial) |
| `/modes/the-student` | AI Study Notes Mode — Concepts, Flashcards & Quizzes \| Summify | 62 | AI Study Notes — The Student Mode | ai study notes, pdf to study guide (commercial) |
| `/modes/the-creator` | The Creator AI Mode \| Summify | 29 | AI Creator Mode — Hooks, Themes & Beats | creator ai mode, content repurposing (commercial) |
| `/modes/contract-analyzer` | Contract Summary AI for Clauses & Risks \| Summify | 49 | AI Contract Summary — Clauses & Obligations | contract summary ai, ai contract summary (commercial) |
| `/modes/exam-prep` | AI Exam Prep Mode — High-Yield Facts & Test Angles \| Summify | 60 | AI Exam Prep Mode — High-Yield Facts & Test Angles | exam prep ai, study for exams (commercial) |

> Not: mode id'leri `CORE_PRODUCT_LENS_MODE_IDS` = general-summary, executive-brief, the-student, the-creator, contract-analyzer, exam-prep. Diğer mode id'leri `generateStaticParams` dışı → `notFound()` (sadece olmayan id'lerde `noindex` title döner).

---

## 5. Guides (`/guides/[slug]` — 5 slug, sitemap'te)

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/guides/how-to-evaluate-ai-pdf-summarizer` | How to Evaluate an AI PDF Summarizer \| Summify | 47 | How to Evaluate an AI PDF Summarizer | how to evaluate ai pdf summarizer (informational — "nasıl seçilir") — *2026-09-27'de slug değişti, eski slug 301* |
| `/guides/how-to-summarize-youtube-videos-with-ai` | How to Summarize YouTube Videos With AI \| Summify | 49 | How to Summarize YouTube Videos With AI | how to summarize youtube video with ai (informational) |
| `/guides/ai-study-notes-guide` | The Complete Guide to AI Study Notes (2026) \| Summify | 53 | The Complete Guide to AI Study Notes (2026) | ai study notes guide (informational) |
| `/guides/pdf-to-flashcards-workflow` | PDF to Flashcards: A Modern Workflow With AI \| Summify | 54 | PDF to Flashcards: A Modern Workflow With AI | pdf to flashcards (informational) |
| `/guides/contract-summary-ai-guide` | Contract Summary With AI: A Safe First-Pass Workflow \| Summify | 52 | Contract Summary With AI: A Safe First-Pass Workflow | contract summary ai (informational) |

---

## 6. Comparisons (`/compare/[slug]` — 4 slug, sitemap'te)

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/compare/notebooklm` | Best NotebookLM Alternatives 2026 — Summify vs NotebookLM | 57 | Best NotebookLM Alternatives 2026 — Summify vs NotebookLM | notebooklm alternatives (commercial) |
| `/compare/chatpdf` | Summify vs ChatPDF | 18 | Summify vs ChatPDF | summify vs chatpdf (comparison) |
| `/compare/quillbot` | Summify vs QuillBot | 19 | Summify vs QuillBot | summify vs quillbot (comparison) |
| `/compare/notta` | Summify vs Notta | 16 | Summify vs Notta | summify vs notta (comparison) |

> 4 title da "Summify" içerdiği için marka eki **eklenmiyor**.

---

## 7. Use cases (`/use-cases/[slug]` — 4 slug, sitemap'te)

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/use-cases/research-papers-students` | Research papers for students \| Summify | 38 | Research papers for students | research papers for students (informational→commercial) |
| `/use-cases/contracts-freelancers` | Contracts for freelancers \| Summify | 35 | Contracts for freelancers | contract summary ai for freelancers (commercial) |
| `/use-cases/podcasts-creators` | Podcasts for creators \| Summify | 31 | Podcasts for creators | podcast summarizer for creators (commercial) |
| `/use-cases/reports-teams` | Reports for teams \| Summify | 27 | Reports for teams | report summarizer for teams (commercial) |

---

## 8. Blog index + kategoriler

| URL | Title (tam metin) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/blog` | Blog — AI PDF Summarizer, Study Notes & Tool Guides \| Summify | 61 | AI PDF, YouTube, Learn cards & quiz workflows | blog hub |
| `/blog/category/pdf-workflows` | PDF Workflows — AI Summaries, Learn Cards & Quizzes \| Summify | 61 | PDF Workflows | ai pdf summarizer (hub) |
| `/blog/category/youtube-summaries` | YouTube Summaries — Video to Study Notes & Learn Cards \| Summify | 64 | YouTube Summaries | ai youtube summarizer (hub) |
| `/blog/category/study-learning` | Study & Learning — AI Study Notes, Learn Cards & Quizzes \| Summify | 66 | Study & Learning | ai study notes (hub) |
| `/blog/category/ai-research` | AI Research — Paper Summaries & Literature Workflows \| Summify | 62 | AI Research | research paper summarizer (hub) |
| `/blog/category/pptx-documents` | PPTX & Documents — Deck & Office Summarization \| Summify | 56 | PPTX & Documents | powerpoint summarizer (hub) |
| `/blog/category/comparisons` | Comparisons — AI PDF & Document Summarizer Guides \| Summify | 59 | Comparisons | best ai pdf summarizer (hub) |
| `/blog/category/productivity` | Productivity — Document Intelligence for Knowledge Work \| Summify | 66 | Productivity | document intelligence (hub) |

---

## 9. Blog postları — `/blog/[slug]` (statik: 18 adet, sitemap'e `getAllPublicBlogPosts()` ile giriyor)

| URL | Title (tam metin, SERP'e gelen hâli) | Karakter | H1 | Hedef kelime (niyet) |
|---|---|---|---|---|
| `/blog/how-to-summarize-a-pdf-with-ai` | How to Summarize a PDF with AI (Without Losing accur… \| Summify | 63 | How to Summarize a PDF with AI (Without Losing Accuracy) | how to summarize a PDF with AI (informational) — **title 56 > 55 → kesildi** |
| `/blog/summarize-powerpoint-decks-with-ai` | Summarize PowerPoint Decks with AI \| Summify | 44 | Summarize PowerPoint Decks with AI | summarize PowerPoint with AI / PowerPoint summarizer (informational) |
| `/blog/pdf-summary-generator-vs-manual-notes` | PDF Summary Generator vs Manual Notes \| Summify | 47 | PDF Summary Generator vs Manual Notes | PDF summary generator (informational) |
| `/blog/best-ai-pdf-summarizers-2026` | Best AI PDF Summarizer Tools in 2026 \| Summify | 46 | Best AI PDF Summarizer Tools in 2026 | best AI PDF summarizer (list/commercial) — `BLOG_SERP_OVERRIDES` + H1 override |
| `/blog/youtube-videos-into-study-notes` | How to Turn YouTube Videos Into Study Notes \| Summify | 53 | How to Turn YouTube Videos Into Study Notes | YouTube video to study notes (informational) |
| `/blog/students-ai-summarizers-exam-prep` | How Students Use AI Summarizers for Exam Prep \| Summify | 55 | How Students Use AI Summarizers for Exam Prep | AI study notes exam prep (informational) |
| `/blog/ai-study-notes-guide` | AI Study Notes: A Practical Starter Guide \| Summify | 51 | AI Study Notes: A Practical Starter Guide | AI study notes guide (informational) |
| `/blog/pdf-to-flashcards-workflow` | PDF to Flashcards: A Quick Workflow \| Summify | 45 | PDF to Flashcards: A Quick Workflow | PDF to flashcards (informational) |
| `/blog/best-ai-audio-study-tools-2026` | Best AI Audio Study Tools in 2026 \| Summify | 43 | Best AI Audio Study Tools in 2026 | best AI audio study tools (list/commercial) |
| `/blog/how-to-turn-pdfs-into-audio-lessons` | How to Turn PDFs Into Audio Lessons \| Summify | 45 | How to Turn PDFs Into Audio Lessons | turn PDF into audio (informational) |
| `/blog/learn-while-walking-ai-voice-study` | Learn While Walking Using AI Voice Study \| Summify | 50 | Learn While Walking Using AI Voice Study | learn while walking (informational) |
| `/blog/ai-study-companion-workflows` | AI Study Companion Workflows \| Summify | 38 | AI Study Companion Workflows | AI study companion (informational) |
| `/blog/summary-quiz-to-audio-learning` | From Summary to Quiz to Audio Learning \| Summify | 48 | From Summary to Quiz to Audio Learning | summary quiz audio / AI study workflow (informational) |
| `/blog/audio-learning-vs-rereading` | Audio Learning vs Rereading: What Works Better? \| Summify | 57 | Audio Learning vs Rereading: What Works Better? | audio learning vs rereading (informational) |
| `/blog/passive-learning-with-ai` | Passive Learning With AI (Without Foolish Passive Li… \| Summify | 63 | Passive Learning With AI (Without Foolish Passive Listening) | passive learning AI (informational) — **title 60 > 55 → kesildi** |
| `/blog/ai-teacher-voice-research-papers` | AI Teacher Voice for Research Papers \| Summify | 46 | AI Teacher Voice for Research Papers | AI teacher voice research (informational) |
| `/blog/lecture-notes-to-spoken-lessons` | Turn Lecture Notes Into Spoken Lessons \| Summify | 48 | Turn Lecture Notes Into Spoken Lessons | lecture notes to audio (informational) |
| `/blog/study-with-ai-while-commuting` | Study With AI While Commuting \| Summify | 39 | Study With AI While Commuting | study while commuting (informational) |

### 9b. CMS (Supabase) blog postları — sitemap'e runtime giriyor

| URL | Title | Karakter | H1 | Hedef kelime |
|---|---|---|---|---|
| `/blog/[cms-slug]` (Supabase `cms_blog_posts`, `status=published`) | **BULUNAMADI** — repo'da statik tanım yok; title `seoTitle ?? title` + `buildBlogPostMetadata` ile runtime üretiliyor (`src/server/blog/cmsBlogRepository.ts`, `src/lib/blog/resolvePost.ts:20-31`) | BULUNAMADI | BULUNAMADI (CMS `post.title`) | BULUNAMADI |
| `seo.ts` override'ı olan ama statik postu olmayan slug: `best-ai-tools-for-academic-research` → "Best AI Tool for Academic Research 2026" (51 kr.) | **BULUNAMADI** (yalnızca SERP override'ı var, post CMS'de) | 51 (override) | BULUNAMADI | best AI tool for academic research |

> Sitemap bu postları `getAllPublicBlogPosts()` ile eklediği için **canlı sitemap'teki URL sayısı repodan doğrulanamaz** (18 statik + N CMS).

---

## 10. Auth / App (NOINDEX)

| URL | Title (tam metin) | Karakter | H1 | Not |
|---|---|---|---|---|
| `/dashboard` | Dashboard \| Summify | 19 | `Welcome back, {isim}` (girişli) / `Your intelligence library` (çıkışlı) | **NOINDEX** (`noIndex: true`, `robots.ts` disallow `/dashboard`) |
| `/dashboard/learn` | Learn \| Summify | 15 | Learn | **NOINDEX** (`noIndex: true`, robots disallow) |
| `/dashboard/memory` | Learn \| Summify | 15 | H1 YOK — sayfa `redirect()` ile `/dashboard/learn`'a gidiyor | **NOINDEX** (`noIndex: true`, robots disallow) |
| `/dashboard/[id]` | Saved analysis \| Summify | 24 | dinamik (analiz başlığı) | **NOINDEX** (`noIndex: true`) |
| `/dashboard/admin`, `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]`, `/admin/analytics`, `/admin/api-health` | Admin Dashboard \| Summify / Blog CMS \| Summify / New blog post \| Summify / Edit post {id} \| Summify / Admin Analytics \| Summify / … | — | AdminShell H1 | **NOINDEX** (hepsi `noIndex: true`) |

---

## 11. Sitemap'te OLMAYAN diğer public route'lar (tüm `app/**/page.tsx` tarandı)

| URL | Title (tam metin) | Karakter | H1 | Index durumu |
|---|---|---|---|---|
| `/contact` | Contact Summify \| Support, Feedback & Partnerships \| Summify | 60 | Support, feedback, and partnerships | **INDEX** ama sitemap'te YOK (layout template marka ekliyor → çift `Summify`) |
| `/status` | Status \| Summify | 16 | Service status | NOINDEX (`noIndex: true`) |
| `/launch` | Launch kit \| Summify | 20 | Launch & distribution kit | NOINDEX (`noIndex: true`) |
| `/billing/success` | Billing activated \| Summify | 27 | Billing confirmation received | NOINDEX + robots disallow `/billing/` |
| `/billing/cancel` | Checkout canceled \| Summify | 28 | No changes were made | NOINDEX + robots disallow `/billing/` |
| `/share/[shareId]` | dinamik: `analysis.title \| Summify` (yoksa "Shared analysis \| Summify" / "Shared analysis unavailable \| Summify") | dinamik | `PublicShareView` H1 | **NOINDEX** (`noIndex: true` + robots disallow `/share/`) |

---

# İKİNCİ ÇIKTI — Aynı ana kelimeyi paylaşan sayfalar (cannibalization riski)

## A. KRİTİK: Aynı slug'lı blog ↔ guides çiftleri (aynı slug, farklı bölüm)

| Slug | Blog URL | Blog title | Guide URL | Guide title | Risk |
|---|---|---|---|---|---|
| `best-ai-pdf-summarizers-2026` | `/blog/best-ai-pdf-summarizers-2026` | Best AI PDF Summarizer Tools in 2026 | ~~`/guides/best-ai-pdf-summarizers-2026`~~ → `/guides/how-to-evaluate-ai-pdf-summarizer` | How to Evaluate an AI PDF Summarizer | **KAPANDI (2026-09-27)** — guide slug'ı 301 ile ayrıldı, blog H1'i listicle niyetine çekildi |
| `ai-study-notes-guide` | `/blog/ai-study-notes-guide` | AI Study Notes: A Practical Starter Guide | `/guides/ai-study-notes-guide` | The Complete Guide to AI Study Notes (2026) | **YÜKSEK** — aynı slug + "AI Study Notes" head-term |
| `pdf-to-flashcards-workflow` | `/blog/pdf-to-flashcards-workflow` | PDF to Flashcards: A Quick Workflow | `/guides/pdf-to-flashcards-workflow` | PDF to Flashcards: A Modern Workflow With AI | **YÜKSEK** — aynı slug + "PDF to Flashcards" head-term |

## B. Head-term grupları (title veya H1'de aynı kök kelime)

| Head-term | Sayfalar (URL → title/H1 kökü) | Risk | Not |
|---|---|---|---|
| **pdf summarizer / summarize pdf** | `/`, `/upload`, `/summarize-pdf`, `/modes/general-summary`, `/blog/best-ai-pdf-summarizers-2026`, `/blog/pdf-summary-generator-vs-manual-notes`, `/blog/category/pdf-workflows`, `/blog/category/comparisons`, `/blog/how-to-summarize-a-pdf-with-ai` | **YÜKSEK** | Ticari head-term `/summarize-pdf`'ta toplanmış (page-metadata'da bilinçli not), ama home + upload title'ında da "Summarizer" geçiyor. Liste sorgusu blogda → ayrım kısmen iyi. |
| **youtube summarizer / summarize youtube** | `/summarize-youtube-video`, `/guides/how-to-summarize-youtube-videos-with-ai`, `/blog/youtube-videos-into-study-notes`, `/blog/category/youtube-summaries`, `/for-creators`, `/summarize-mp3` | **YÜKSEK** | Ticari: `/summarize-youtube-video`; bilgilendirici: guide + 2 blog. |
| **ai study notes / study notes** | `/modes/the-student`, `/guides/ai-study-notes-guide`, `/blog/ai-study-notes-guide`, `/blog/students-ai-summarizers-exam-prep`, `/blog/category/study-learning`, `/for-students`, `/lecture-note-summarizer`, `/ai-note-tool` | **YÜKSEK** | 8 sayfa aynı niyeti taşıyor. |
| **contract analyzer / contract summary** | `/modes/contract-analyzer`, `/for-freelancers`, `/guides/contract-summary-ai-guide`, `/use-cases/contracts-freelancers`, `/summarize-docx` (description) | **ORTA-YÜKSEK** | 4 sayfa doğrudan yarışıyor. |
| **research paper summarizer** | `/for-researchers`, `/research-paper-study-tool`, `/use-cases/research-papers-students`, `/blog/category/ai-research`, CMS `best-ai-tools-for-academic-research` | **YÜKSEK** | İki ayrı landing aynı head-term'ü hedefliyor. |
| **audio study / learn by listening** | `/audio-study`, `/pdf-to-audio-study`, `/ai-audio-study-guide`, `/learn-by-listening`, `/teacher-style-ai-learning`, `/study-while-walking`, 5 blog yazısı | **ÇOK YÜKSEK** | 6 landing + 5 blog aynı ailede; title havuzu birebir örtüşüyor. |
| **learn while walking / study while walking** | `/study-while-walking` ↔ `/blog/learn-while-walking-ai-voice-study` | **YÜKSEK** | Neredeyse birebir aynı sorgu. |
| **podcast (study)** | `/study-podcast-generator`, `/turn-notes-into-podcast`, `/pdf-to-podcast`, `/summarize-mp3`, `/use-cases/podcasts-creators`, `/for-creators` | **YÜKSEK** | 3 ayrı "podcast" landing'i benzer niyetle rekabet ediyor. |
| **powerpoint / ppt summarizer** | `/summarize-powerpoint`, `/blog/summarize-powerpoint-decks-with-ai`, `/blog/category/pptx-documents`, home title | **ORTA** | Ticari + bilgilendirici ayrımı var. |
| **best ai …** | `/best-ai-for-studying`, `/blog/best-ai-pdf-summarizers-2026`, `/blog/best-ai-audio-study-tools-2026`, CMS `best-ai-tools-for-academic-research` | **ORTA** | Farklı nichelar. |
| **executive brief** | `/modes/executive-brief`, `/for-teams`, `/use-cases/reports-teams` | **ORTA** | |
| **exam prep** | `/modes/exam-prep`, `/blog/students-ai-summarizers-exam-prep`, `/for-students` | **ORTA** | |
| **flashcards / learn cards** | `/guides/pdf-to-flashcards-workflow` ↔ `/blog/pdf-to-flashcards-workflow` (aynı slug), `/for-students`, `/modes/the-student`, `/best-ai-for-studying` | **YÜKSEK** (slug çifti kritik) | |
| **lecture notes** | `/lecture-note-summarizer`, `/blog/lecture-notes-to-spoken-lessons`, `/turn-notes-into-podcast`, `/study-podcast-generator` | **ORTA** | |
| **AI Summarizer (genel)** | `/`, `/upload`, `/modes` + `/modes/general-summary`, `/about`, `/faq` | **DÜŞÜK-ORTA** | Hub sayfaları kasıtlı geniş. |
| **passive learning / learn by listening** | `/learn-by-listening`, `/ai-audio-study-guide`, `/blog/passive-learning-with-ai`, `/audio-study` | **ORTA-YÜKSEK** | |

## C. Title ↔ H1 tutarsızlıkları (SERP/İçerik sinyali)

| URL | Title | H1 | Not |
|---|---|---|---|
| `/modes/contract-analyzer` | Contract Summary AI for Clauses & Risks | AI Contract Summary — Clauses & Obligations | Aynı terim, farklı kalıp — düşük risk |
| `/adhd-study-tool` | ADHD Study Tool — Digestible AI Lessons & Cards | The AI Study Tool Built for How ADHD Brains Actually Learn | H1 ana kelimeyi içermiyor |
| `/research-paper-study-tool` | AI Research Paper Study Tool — Summarize, Learn, and Listen | Research Papers Are Hard. Your Study Tool Shouldn't Be. | H1 ana kelimeyi içermiyor |
| `/study-while-walking` | Study While Walking — AI Audio From Lecture Notes | Turn Your Dead Time Into Study Time | H1 ana kelimeyi içermiyor |
| `/study-podcast-generator` | AI Study Podcast Generator — Any Source to Podcast | Turn Any Study Material Into a Podcast You Actually Want to Listen To | H1 ana kelimeyi içermiyor |
| `/turn-notes-into-podcast` | Turn Notes Into a Podcast — AI Study Discussions | Your Notes, Your Podcast, Your Study Session | H1 ana kelimeyi içermiyor |
| `/best-ai-for-studying` | Best AI for Studying 2026 — … | Turn Any Study Material Into a Complete Learning System | H1 ana kelimeyi içermiyor |
| `/faq` | FAQ — AI Summarizer, Formats, Privacy & Study Tools | Common questions | H1 jenerik |
| `/upload` | AI Summarizer Workspace — Upload PDF, Link or Text | Add a source | H1 jenerik (workspace durum başlığı) |
| `/for-researchers` | Research Paper Summarizer AI — Literature Review Notes | Literature review from PDFs, preprints, and web articles | H1 farklı terim → kasten ayrışma olabilir |

## D. Uzunluk uyarıları (60 karakter eşiği)

- **60+ kr (Google kırpabilir):** `/` 66 · `/research-paper-study-tool` 69 · `/best-ai-for-studying` 69 · `/summarize-youtube-video` 66 · `/for-students` 66 · `/blog/category/study-learning` 66 · `/blog/category/productivity` 66 · `/teacher-style-ai-learning` 67 · `/pdf-to-podcast` 67 · `/for-researchers` 64 · `/blog/category/youtube-summaries` 64 · `/modes` 65 · `/faq` 61 · `/blog` 61 · `/blog/category/pdf-workflows` 61 · `/modes/executive-brief` 61 · `/ai-audio-study-guide` 60 · `/ai-study-workflow` 60 · `/modes/exam-prep` 60 · `/study-podcast-generator` 60 · kesilmiş blog title'ları (63'er) ×2.
- **Çok kısa (40 altı — genişletilebilir):** `/compare/notta` 16, `/compare/chatpdf` 18, `/compare/quillbot` 19, `/modes/the-creator` 29, `/use-cases/*` 27-38, `/login` 17, `/terms` 22, `/privacy` 24 (düşük öncelik).
