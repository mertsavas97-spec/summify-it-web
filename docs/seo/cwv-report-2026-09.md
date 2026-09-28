# Core Web Vitals Raporu — Summify (Eylül 2026)

- **Tarih:** 27 Eylül 2026 (ölçüm UTC 16:19–16:21)
- **Domain:** https://www.summify.app
- **Kapsam:** 4 zorunlu URL × 2 cihaz (masaüstü / mobil) = 8 ölçüm
- **Eşikler:** LCP ≤ 2.500 ms · CLS ≤ 0.10 · INP ≤ 200 ms (Good / "yeşil" aralık)

---

## Metodoloji ve veri kaynağı (önemli)

| Kalem | Durum |
|---|---|
| **A) Google PageSpeed Insights API** (`pagespeedonline/v5/runPagespeed`) | **KULLANILAMADI.** `429 Quota exceeded … Queries per day` döndü. Talimat gereği `time.sleep(60)` ile **3 deneme** yapıldı, 3'ü de 429. Ek kontrol denemesinde de 429. API anahtarı/ücretli servis kullanılmadı. |
| **B) web.dev/measure** | `https://www.web.dev/measure/` → **404** (API ucu yok, sadece JS uygulaması). |
| **C) Tarayıcı üzerinden pagespeed.web.dev UI** | **KULLANILAMADI** — oturuma bağlı masaüstü tarayıcı yok (`browser.disconnected`). |
| **D) Yerel Lighthouse (ücretsiz, local, anahtarsız)** | **KULLANDILDI — birincil kaynak.** `lighthouse@12.8.2` (npm), Chrome headless, `--only-categories=performance`. |

