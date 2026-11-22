-- Add Mary Yu as an image-only character card after the current published list.
insert into public.media_characters
  (id, name, role, summary, scripture_references, portrait_url, sort_order, published)
values
  (
    'mary-yu',
    'Mary Yu',
    'Original character',
    '',
    '',
    'https://kerygmapath.com/images/mary-yu-portrait.webp',
    (select coalesce(max(sort_order), 0) + 1 from public.media_characters where published),
    true
  )
on conflict (id) do nothing;
