-- S7 feed-live cold-start seed: ~20 popular Malaysian products + ingredient-only
-- verdicts so the "Hidden Ingredients" feed is ALIVE on day one (not empty on film).
--
-- LEGAL (specs §11.2): verdicts here are INGREDIENT-ONLY, hand-authored from
-- publicly-known ingredient lists — factual, non-diagnostic, no brand/health
-- accusation. Real AI verdicts supersede these on live scans. NO recalls seeded
-- (recalls are service-written into public.recalls only; §6).
--
-- Barcodes use the 95560100000NN range (distinct from mock/demo barcodes) so
-- feed "Details" -> /product/<barcode> resolves from the products+verdicts cache
-- (fixes the tasks.md 404 gap for the seeded set). Idempotent via ON CONFLICT.

insert into public.products (barcode, name, brand, ingredients_raw, source) values
  ('9556010000001','Milo Chocolate Malt Powder 1kg','Nestle','Malt extract, milk powder, sugar, cocoa powder, palm oil, minerals, vitamins.','off'),
  ('9556010000002','Maggi Curry Instant Noodles 79g','Maggi','Wheat flour, palm oil, salt, flavour enhancer (E621), curry powder, hydrolysed vegetable protein, colour (E102).','off'),
  ('9556010000003','Julie''s Peanut Butter Sandwich 180g','Julie''s','Wheat flour, sugar, palm oil, peanut butter, salt, raising agents.','off'),
  ('9556010000004','Adabi Meat Curry Powder 250g','Adabi','Chilli, coriander, cumin, fennel, turmeric, pepper, spices.','off'),
  ('9556010000005','Gardenia Original Classic Bread 400g','Gardenia','Wheat flour, water, sugar, yeast, emulsifier (E471), preservative (E282), salt.','off'),
  ('9556010000006','Vitagen Less Sugar Cultured Milk 5x125ml','Vitagen','Water, skimmed milk powder, sugar, glucose, live cultures, stabiliser.','off'),
  ('9556010000007','Yeo''s Chrysanthemum Tea 1.5L','Yeo''s','Water, sugar, chrysanthemum extract, flavouring.','off'),
  ('9556010000008','Dutch Lady Full Cream Milk 1L','Dutch Lady','Full cream milk, vitamins A & D.','off'),
  ('9556010000009','Marigold HL Milk 1L','Marigold','Skimmed milk, vegetable fat, milk solids, vitamins.','off'),
  ('9556010000010','Mister Potato Original Crisps 75g','Mister Potato','Potato, palm oil, salt, flavour enhancer (E621), sugar.','off'),
  ('9556010000011','Munchy''s Lexus Cream Crackers 190g','Munchy''s','Wheat flour, palm oil, sugar, salt, raising agents, emulsifier (E471).','off'),
  ('9556010000012','Mamee Monster Snack Noodle 25g','Mamee','Wheat flour, palm oil, salt, flavour enhancer (E621), seasoning.','off'),
  ('9556010000013','Twisties Curry 60g','Twisties','Corn, palm oil, seasoning, flavour enhancer (E621), colour (E110).','off'),
  ('9556010000014','Kopiko Brown Coffee 3-in-1 25g','Kopiko','Sugar, non-dairy creamer (palm), instant coffee.','off'),
  ('9556010000015','Nescafe Original 3-in-1 20g','Nescafe','Sugar, non-dairy creamer (palm oil, glucose syrup), instant coffee.','off'),
  ('9556010000016','100 Plus Isotonic Drink 500ml','F&N','Water, sugar, minerals, acidity regulator, flavouring.','off'),
  ('9556010000017','Ribena Blackcurrant Cordial 1L','Ribena','Water, sugar, blackcurrant juice, vitamin C, acidity regulator.','off'),
  ('9556010000018','Spritzer Natural Mineral Water 600ml','Spritzer','Natural mineral water.','off'),
  ('9556010000019','Cintan Instant Noodles Sup Ayam 75g','Cintan','Wheat flour, palm oil, salt, flavour enhancer (E621), seasoning.','off'),
  ('9556010000020','Jacker Corn Snack Cheese 60g','Jacker','Corn, palm oil, cheese powder, salt, flavour enhancer (E621).','off')
