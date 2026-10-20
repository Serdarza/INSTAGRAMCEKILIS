# İntagram Reels çekiliş aracı

Uygulama, herkese açık Instagram Reels yorumlarını sayfa sayfa çekmek için Scrape Creators servis API'sini kullanır. Instagram şifresi veya Instagram hesabı bağlantısı istemez. Servis kendi API anahtarını ve kredi bakiyesini gerektirir; her yorum sayfası için servis kredi tüketir. Servis bazı isteklerin başarısız olabileceğini belirtiyor; uygulama başarısız istekleri en fazla iki kez yeniden dener.

## Başlatma

1. [Scrape Creators](https://scrapecreators.com/) hesabı açıp API anahtarı al ve kredi durumunu kontrol et.
2. PowerShell'de proje klasöründe çalıştır:

```powershell
$env:SCRAPE_CREATORS_API_KEY="API anahtarın"
node server.mjs
```

3. `http://localhost:4173` adresini aç, Reels bağlantısını yapıştır ve **Reels bağlantısından yorumları çek** düğmesine bas.

API anahtarını HTML dosyasına, herkese açık depoya veya Instagram giriş ekranına yazma. Anahtar yalnızca yerel sunucuda ortam değişkeni olarak kullanılır.

## Veri ve sınırlar

- Yalnızca herkese açık Reels'ler alınabilir. Gizli hesaplar, kısıtlanmış içerikler veya servis tarafından alınamayan yorumlar çalışmayabilir.
- Yorumlar cursor ile sayfalanır; uygulama en fazla 250 sayfa ister ve tekrar eden kayıtları tekilleştirir. Ekrandaki toplam, servisin döndürdüğü yorumlardır.
- Servis sayfa başına kredi alır. Çekilişe başlamadan önce getirilen yorum sayısını kontrol et.
- Yorum beğeni koşulu, servisin yorum başına verdiği `comment_like_count` alanına dayanır. Reels'i beğenen kişilerin listesini bu entegrasyon sağlamaz.
- Meta'nın resmî Instagram API'si hesap bağlama ve yorum izni ister; bu uygulamanın linkle içe aktarma modu o servisten ayrı çalışır.
