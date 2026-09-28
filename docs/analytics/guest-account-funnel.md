# Guest → Account Huni Ölçüm Notu (2026-09-27)

> Amaç: ilk özetten sonra guest'in hesaba düşüşünü ölçmek. Yeni analytics
> ürünü kurulmadı — yalnızca mevcut `trackEvent` olaylarına 1 eksik adım eklendi.

## Huni (3 adım, GA4 event adlarıyla)

| Adım | Repo event | GA4 key event eşlemesi | Kaynak |
|---|---|---|---|
| 1. Analiz bitti | `analysis_completed` | `summary_created` (GA4'te mark edilecek) | `src/components/upload/TextAnalysisMvp.tsx` |
| 2. Hesap isteği (guest → login yönlendirmesi) | `account_requested` **(YENİ)** | `account_created` öncesi sinyal | `UploadWorkspace.tsx` → `persistGuestSaveHandoff` |
| 3. Hesap oluştu | `signup_completed` | `account_created` (GA4'te mark edilecek) | `LoginForm.tsx`, `GoogleSignInButton.tsx` |

`account_requested` payload'ı: `{ surface: "result_save_banner", return_to }`.
Tek tetikleyici: sonuç ekranındaki "Save this analysis" / paywall auth intent
(`persistGuestSaveHandoff`). `signup_started` da dolaylı olarak 2. adımı
`intent` alanı ile ayırır (`sign_in` vs `sign_up`).

## GA4'te nasıl okunur

1. **Explore → Free form**: `event_name = analysis_completed` → funnel adımına
   `account_requested` → `signup_completed`. Her adımda kullanıcı sayısı ve
   dönüşüm %'si.
2. **Oranlar:** `account_requested / analysis_completed` = "özet sonrası hesap
   isteği oranı"; `signup_completed / account_requested` = "istek → kayıt".
3. GA4 Admin → Events'de `account_requested` görünene kadar event GA4'e
   ulaşmıyordur (önce `signup_completed` görünüyorsa transport/tag sorunu yoktur).

## Dikkat

- Kod tarafı tamam; **GA4 arayüzünde key event işaretleme (madde 14) senin
  girişinle** yapılacak — bkz. `docs/analytics/ga4-action-checklist.md`.
- `summary_created` / `account_created` / `pdf_uploaded` / `subscription_started`
  GA4 key event isimleri repo event adlarıyla aynı değildir; GA4'te ya mevcut
  event'i (analysis_completed / signup_completed / upload_started) key yap ya da
  Modify event ile yeniden adlandır. Eşleme tablosu yukarıda.
- Event adları uydurulmadı: yeni tek event `account_requested` (3 adımdaki tek
  eksik halka).