on conflict (barcode) do nothing;

insert into public.verdicts (product_id, flags, rating, verdict, summary_bm, summary_en, model) values
  ('9556010000001','[{"name":"High added sugar","kind":"sugar_sodium","note_bm":"Kandungan gula tambahan tinggi setiap hidangan.","note_en":"High added-sugar content per serving.","severity":"med"}]',5.4,'WASPADA','Serbuk malt coklat bergula tinggi. Minum secara sederhana.','Sugary chocolate malt powder. Consume in moderation.','seed'),
  ('9556010000002','[{"e_number":"E621","name":"Monosodium Glutamate (MSG)","kind":"additive","note_bm":"Penambah perisa; sesetengah individu sensitif.","note_en":"Flavour enhancer; some report sensitivity.","severity":"med"},{"name":"High sodium","kind":"sugar_sodium","note_bm":"Kandungan natrium tinggi.","note_en":"High sodium content.","severity":"med"},{"e_number":"E102","name":"Tartrazine","kind":"additive","note_bm":"Pewarna sintetik.","note_en":"Synthetic colour.","severity":"low"}]',7.6,'ELAK','Mi segera dengan MSG, natrium tinggi dan pewarna sintetik.','Instant noodles with MSG, high sodium and synthetic colour.','seed'),
  ('9556010000003','[{"name":"Palm oil","kind":"additive","note_bm":"Mengandungi minyak sawit.","note_en":"Contains palm oil.","severity":"low"},{"name":"Added sugar","kind":"sugar_sodium","note_bm":"Gula tambahan.","note_en":"Added sugar.","severity":"med"}]',5.0,'WASPADA','Biskut sandwic bergula dan berminyak sawit. Sederhana.','Sugary palm-oil sandwich biscuit. Moderate.','seed'),
  ('9556010000004','[]',2.6,'SELAMAT','Rempah kari tulen tanpa bahan tambahan buatan.','Pure curry spice blend with no artificial additives.','seed'),
  ('9556010000005','[{"e_number":"E282","name":"Calcium Propionate","kind":"additive","note_bm":"Bahan pengawet roti.","note_en":"Bread preservative.","severity":"low"},{"e_number":"E471","name":"Mono- and diglycerides","kind":"additive","note_bm":"Pengemulsi.","note_en":"Emulsifier.","severity":"low"}]',4.2,'WASPADA','Roti dengan pengawet dan pengemulsi. Sederhana.','Bread with preservative and emulsifier. Moderate.','seed'),
  ('9556010000006','[{"name":"Added sugar","kind":"sugar_sodium","note_bm":"Gula tambahan.","note_en":"Added sugar.","severity":"med"}]',4.8,'WASPADA','Minuman kultur bergula. Minum secara sederhana.','Sweetened cultured-milk drink. Consume in moderation.','seed'),
  ('9556010000007','[{"name":"High added sugar","kind":"sugar_sodium","note_bm":"Kandungan gula tambahan tinggi.","note_en":"High added-sugar content.","severity":"med"}]',5.2,'WASPADA','Teh krisantemum bergula tinggi.','High-sugar chrysanthemum tea.','seed'),
  ('9556010000008','[]',2.2,'SELAMAT','Susu penuh krim biasa. Selamat diminum.','Plain full-cream milk. Safe to drink.','seed'),
  ('9556010000009','[]',2.4,'SELAMAT','Susu terpakai dengan vitamin. Selamat.','Filled milk with vitamins. Safe.','seed'),
  ('9556010000010','[{"e_number":"E621","name":"Monosodium Glutamate (MSG)","kind":"additive","note_bm":"Penambah perisa.","note_en":"Flavour enhancer.","severity":"med"},{"name":"High sodium","kind":"sugar_sodium","note_bm":"Natrium tinggi.","note_en":"High sodium.","severity":"med"}]',7.1,'ELAK','Kerepek berperisa dengan MSG dan natrium tinggi.','Flavoured crisps with MSG and high sodium.','seed'),
  ('9556010000011','[{"name":"Palm oil","kind":"additive","note_bm":"Minyak sawit.","note_en":"Palm oil.","severity":"low"},{"e_number":"E471","name":"Emulsifier","kind":"additive","note_bm":"Pengemulsi.","note_en":"Emulsifier.","severity":"low"}]',4.6,'WASPADA','Biskut kraker dengan minyak sawit. Sederhana.','Cream crackers with palm oil. Moderate.','seed'),
  ('9556010000012','[{"e_number":"E621","name":"Monosodium Glutamate (MSG)","kind":"additive","note_bm":"Penambah perisa.","note_en":"Flavour enhancer.","severity":"med"},{"name":"High sodium","kind":"sugar_sodium","note_bm":"Natrium tinggi.","note_en":"High sodium.","severity":"med"}]',7.3,'ELAK','Snek mi dengan MSG dan natrium tinggi.','Snack noodle with MSG and high sodium.','seed'),
  ('9556010000013','[{"e_number":"E621","name":"Monosodium Glutamate (MSG)","kind":"additive","note_bm":"Penambah perisa.","note_en":"Flavour enhancer.","severity":"med"},{"e_number":"E110","name":"Sunset Yellow FCF","kind":"additive","note_bm":"Pewarna sintetik.","note_en":"Synthetic colour.","severity":"med"}]',7.0,'ELAK','Snek jagung dengan MSG dan pewarna sintetik.','Corn snack with MSG and synthetic colour.','seed'),
  ('9556010000014','[{"name":"High added sugar","kind":"sugar_sodium","note_bm":"Gula tambahan tinggi.","note_en":"High added sugar.","severity":"med"},{"name":"Palm-based creamer","kind":"additive","note_bm":"Krimer berasaskan sawit.","note_en":"Palm-based creamer.","severity":"low"}]',5.8,'WASPADA','Kopi segera 3-dalam-1 bergula tinggi.','High-sugar 3-in-1 instant coffee.','seed'),
  ('9556010000015','[{"name":"High added sugar","kind":"sugar_sodium","note_bm":"Gula tambahan tinggi.","note_en":"High added sugar.","severity":"med"},{"name":"Palm-based creamer","kind":"additive","note_bm":"Krimer berasaskan sawit.","note_en":"Palm-based creamer.","severity":"low"}]',5.6,'WASPADA','Kopi segera 3-dalam-1 bergula tinggi.','High-sugar 3-in-1 instant coffee.','seed'),
  ('9556010000016','[{"name":"Added sugar","kind":"sugar_sodium","note_bm":"Gula tambahan.","note_en":"Added sugar.","severity":"med"}]',4.4,'WASPADA','Minuman isotonik bergula. Sederhana.','Sweetened isotonic drink. Moderate.','seed'),
  ('9556010000017','[{"name":"High added sugar","kind":"sugar_sodium","note_bm":"Gula tambahan tinggi.","note_en":"High added sugar.","severity":"med"}]',5.5,'WASPADA','Kordial bergula tinggi.','High-sugar cordial.','seed'),
  ('9556010000018','[]',1.2,'SELAMAT','Air mineral tulen tanpa bahan tambahan. Selamat diminum.','Plain mineral water with no additives. Safe to drink.','seed'),
  ('9556010000019','[{"e_number":"E621","name":"Monosodium Glutamate (MSG)","kind":"additive","note_bm":"Penambah perisa.","note_en":"Flavour enhancer.","severity":"med"},{"name":"High sodium","kind":"sugar_sodium","note_bm":"Natrium tinggi.","note_en":"High sodium.","severity":"med"}]',6.9,'WASPADA','Mi segera dengan MSG dan natrium tinggi.','Instant noodles with MSG and high sodium.','seed'),
  ('9556010000020','[{"e_number":"E621","name":"Monosodium Glutamate (MSG)","kind":"additive","note_bm":"Penambah perisa.","note_en":"Flavour enhancer.","severity":"med"},{"name":"Palm oil","kind":"additive","note_bm":"Minyak sawit.","note_en":"Palm oil.","severity":"low"}]',5.0,'WASPADA','Snek jagung dengan MSG dan minyak sawit.','Corn snack with MSG and palm oil.','seed')
on conflict (product_id) do nothing;
