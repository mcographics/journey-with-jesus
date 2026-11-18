-- Add the Apostle John dossier after David and keep John the Baptist distinct.
insert into public.media_characters
  (id, name, role, summary, scripture_references, portrait_url, sort_order, published)
values
  ('john-the-apostle', 'John the Apostle', 'Apostle of Jesus',
   'The son of Zebedee and brother of James, John left his nets to follow Jesus. One of the Twelve, he witnessed key moments in Jesus’ ministry and became a steady witness to the risen Christ.',
   'Mark 1:19–20 · 5:37 · 9:2 · Galatians 2:9',
   'https://kerygmapath.com/images/john-apostle-portrait.webp', 7, true)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  summary = excluded.summary,
  scripture_references = excluded.scripture_references,
  portrait_url = excluded.portrait_url,
  sort_order = excluded.sort_order,
  published = excluded.published;

update public.media_characters set sort_order = 1 where id = 'jesus-of-nazareth';
update public.media_characters set sort_order = 2 where id = 'eric-oberhausen';
update public.media_characters set sort_order = 3 where id = 'adam';
update public.media_characters set sort_order = 4 where id = 'eve';
update public.media_characters set sort_order = 5 where id = 'samson';
update public.media_characters set sort_order = 6 where id = 'david';
update public.media_characters set sort_order = 7 where id = 'john-the-apostle';
update public.media_characters set sort_order = 8 where id = 'john-the-baptist';
update public.media_characters set sort_order = 9 where id = 'mary-magdalene';
update public.media_characters set sort_order = 10 where id = 'beloved-disciple';
