# Masaüstü Bundle Raporu — `/`, `/summarize-pdf`, `/pricing` (2026-09)

> **Kapsam:** Performans iş kalemi 19. Ölçüm, `npx next build` (Next.js 16.2.6 /
> Turbopack) sonrası **production** sunucusu (`next start`, port 3100) üzerinde,
> masaüstü Chrome ile alındı. Sadece ölçüm + gözlem; büyük refactor yok.
>
> **Yöntem notu:** Next 16 Turbopack build çıktısı rota başına `First Load JS`
> tablosu yazmıyor. Bu yüzden sayılar tarayıcıdan `performance.getEntriesByType`
> ile alındı (decoded = sıkıştırılmamış, transfer = ağdaki bayt).

## 1. Sayılar

| Rota | İlk taraf JS (chunk) | JS (decoded) | JS (transfer) | CSS (decoded) | HTML |
|---|---|---|---|---|---|
| `/` | 14 | **1.207 KB** | 347 KB | 279 KB | 30 KB |
| `/summarize-pdf` | 10 | **797 KB** | ~270 KB | 279 KB | 28 KB |
| `/pricing` | 10 | **818 KB** | ~270 KB | 279 KB | 18 KB |

- **Ortak taban:** 9 chunk / **797 KB** — üç rotanın da paylaşıyor. Yani rota
  başına ek yük küçük; ağırlık uygulamanın paylaştığı tabanda.
- **Sadece `/`'ye eklenen** (diğer iki rota yok): 5 chunk / **410 KB**
  (`0b.1c7…` 154 KB, `0o9vq5…` 100 KB, `0tgih6…` 62 KB, `0zk6-5…` 60 KB,
  `12de4o…` 34 KB) — homepage'e özel bileşenler (hero,TrustBar, pricing preview vb.).
- **Sadece `/pricing`:** 1 chunk / 21 KB.
- Toplam 44 chunk, tümü gzip ile **837 KB** (repo geneli).

## 2. Render-blocking

| Kaynak | Adet | Not |
|---|---|---|
| Render-blocking `<script>` (async/defer yok) | **1** | `03~yq9q893hmn.js` — raw 110 KB / **gzip 39 KB** |
| Render-blocking `<link rel=stylesheet>` | **2** | toplam 279 KB decoded |
| Preload | font ×2, script ×3, image ×1 | font'lar `<link rel=preload>` ile erken |

Diğer **19 script `async=true`** — yani JS'in çoğu render'ı bloklamıyor.
Üçüncü taraf etiketler (Facebook, GTM, Ahrefs) `async` ve `afterInteractive`.

**En büyük tek build-blocking kalemi CSS (279 KB decoded).** JS tarafında tek
bloklayan 39 KB gzip — orta seviye, kritik değil.

## 3. Üçüncü taraf JS

| Sağlayıcı | decoded | Not |
|---|---|---|
| `connect.facebook.net` (fbevents + signals config) | 415–763 KB* | sayfadaki **en büyük** JS kaynağı; sinyal config'i tek başına 356 KB |
| `analytics.ahrefs.com` | küçük | async |
| GTM / GA4 (`G-BC45TBC6J1`) | async | afterInteractive |

\* İlk soğuk yüklemede toplam 763 KB / transfer 193 KB ölçüldü; signals config
script'i her gezinmede çalışmıyor, bu yüzden sonraki ölçümlerde 415 KB.

**Bulgu:** Üçüncü taraf JS (415–763 KB) `/summarize-pdf`'in tüm ilk taraf
JS'inden (797 KB) bile fazla sayılabilecek düzeye yakın. Meta pixel'i
`connect.facebook.net` yerine **server-side / GTM konteyneri içine** almak ya da
sinyal script'ini yalnızca dönüşüm sayfalarında tetiklemek, tek hamlede en büyük
kazancı verir.

## 4. Lazy-load

- Sayfada toplam **3 `<img>`**: 1 tanesi `loading="lazy"`, 2 tanesi `auto`.
- `auto` olan ikisi de **32×32 brand-icon** (LCP adayı değil, `width/height`
  setli → layout shift yok).
- 1 adet `noscript` piksel (Önceki oturumda audit edilmişti): kasıtlı.
- **Sonuç: lazy-load açısından eksik yok.** LCP büyük olasılıkla metin/Hero.

## 5. Zamanlama (ilk soğuk yükleme, `/`)

| Metrik | Değer |
|---|---|
| TTFB | 27 ms (localhost — üretim için geçerli değil) |
| FCP | 244 ms (localhost) |
| DCL | 74–95 ms |
| Long task | 0 (ölçüm anında) |

> Local sayılar gerçek kullanıcı metriği değildir; CWV için ayrı lab raporu
> `docs/seo/cwv-report-2026-09.md` dosyasında.

## 6. Kullanılmayan JS hakkında dürüst not

Bu ortamda CDP **coverage API'si yok**, bu yüzden "indirilip çalıştırılmayan
bayt" doğrudan ölçülemedi. Bunun yerine **rota farkı (differential)** kullanıldı:
797 KB'lık ortak taban üç rotada da yükleniyor ve bu tabanın ne kadarı ilk
ekran için gerçekten gerekli olduğu coverage olmadan söylenemez.

Ölçülebilir ve anlamlı iki aday:
1. `/`'ye özel 410 KB — homepage ilk ekranında kullanılmayan bileşen var mı,
   coverage ile doğrulanabilir (DevTools → Coverage → `Start coverage`).
2. Ortak 797 KB'lık tabanın büyük chunk'ları (`0~rk…` 69 KB gzip,
   `10dfr…` 55 KB gzip) — muhtemelen framework + editör + analiz UI.

## 7. Önceliklendirme (refactor YOK — ölçüm sonra)

| # | İş | Beklenen kazanç | Risk |
|---|---|---|---|
| 1 | Meta pixel'i GTM/server-side'a taşı veya dönüşüm rotalarıyla sınırla | 415–763 KB üçüncü taraf JS ↓ | düşük |
| 2 | Kritik CSS'i inline et (279 KB stylesheet render-blocking) | FCP ↓ | düşük-orta |
| 3 | Coverage ile `/`'deki 410 KB'lık homepage-only chunk'ın kullanılmayan kısmını çıkar | JS ↓ | orta — **önce ölç** |
| 4 | `03~yq9q893hmn.js` (39 KB gzip, tek bloklayan script) içeriğini incele | FCP ↓ | düşük |

**Karar:** Bu rapor tek başına büyük bir bundle refactorünü hak etmiyor.
Kazançların çoğu 1. ve 2. maddeden geliyor; 3. madde için bir coverage ölçümü
koşuludur.