> **Alan verisi (CrUX / RUM) YOK.** Raporun tamamı **laboratuvar verisidir**. PSI API kotası dolduğu için `loadingExperience` / `originLoadingExperience` CrUX alan metrikleri (gerçek kullanıcı LCP/CLS/INP'leri) bu oturumda alınamadı. KrUX alan verisi kota açıldığında aynı URL'ler için tekrar çekilmelir; **field vs lab karşılaştırması şimdilik yapılamıyor.**

### Laboratuvar koşul ayarları (Lighthouse defaults — PSI ile aynı emülasyon)

| | Masaüstü | Mobil |
|---|---|---|
| formFactor | `desktop` | `mobile` |
| Ekran | 1350×940, DPR 1 | 412×823, DPR 1.75 |
| Throttling | RTT 40 ms, 10,24 Mbit/s, CPU ×1 | RTT 150 ms, Slow 4G (≈1,6 Mbit/s), **CPU ×4** |
| TTFB (root doc) | 46–51 ms | 46–95 ms |

**Not:** Her URL/strateji için **1 çalıştırma (n=1)** yapıldı; Lighthouse laboratuvar metrikleri koşudan koşuya ±%10 oynayabilir.

**INP hakkında:** Lighthouse laboratuvar koşusu etkileşimli senaryo çalıştırmadığı için **INP ölçemez** (`interaction-to-next-paint` = null). INP yerine **TBT** ve **Max Potential FID** proxy olarak verilmiştir. Gerçek INP yalnızca CrUX alan verisiyle alınabilir.

---

## Tablo 1 — MASAÜSTÜ (Lighthouse lab, desktop preset)

| URL | LCP | CLS | INP / TBT | FCP | Speed Index | LH Perf | Veri tipi |
|---|---|---|---|---|---|---|---|
| https://www.summify.app/ | **1.742 ms** ✅ PASS | **0.040** ✅ PASS | INP n/a · TBT 0 ms ✅ | 712 ms | 1.125 ms | **92** | Laboratuvar (lab) |
| https://www.summify.app/summarize-pdf | **893 ms** ✅ PASS | **0.000** ✅ PASS | INP n/a · TBT 0 ms ✅ | 725 ms | 725 ms | **99** | Laboratuvar (lab) |
| https://www.summify.app/pricing | **773 ms** ✅ PASS | **0.000** ✅ PASS | INP n/a · TBT 0 ms ✅ | 610 ms | 711 ms | **99** | Laboratuvar (lab) |
| https://www.summify.app/upload | **578 ms** ✅ PASS | **0.146** ❌ **FAIL** | INP n/a · TBT 0 ms ✅ | 578 ms | 622 ms | **94** | Laboratuvar (lab) |

Ek: Sayfa boyu ≈ 716–843 KiB · font-display skoru 1.0 (iyi) · Sunucu yanıtı 50 ms.

## Tablo 2 — MOBİL (Lighthouse lab, slow-4G + 4× CPU)

| URL | LCP | CLS | INP / TBT | FCP | Speed Index | LH Perf | Veri tipi |
|---|---|---|---|---|---|---|---|
| https://www.summify.app/ | **7.185 ms** ❌ **FAIL** | **0.000** ✅ PASS | INP n/a · TBT 125 ms ✅ (mPFID 140 ms) | 4.971 ms | 5.864 ms | **61** | Laboratuvar (lab) |
| https://www.summify.app/summarize-pdf | **6.400 ms** ❌ **FAIL** | **0.000** ✅ PASS | INP n/a · TBT 180 ms ✅ (mPFID 150 ms) | 3.567 ms | 4.851 ms | **65** | Laboratuvar (lab) |
| https://www.summify.app/pricing | **7.519 ms** ❌ **FAIL** | **0.000** ✅ PASS | INP n/a · TBT 164 ms ✅ (mPFID 140 ms) | 3.487 ms | 4.981 ms | **64** | Laboratuvar (lab) |
| https://www.summify.app/upload | **7.621 ms** ❌ **FAIL** | **0.000** ✅ PASS | INP n/a · TBT 138 ms ✅ (mPFID 150 ms) | 4.829 ms | 5.542 ms | **61** | Laboratuvar (lab) |

Ek: Sayfa boyu ≈ 721–836 KiB · TTFB 46–95 ms (sunucu sorunu değil) · unused JS 205–264 KiB/sayfa.

---

## Sonuçlar

**1. En kötü sayfa: `https://www.summify.app/upload` (mobil) — LCP 7.621 ms** (eşiğin ~3×'i), hemen ardından `/pricing` 7.519 ms ve `/` 7.185 ms. Mobil Lighthouse skorları 61–65 bandında; **dört URL'in dördü de mobil LCP'de FAIL.**

**2. Şişik metrikler**
- **LCP (mobil) — en kritik sorun.** LCP elemanı görsel değil, **metin paragrafı** (hero altındaki `p.mt-3` açıklama / footer metni). Yani şişkinlik görsel boyutundan değil; **FCP'nin çok geç gelmesinden** (3.5–5.0 s) kaynaklanıyor. Yol boyu: render-blocking CSS + üçüncü taraf etiket bloğu + uzun JS iş parçacığı.
- **Render-blocking:** tek CSS dosyası `_next/static/chunks/0_mg2u8vjaex8.css` (31,8 KB) mobilde **~600 ms** (ev) / 200–290 ms (diğer sayfalar) boşa harcıyor.
- **Unused JS:** 205–264 KiB/sayfa; en büyük israf kaynakları `googletagmanager.com/gtag` (81 KiB israf), `connect.facebook.net/fbevents + signals` (68 KiB israf), Ahrefs analytics. Kendi bundle'larında da 45+33+25 KiB kullanılmayan parça var.
- **Preconnect eksik:** `facebook.com`, `connect.facebook.net`, `analytics.ahrefs.com` için preconnect yok → **290–450 ms** tahmini kazanç.
- **CLS (masaüstü /upload) — tek CLS FAIL:** 0.146. Kayma kaynakkodu **footer (`footer.border-t`) tek başına 0.129 skor üretiyor** (sayfa yüklenirken aşağıdan yukarı kayıyor), ikinci katkı main içeriğindeki `div.mt-3` (0.017).

**3. İyimser tablo:** Masaüstü genel olarak çok sağlıklı — LCP 578–1.742 ms (ev sayfası hariç hepsi <1 s), TBT 0 ms, CLS 0. `/summarize-pdf` ve `/pricing` masaüstünde **99** alıyor. Sunucu yanıtı (TTFB 50 ms) ve font-display (1.0) sorun değil.

**4. Diğer sinyaller**
- **bf-cache kapalı:** `cache-control: no-store` nedeniyle geri/ileri önbelleği kullanılamıyor → sekme arası gezinmede her navigasyonda sıfırdan yükleme (bu, mobil hissiyatı LCP'den bağımsız da kötüleştirir).
- 5 kaynakta **uzun cache TTL**, `cache-insight` 171 KiB tekrar indirilebilir içerik gösteriyor.

**5. Field vs lab farkı:** **Karşılaştırılamadı — alan verisi (CrUX) yok.** Lab mobil değerleri (6.4–7.6 s) simüle Slow-4G + 4× CPU ile üretildi ve gerçek kullanıcılardan **farklı** olabilir (daha iyi veya kötü). Mobil LCP için kesin hüküm **CrUX verisi gelmeden** verilmemeli; lab verisi "risk yüksek" der, "gerçek kullanıcıda FAIL" demez.

---

## Öncelikli düzeltme önerileri

1. **Üçüncü taraf etiketleri (Google Tag Manager, Meta fbevents/signals, Ahrefs) ilk boyamadan sonra yükleyin.** Bu scriptler tek başlarına 150–250 KiB kullanılmayan JS getiriyor ve mobil CPU yolunu uzatıyor; sayfa içeriğinin görünmesini geciktiren en büyük ortak payda.
2. **`facebook.com` / `connect.facebook.net` / `analytics.ahrefs.com` bağlantılarını içeren sayfalara preconnect ekleyin** (kazanç 290–450 ms), render-blocking olan ana CSS dosyasını ilk boyama için gereken asgari kural setine indirin veya kritik CSS'i HTML içine taşıyın (kazanç 200–600 ms).
3. **`/upload` sayfasındaki footer kaymasını durdurun:** footer'a ilk render'da ayrılan sabit bir alan/yükseklik verin, sonradan yüklenen font/ikon/metin bloklarının yüksekliğini değiştirmesini engelleyin (masaüstü CLS 0.146 → <0.10 hedefi; tek başına 0.129 skor üretiyor).
4. **Mobilde LCP'yi kısaltmak için içeriği önceliklendirin:** hero paragrafı ve hemen üstündeki başlık, JS beklemeden sunucuda render edilmiş olarak gelsin; LCP metnini font yüklemesinin arkasına bırakmayın (font-display zaten iyi, ama metin blokları JS hydration'ı bekliyorsa FCP gecikiyor).
5. **Gezinme hissiyatı için `no-store` politikasını gözden geçirin:** yalnızca gerçekten dinamik olan HTML yanıtlarında `no-store` tutun, geri kalan public sayfalarda bf-cache'i açtırın; ayrıca uzun TTL'li statik varlıkları (5 kaynak) ve tekrar indirilen 171 KiB'ı cache'leyin.

---

## Tekrar ölçüm notu

- PSI API günlük kotası sıfırlandığında şu komutla **alan (CrUX) verisi** çekilmeli ve bu rapora "Field" sütunu eklenmeli:
  `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&strategy=desktop|mobile&category=performance`
- Lab verisini çoğaltmak için (anahtarsız): `/tmp/cwv/run.sh` + `/tmp/cwv/parse.py` (bu ölçümde kullanıldı), Lighthouse 12.8.2, Chrome headless.
- Gerçek **INP** yalnızca CrUX / kendi RUM'unuzdan gelebilir; mevcut TBT 125–180 ms aralığı INP'nin 200 ms eşiğini aşma riski göstermiyor ama kesin değildir.
