alter table public.media_team_members
  add column if not exists role_fr text not null default '',
  add column if not exists bio_fr text not null default '',
  add column if not exists role_es text not null default '',
  add column if not exists bio_es text not null default '';

update public.media_team_members
set role_fr = 'Fondateur',
    bio_fr = 'Eric Oberhausen est le fondateur de Journey with Jesus, un projet de narration animée qui partage les Écritures et la vie de Jésus.',
    role_es = 'Fundador',
    bio_es = 'Eric Oberhausen es el fundador de Journey with Jesus, un proyecto de narración animada que comparte las Escrituras y la vida de Jesús.'
where id = 'eric-oberhausen';

update public.media_team_members
set role_fr = 'Rédacteur / Webmestre',
    bio_fr = 'Kenneth Salmon est rédacteur et webmestre. Il révise le contenu du site et assure la présence en ligne de Journey with Jesus.',
    role_es = 'Editor / Webmaster',
    bio_es = 'Kenneth Salmon es editor y webmaster. Edita el contenido del sitio y mantiene Journey with Jesus en línea.'
where id = 'kenneth-salmon';
