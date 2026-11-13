-- Preserve the existing official Instagram and Threads footer profiles as
-- editable Studio records. Do not replace accounts already configured there.
insert into public.media_social_links (platform, label, url, sort_order, published)
select v.platform, v.label, v.url, v.sort_order, true
from (values
  ('instagram', 'Instagram', 'https://www.instagram.com/kerygma_Path/', 2),
  ('threads', 'Threads', 'https://www.threads.com/@kerygma_Path', 3)
) as v(platform, label, url, sort_order)
where not exists (
  select 1 from public.media_social_links existing where existing.platform = v.platform
);
