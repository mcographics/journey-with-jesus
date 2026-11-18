-- Keep the published table aligned with the public character dossiers.
-- Removed dossiers remain available to administrators as drafts; Eric is the public second card.
update public.media_characters
set published = false,
    sort_order = 99
where id in ('mary-mother-of-jesus', 'simon-peter');

insert into public.media_characters
  (id, name, role, summary, scripture_references, portrait_url, sort_order, published)
values
  ('eric-oberhausen', 'Eric', 'The story’s main character',
   'A curious traveler who follows Jesus, asks sincere questions, and grows in faith along the way.',
   'Matthew 7:7', 'https://kerygmapath.com/images/eric-oberhausen-portrait.webp', 2, true),
  ('adam', 'Adam', 'The First Man',
   'Created by God from the dust of the ground and given the breath of life, Adam was the first man. Placed in the Garden of Eden, he was entrusted with caring for God’s creation. His story marks the beginning of humanity’s journey through creation, temptation, the Fall, and the need for redemption.',
   'Genesis 2–3', 'https://kerygmapath.com/images/adam-portrait.webp', 3, true),
  ('eve', 'Eve', 'The First Woman',
   'Formed by God and brought to Adam, Eve was the first woman and his companion in the Garden of Eden. Her story includes the serpent’s temptation, the Fall, and the first generations of humanity beyond Eden.',
   'Genesis 2–4', 'https://kerygmapath.com/images/eve-portrait.webp', 4, true),
  ('samson', 'Samson', 'A Judge of Israel',
   'Set apart from birth as a Nazirite, Samson was called to begin Israel’s deliverance from the Philistines. His great strength was matched by costly choices, and betrayal left him captive. In his final prayer, he asked God for strength once more.',
   'Judges 13–16', 'https://kerygmapath.com/images/samson-portrait.webp', 5, true),
  ('david', 'David', 'Shepherd, musician, and king of Israel',
   'Chosen while tending his father’s sheep, David served Saul, faced Goliath, and later became king of Israel. His life holds courage, hardship, worship, and a lasting call to repentance.',
   '1 Samuel 16–17 · 2 Samuel 5; 11–12 · Psalms',
   'https://kerygmapath.com/images/david-portrait.webp', 6, true)
on conflict (id) do nothing;

update public.media_characters set sort_order = 1 where id = 'jesus-of-nazareth';
update public.media_characters set sort_order = 2 where id = 'eric-oberhausen';
update public.media_characters set sort_order = 3 where id = 'adam';
update public.media_characters set sort_order = 4 where id = 'eve';
update public.media_characters set sort_order = 5 where id = 'samson';
update public.media_characters set sort_order = 6 where id = 'david';
update public.media_characters set sort_order = 7 where id = 'john-the-baptist';
update public.media_characters set sort_order = 8 where id = 'mary-magdalene';
update public.media_characters set sort_order = 9 where id = 'beloved-disciple';
