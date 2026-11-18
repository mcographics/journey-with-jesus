export const socialPreview = {
  url: "https://kerygmapath.com/images/kerygma-path-share-20261117.jpg",
  width: 1600,
  height: 900,
  alt: "Kerygma Path Animation Studio — Jesus illustrated from sketch to finished animation with blue and gold light trails.",
};

export function shareLinks(url: string, title: string) {
  const link = (base: string, params: Record<string, string>) => `${base}?${new URLSearchParams(params)}`;
  const text = `${title}\n${url}`;
  return [
    { name: "Facebook", href: link("https://www.facebook.com/sharer/sharer.php", { u: url }) },
    { name: "X", href: link("https://x.com/intent/tweet", { url, text: title }) },
    { name: "WhatsApp", href: link("https://api.whatsapp.com/send", { text }) },
    { name: "Telegram", href: link("https://t.me/share/url", { url, text: title }) },
    { name: "LinkedIn", href: link("https://www.linkedin.com/sharing/share-offsite/", { url }) },
    { name: "Bluesky", href: link("https://bsky.app/intent/compose", { text }) },
    { name: "Threads", href: link("https://www.threads.net/intent/post", { text }) },
    { name: "Reddit", href: link("https://www.reddit.com/submit", { url, title }) },
    { name: "Pinterest", href: link("https://www.pinterest.com/pin/create/button/", { url, media: socialPreview.url, description: title }) },
    { name: "Tumblr", href: link("https://www.tumblr.com/widgets/share/tool", { canonicalUrl: url, title, posttype: "link" }) },
  ];
}
