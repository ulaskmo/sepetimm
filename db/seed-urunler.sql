-- ---------------------------------------------------------------------------
-- Eda'nın mevcut ürünleri.
--
-- Hepsi TASLAK olarak ekleniyor: published = false, price_kurus = 0.
-- Fiyatı bilmeden yayına almak, siteye yanlış fiyat koymak demek olurdu.
-- /admin sayfasından her ürünün fiyatını girip "Sitede görünsün" kutusunu
-- işaretleyin; o anda yayına girer.
--
-- Çalıştırmak için:
--   psql "$DATABASE_URL" -f db/seed-urunler.sql
-- Tekrar çalıştırmak güvenlidir: aynı slug varsa hiçbir şey yapmaz.
-- ---------------------------------------------------------------------------

insert into products
  (slug, title, description, price_kurus, images, kind, lead_time_days, published, sort_order)
values
  (
    'hasir-ev-sepet',
    'Hasır Ev Sepet',
    E'Pencereleri ve açılır kapısı elde örülmüş, ev biçiminde saklama sepeti.\n\nKapak deri askılarla tutturuluyor, ahşap boncuk düğmelerle kapanıyor. Çocuk odasında oyuncak sepeti ya da dekoratif saklama kutusu olarak kullanılabilir.',
    0, array['/urunler/hasir-ev-sepet.jpg'], 'made_to_order', 21, false, 10
  ),
  (
    'mantar-sepet',
    'Mantar Sepet',
    E'Kırmızı şapkalı, keçe puantiyeli mantar biçiminde sepet.\n\nGövdede küçük pencereler ve açılır bir kapı var; şapka kulplu kapak olarak kaldırılıyor. Çocuk odası için dekoratif saklama sepeti.',
    0, array['/urunler/mantar-sepet.jpg'], 'made_to_order', 21, false, 20
  ),
  (
    'yuvarlak-ekmek-sepeti',
    'Yuvarlak Kapaklı Ekmek Sepeti',
    E'Kubbe kapaklı, keten astarlı ve dantel şeritli yuvarlak ekmek sepeti.\n\nKapakta ahşap tutamak, yan tarafta örgü başak detayı. Ekmeği nefes aldırarak saklar; sofrada olduğu gibi de servis edilebilir.',
    0, array['/urunler/yuvarlak-ekmek-sepeti.jpg'], 'made_to_order', 14, false, 30
  ),
  (
    'hasir-abajur-beyaz-ayak',
    'Hasır Abajur — Beyaz Yıkamalı Ayak',
    E'Elde örülmüş hasır başlık, beyaz yıkamalı torna ahşap ayak.\n\nIşık örgünün arasından süzülerek duvara doku düşürür. Komodin ve konsol için.',
    0, array['/urunler/hasir-abajur-beyaz-ayak.jpg'], 'made_to_order', 14, false, 40
  ),
  (
    'hasir-abajur-dogal-ayak',
    'Hasır Abajur — Doğal Ahşap Ayak',
    E'Elde örülmüş hasır başlık, sade torna ahşap ayak.\n\nDoğal ahşabın damarı görünür halde bırakıldı. Yatak odası ve çalışma masası için.',
    0, array['/urunler/hasir-abajur-dogal-ayak.jpg'], 'made_to_order', 14, false, 50
  ),
  (
    'hasir-abajur-kare-ayak',
    'Hasır Abajur — Kare Ayaklı',
    E'Elde örülmüş hasır başlık, kare tabanlı torna ahşap ayak.\n\nDaha uzun ve dik duruşlu; salon köşesi ve giriş konsolu için.',
    0, array['/urunler/hasir-abajur-kare-ayak.jpg'], 'made_to_order', 14, false, 60
  ),
  (
    'hasir-agac-etegi',
    'Hasır Ağaç Eteği',
    E'Geniş, konik formda elde örülmüş hasır ağaç eteği.\n\nYılbaşı ağacının altını ya da büyük saksıların gövdesini kapatmak için. Ön yüzünde deri marka etiketi.',
    0, array['/urunler/hasir-agac-etegi.jpg'], 'made_to_order', 21, false, 70
  ),
  (
    'bebek-hediye-seti-mavi',
    'Bebek Hediye Seti — Mavi',
    E'Beyaz örgü çerçeve ve çiçek süslemeli sepetten oluşan ikili set.\n\nÇerçevede ay üstünde uyuyan bebek baskısı, sepette mint ve krem güller, papatyalar, dantel ve mavi kurdele. Hastane çıkışı ve bebek ziyareti için.',
    0, array['/urunler/bebek-hediye-seti-mavi.jpg'], 'made_to_order', 10, false, 80
  ),
  (
    'bebek-hediye-seti-pembe',
    'Bebek Hediye Seti — Pembe',
    E'Beyaz örgü çerçeve ve çiçek süslemeli sepetten oluşan ikili set.\n\nÇerçevede ay üstünde uyuyan bebek baskısı, sepette pudra ve gül kurusu tonlarında güller, papatyalar, dantel ve pembe kurdele. Hastane çıkışı ve bebek ziyareti için.',
    0, array['/urunler/bebek-hediye-seti-pembe.jpg'], 'made_to_order', 10, false, 90
  ),
  (
    'tekerlekli-pazar-arabasi',
    'Tekerlekli Hasır Pazar Arabası',
    E'Ahşap tekerlekli, uzun kulplu hasır pazar arabası.\n\nÖn yüzünde pamuk püskül detayı. Pazar alışverişi için çekilebilir; dolu haldeyken de dik durur.',
    0, array['/urunler/tekerlekli-pazar-arabasi.jpg'], 'made_to_order', 21, false, 100
  ),
  (
    'piknik-sepeti-potikare',
    'Kapaklı Piknik Sepeti — Kırmızı Pötikare',
    E'Çift kapaklı, sabit kulplu klasik piknik sepeti.\n\nİçi ve kapak iç yüzü kırmızı pötikare kumaşla kaplı, kenarları dantel şeritli. Kapaklar ortadan ikiye açılıyor, kurdele ile bağlanıyor.',
    0,
    array['/urunler/piknik-sepeti-1.jpg', '/urunler/piknik-sepeti-2.jpg'],
    'made_to_order', 21, false, 110
  )
on conflict (slug) do nothing;
