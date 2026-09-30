# Fancy a Trip? — фотографии Symbols

Проверено: 2026-09-29. Мест: **196**; актуальных Symbols: **478**; выбранных фотографий: **447**; без фото: **31**. У каждого места есть минимум одна выбранная фотография.

После миграции названий по карте сохранены все 400 фотографий для неизменённых Symbols и выбраны 42 новых фото из Pexels. Затем по точным ID пользователя добавлены ещё пять. В Dominica и Vanuatu две записи без фото заменены одним новым Symbol на место; в Comoros, Equatorial Guinea и Eswatini Symbol заменён один к одному.

После повторного `sync:airtable` 2026-09-29 эти пять локальных названий были перезаписаны старыми значениями, а последующий `validate` удалил их фото как устаревшие пары. Названия и точные URL восстановлены; импорт теперь сохраняет эти пять явных пользовательских замен по стабильным ID записей и останавливается, если исходные Symbols изменятся неожиданно.

Первые 42 кадра вручную проверены по содержанию, ориентации, уникальности и пригодности для туристической карточки; география сверялась с метаданными там, где они были доступны. Последние пять назначены по точным ID пользователя без поиска альтернатив. Для них Pexels API подтвердил горизонтальную ориентацию и вернул URL `src.large`. У фото Bioko Island (3030308) в метаданных нет подтверждения конкретного острова; оно назначено по прямому указанию пользователя.

Скрипт `place-symbol-images.mjs` проверяет текущие пары и глобальную уникальность Pexels ID. В production dataset записаны только выбранные URL.

## Новые назначения

- Alexander Nevsky Cathedral — Pexels 9550519
- Waikiki — Pexels 5007314
- Pico do Arieiro — Pexels 33232305
- Old San Juan — Pexels 15306385
- Skopje Old Bazaar — Pexels 3581826
- Ashgabat — Pexels 28707997
- Banjul — Pexels 16562852
- Punta Cana beaches — Pexels 2646067
- Santo Domingo Colonial Zone — Pexels 33012870
- Gamla Stan — Pexels 29138596
- Stockholm archipelago — Pexels 32282314
- Punta del Este — Pexels 18013781
- Ganvie stilt village — Pexels 8655016
- Gyeongbokgung Palace — Pexels 37968751
- Anse Source d'Argent — Pexels 5044865
- kangaroo — Pexels 39628365
- Matterhorn — Pexels 18861249
- Goa beaches — Pexels 28368719
- Asuncion — Pexels 34298766
- Vilnius Old Town — Pexels 28975990
- Mount Titano — Pexels 36930262
- Salvador old town — Pexels 14059770
- Goree Island — Pexels 36508969
- Lake Retba — Pexels 35594683
- Santiago skyline — Pexels 37184336
- Santa Ana Volcano — Pexels 37245216
- Quito Old Town — Pexels 34134360
- Mindelo — Pexels 13636689
- Luanda skyline — Pexels 7909269
- Maracas Bay — Pexels 30826615
- Basilica of Our Lady of Peace — Pexels 6322447
- Le Morne Brabant — Pexels 17937827
- Baffin Island — Pexels 178837
- Roatan — Pexels 1630334
- Frigate Bay — Pexels 38903642
- Blue Mountains — Pexels 9158428
- black sand beaches — Pexels 36955224
- Berat old town — Pexels 38001085
- Cartagena old town — Pexels 11815910
- Lome waterfront — Pexels 6056739
- Milford Sound — Pexels 14375108
- Belgrade Fortress — Pexels 34432819

## Назначения по точным ID пользователя

- Dominica — coastal cliffs — Pexels 33991544
- Vanuatu — tropical islands — Pexels 12921445
- Comoros — island coastline — Pexels 1854713
- Equatorial Guinea — Bioko Island — Pexels 3030308
- Eswatini — Manzini countryside — Pexels 39382160

## Текущие пары без фото

- Zambia — Zambezi River
- Zimbabwe — Hwange National Park
- Cameroon — Mount Cameroon
- Saint Vincent and the Grenadines — La Soufriere volcano
- Marshall Islands — Majuro lagoon
- Guyana — Georgetown
- Guinea — Fouta Djallon
- Fiji — Mamanuca Islands
- Mozambique — Bazaruto Archipelago
- Nicaragua — Granada
- Suriname — Suriname River
- Samoa — To Sua Ocean Trench
- Gabon — Libreville waterfront
- Belize — Caye Caulker
- Tuvalu — Funafuti lagoon
- Timor-Leste — Cristo Rei of Dili
- Antigua and Barbuda — Shirley Heights
- Djibouti — Djibouti City waterfront
- Togo — Kpalime waterfalls
- Cabo Verde — Pico do Fogo
- Micronesia — Chuuk Lagoon
- Palau — coral reefs
- Angola — Kalandula Falls
- São Tomé and Príncipe — Sao Tome rainforest
- Latvia — Riga Central Market
- Mauritius — Chamarel Seven Colored Earth
- Saint Kitts and Nevis — Mount Liamuiga
- Jamaica — Dunn's River Falls
- Lesotho — Maletsunyane Falls
- Kiribati — Tarawa lagoon
- Tonga — Vava'u islands

Для этих 31 пар не найден подходящий кадр в просмотренной выдаче Pexels. Это не означает, что подходящих фотографий нет вообще.
