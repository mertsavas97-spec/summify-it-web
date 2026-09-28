# GA4 — Uygulama Kontrol Listesi (senin GA4 girişin gerektirir)

> Oluşturulma: 2026-09-27 · Kod tarafı tamamlananlar bu dosyanın dışında.
> Neden burada: GA4 Admin / Looker Studio erişimi agent'ta yok — aşağıdaki adımları
> GA4 arayüzünde sen çalıştırman gerekiyor.

## Durum özeti (2026-09-28 · madde 14–17)

| Madde | Bölüm | Durum | Neden |
|---|---|---|---|
| 14 — key event işaretleme | §1 | **BLOCKED** | GA4 Admin arayüzü; Data API (read-only) event'i key yapamaz |
| 15 — Google signals | §2 | **BLOCKED** | GA4 Admin arayüzü; property ayarı API ile değiştirilemez |
| 16 — chatgpt.com audience | §3 | **BLOCKED** | Audience oluşturma Admin/BigQuery API'ye ait; mevcut token ile yapılamaz |
| 17 — Sign In %0 çıkış doğrulaması | §4 | **BLOCKED (API denemesi başarısız)** | gerçek GA4 Data API denemesi `invalid_grant` döndü — aşağıya bak |

**Madde 17 deneme kaydı (uydurma yok, gerçek çıktı):**
`scripts/ga4-login-exit-check.ts` çalıştırıldı (2026-09-28).
Kimlikler gerçek: `.env.local` `GA4_PROPERTY_ID` + `GOOGLE_CLIENT_ID/SECRET`,
refresh token Supabase `admin_oauth_tokens` tablosundan (`provider=google_analytics`,
`scope=…/analytics.readonly`, `connected_at=2026-09-06`).

```
HATA: TypeError ... at OAuth2Client.refreshTokenNoCache
  → Gaxios _request → error: invalid_grant
```

`invalid_grant` = refresh token Google tarafından reddedildi (iptal edilmiş, uygulama
**Testing** modundaysa 7 gün sonra düşmüş — token 22 günlük, bu senaryo ile uyumlu —
ya da client secret dönmüş). Dolayısıyla GA4 verisi okunamadı; **Sign In çıkış oranı
%0 henüz doğrulanmadı** ve raporlanan "0 çıkış" değeri teyit edilmedi.

Kurtarma (senin yapman gereken):
1. Google Cloud Console → OAuth 2.0 Client → app'i **Publish** et (Testing'deyse refresh token'lar 7 günde düşer).
2. `admin_oauth_tokens` satırını yenile (uygulamanın GA4 bağlantı akışını yeniden çalıştır).
3. Sonra: `npx tsx scripts/ga4-login-exit-check.ts` — raporu bu dosyaya ekle.

Kod tarafı bilgi notu: script 3 sorgu üretir (login sayfa eventleri, page_view vs
signup karşılaştırması, chatgpt/assistant/perplexity/gemini sessionSource) — madde 16
için de hazır betiktir, token düzelince tekrar çalıştırılabilir.

## 1. Key event'leri işaretle (Admin → Events → Modify event / Mark as key event)

| Event | Neden key | Repo kaynağı |
|---|---|---|
| `summary_created` | ana dönüşüm | analiz tamamlama akışı |
| `account_created` | huni kırılma noktası ölçümü | auth callback |
| `pdf_uploaded` | aktivasyon öncesi sinyal | upload akışı |
| `subscription_started` | gelir | Polar webhook → billing |

Mark as key event yaptığında GA4'te mor rozet oluşur; dönüşüm raporlarına girer.
Admin → Events listesinde bu 4 event'in listede olduğunu doğrula; yoksa event'in
GA4'e ulaşmadığını gösterir (önce GTM/eventCollection'ı kontrol et).

## 2. Google signals (Admin → Data Settings → Data Collection)

- Kapalıysa aç: demografik + remarkap cross-device raporlarını açar.
- Not: GDPR bölgesiyse consent mode gerekir; site bir consent banner'ı göstermiyor —
  açmadan önce bunu değerlendir.

## 3. chatgpt.com / ai-assistant kaynağını ayrı audience yap

Admin → Audiences → New audience:
- Condition: `Session source` matches `chatgpt.com` **OR** `Session source` contains `assistant`
- Kapsam: tüm kullanıcılar (session tabanlı)
- Not: `Admin panelindeki etiket eşlemesi` bunu karşılamıyor — etiket eşlemesi
  (channel groupings) ile audience farklı katmandır; ikisi de gerekli.

## 4. Sign In çıkış oranı %0 doğrulaması

Rapor: Engagement → Pages → filter `page_path` contains `/login` →
**Event count by Event name** (bounce/exit yerine):
- `page_view` sayısını (giriş) ile `session_start` sonraki ilk sonraki event ile karşılaştır.
- Eğer GA4'te gerçekten 0 çıkış varsa bu **ölçüm hatası** (ör. sign-in butonu
  `trackEvent` ile submit ediliyor ama hedef sayfa ölçümü yok) ya da SPA geçişinin
  tek oturumda kalması demektir. Karar: çıktı olayını `sign_in_success`/`sign_in_failed`
  event'iyle ölçülebilir hale getirmek (kod tarafı, ayrı iş kalemi).

## 5. Google signals + attribution

Attribution reporting: Admin → Data Settings → Attribution → **data-driven** model
(ilk kuruluş varsayılanı last-click olabilir).

## 6. Blog/guide iç CTA UTM'leri (KOD TAMAMLANDI 2026-09-27)

İç CTA linkleri artık tutarlı UTM taşıyor:
`utm_source={blog|guide|compare}&utm_medium=internal_cta&utm_campaign={blog_end|blog_inline|blog_workflow|guide_strip}`

GA4'te doğrulama: Reports → Traffic acquisition →
filter `Session campaign` = `blog_end` → landing pages raporu.
Not: aynı domain içi link olduğu için `session_source` "direct"/"(direct)" değil
`(direct) / (none)` yerine **organic** kalabilir; iç link tıklamalarını ölçmek için
en hızlı yol **Explore → Events → click** ya da outbound-click ölçümüdür.
