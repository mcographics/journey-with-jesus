-- Allow the complete Studio social-platform catalog; keep unpublished URL drafts hidden.
-- Platform IDs must match src/lib/social-platforms.ts.
alter table public.media_social_links
  drop constraint if exists media_social_links_platform_check;

alter table public.media_social_links
  add constraint media_social_links_platform_check
  check (platform = any (array[
    'youtube', 'facebook', 'instagram', 'threads', 'tiktok', 'x', 'bluesky', 'linkedin', 'pinterest', 'snapchat', 'reddit', 'tumblr', 'mastodon', 'bereal', 'mewe', 'truth_social', 'nextdoor', 'vk', 'okru', 'weibo', 'wechat', 'line', 'kakaotalk', 'lemon8', 'discord', 'telegram', 'whatsapp', 'signal', 'viber', 'matrix', 'revolt', 'guilded', 'lemmy', 'diaspora', 'quora', 'meetup', 'minds', 'gab', 'product_hunt', 'rumble', 'twitch', 'kick', 'vimeo', 'dailymotion', 'peertube', 'odysee', 'bitchute', 'bilibili', 'niconico', 'douyin', 'kuaishou', 'likee', 'clapper', 'trovo', 'behance', 'dribbble', 'artstation', 'deviantart', 'flickr', 'five_hundred_px', 'unsplash', 'vsco', 'pixelfed', 'cara', 'newgrounds', 'sketchfab', 'cgtrader', 'imgur', 'giphy', 'spotify', 'apple_podcasts', 'youtube_music', 'amazon_music', 'soundcloud', 'bandcamp', 'audiomack', 'mixcloud', 'iheartradio', 'tunein', 'podbean', 'castbox', 'patreon', 'kofi', 'buymeacoffee', 'substack', 'medium', 'wordpress', 'blogger', 'devto', 'hashnode', 'github', 'gitlab', 'stackoverflow', 'itch_io', 'gamejolt', 'steam', 'linktree', 'custom'
  ]));
