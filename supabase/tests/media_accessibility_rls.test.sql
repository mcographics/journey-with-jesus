begin;
select plan(4);

insert into public.media_episodes (id, title, published, episode_number)
values
  ('accessibility-public-story', 'Published accessibility story', true, 901),
  ('accessibility-draft-story', 'Draft accessibility story', false, 902);

insert into public.media_captions (episode_id, language, label, storage_path)
values
  ('accessibility-public-story', 'en', 'English captions', 'accessibility-public-story/captions/public.vtt'),
  ('accessibility-draft-story', 'en', 'Draft captions', 'accessibility-draft-story/captions/draft.vtt');

insert into storage.objects (bucket_id, name)
values
  ('media-videos', 'accessibility-public-story/captions/public.vtt'),
  ('media-videos', 'accessibility-draft-story/captions/draft.vtt');

set local role anon;

select results_eq(
  $$select episode_id from public.media_captions order by episode_id$$,
  $$values ('accessibility-public-story'::text)$$,
  'anonymous visitors can read caption metadata for published episodes only'
);

select results_eq(
  $$select id from public.media_episodes where id like 'accessibility-%' order by id$$,
  $$values ('accessibility-public-story'::text)$$,
  'anonymous visitors cannot read draft episode transcript or ASL metadata'
);

select results_eq(
  $$select name from storage.objects where bucket_id = 'media-videos' and name like 'accessibility-%' order by name$$,
  $$values ('accessibility-public-story/captions/public.vtt'::text)$$,
  'anonymous visitors can sign caption files for published episodes only'
);

select throws_ok(
  $$insert into public.media_captions (episode_id, language, label, storage_path)
    values ('accessibility-public-story', 'fr', 'French captions', 'accessibility-public-story/captions/french.vtt')$$,
  '42501', null,
  'anonymous visitors cannot attach or change caption tracks'
);

select * from finish();
rollback;
