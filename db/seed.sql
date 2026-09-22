-- Örnek içerik. Siteyi boş görmemek için bir kez çalıştırın:
--   psql "$DATABASE_URL" -f db/seed.sql
-- Fiyatlar kuruş cinsindendir (145000 = 1.450 TL).

insert into products (slug, title, description, price_kurus, images, kind, dimensions, published, sort_order)
values (
  'oval-kapakli-sepet-keten-astarli',
  'Oval Kapaklı Sepet — Keten Astarlı',
  E'Geri dönüşümlü kağıt çubuklarla elde örülmüş, kapaklı oval sepet.\n\nKapak kısmı zikzak örgü tekniğiyle, gövde düz örgüyle hazırlandı. İç kısmı keten astarlı, ağız çevresi pamuk dantel detaylı. Doğal hasır tonunda, su bazlı boya ile renklendirildi.\n\nSalonda örtü ve battaniye, banyoda havlu, çocuk odasında oyuncak saklamak için kullanılabilir.',
  145000,
  array['/urunler/hasir-oval-sepet.jpg'],
  'unique',
  '38 × 24 × 18 cm',
  true,
  1
)
on conflict (slug) do nothing;

insert into courses (slug, title, description, price_kurus, level, duration_sec, published, sort_order)
values
  (
    'kagit-cubuk-sarma',
    'Kağıt Çubuk Sarma Tekniği',
    E'Her şey buradan başlıyor. Gazete sayfasını doğru genişlikte kesmeyi, şişle eşit kalınlıkta sarmayı ve ucunu kapatmayı adım adım gösteriyorum.\n\nBu tekniği öğrendiğinizde tüm sepetlerin hammaddesini kendiniz üretebilirsiniz.',
    24900, 'baslangic', 480, false, 1
  ),
  (
    'sepet-tabani-orme',
    'Sepet Tabanı Örme',
    E'Sepetin en kritik kısmı taban. Oval ve yuvarlak taban kurulumunu, çubukları kaldırıp gövdeye geçişi anlatıyorum.',
    29900, 'baslangic', 600, false, 2
  ),
  (
    'kenar-kapatma-ve-astar',
    'Kenar Kapatma ve Astar Dikimi',
    E'Sepeti bitiren detay: temiz bir kenar kapatma ve içine dikilen keten astar. Dantel ekleme ve deri marka dikimi de bu derste.',
    34900, 'orta', 540, false, 3
  )
on conflict (slug) do nothing;

-- Ana sayfadaki videonun ürünü.
insert into products (slug, title, description, price_kurus, images, kind, dimensions, published, sort_order)
values (
  'cicek-islemeli-orgu-canta',
  'Çiçek İşlemeli Örgü Çanta',
  E'Elde örülmüş, çiçek işlemeli omuz çantası.\n\nGövde file örgü tekniğiyle hazırlandı; ön yüzdeki krem çiçekler ve yeşil yapraklar tek tek elde işlendi. İçi kumaş astarlı, tabanı hakiki deri ve metal ayaklı.\n\nGünlük kullanıma, plaja ve yazlık kombinlere uygun.',
  189000,
  array[
    '/urunler/cicekli-canta-1.jpg',
    '/urunler/cicekli-canta-5.jpg',
    '/urunler/cicekli-canta-2.jpg',
    '/urunler/cicekli-canta-4.jpg',
    '/urunler/cicekli-canta-3.jpg'
  ],
  'made_to_order',
  '32 × 12 × 38 cm (sap dahil 62 cm)',
  true,
  0
)
on conflict (slug) do nothing;

update products set lead_time_days = 14 where slug = 'cicek-islemeli-orgu-canta';
