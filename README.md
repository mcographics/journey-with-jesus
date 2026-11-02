# Journey with Jesus

A static, responsive video library concept for Christian animated stories. The site is a separate project and is designed to deploy to its own GitHub Pages repository.

## Preview locally

Open `site/index.html` in a browser, or serve the `site` directory with any static HTTP server. The site has no build step or runtime dependencies.

## Publish with GitHub Pages

1. Create a new, separate GitHub repository for this site and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the publishing source.
3. The workflow in `.github/workflows/deploy-pages.yml` publishes the `site/` directory on each push to `main`.
4. GitHub will show the published address in **Settings → Pages**. A project repository is normally served below `https://<owner>.github.io/<repository>/`.

The page uses relative asset paths, so it works at the root of a domain and under a repository path. This folder is not connected to a GitHub remote yet.

## Add real episodes

Edit `site/videos.js`. Each item has a title, description, category, thumbnail, and `orientation` (`landscape` or `portrait`). Replace the clearly labelled sample entries with the creator's actual episode information.

For a playable item, add one or more direct media sources:

```js
sources: [
  { label: "720p", src: "https://media.example.com/story-720.mp4" },
  { label: "1080p", src: "https://media.example.com/story-1080.mp4" },
  { label: "4K", src: "https://media.example.com/story-4k.mp4" }
]
```

The player displays a quality menu when an episode has multiple sources. It starts with the lowest supplied resolution and lets viewers switch versions. Source URLs should be publicly reachable over HTTPS. Configure the media host to support byte-range requests so viewers can seek through long videos. The player preserves the video's portrait or landscape shape and fits it inside the available screen area.

Host full-resolution videos with a video/CDN provider that supports your bandwidth and audience. Keep large video masters outside this repository; GitHub Pages publishes the site files, while `videos.js` points to the hosted streams. The project currently contains illustrative artwork and sample listings only; no finished episodes are included.

## Project layout

- `site/` — all files served by GitHub Pages
- `site/videos.js` — editable video catalog
- `site/assets/` — original vector illustrations used as concept artwork
- `.github/workflows/deploy-pages.yml` — static GitHub Pages deployment
