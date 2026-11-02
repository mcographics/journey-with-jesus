(() => {
  "use strict";

  const items = Array.isArray(window.JWJ_VIDEOS) ? window.JWJ_VIDEOS : [];
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const grid = $("#video-grid");
  const shortsTrack = $("#shorts-track");
  const emptyState = $("#empty-state");
  const searchInput = $("#video-search");
  const sortSelect = $("#sort-select");
  const dialog = $("#watch-dialog");
  const stage = $("#watch-stage");
  const player = $("#video-player");
  const placeholder = $("#player-placeholder");
  const poster = $("#dialog-poster");
  const dialogTitle = $("#dialog-title");
  const dialogDescription = $("#dialog-description");
  const dialogCategory = $("#dialog-category");
  const qualityPicker = $("#quality-picker");
  const qualitySelect = $("#quality-select");
  const mobileMenu = $(".mobile-menu");
  const mobileNavigation = $("#mobile-navigation");

  let activeCategory = "all";
  let activeVideo = null;
  let toastTimer = 0;

  function safeMediaUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const parsed = new URL(value, window.location.href);
      if (parsed.protocol !== "https:" && parsed.origin !== window.location.origin) return null;
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  function validSources(video) {
    return (Array.isArray(video.sources) ? video.sources : [])
      .filter((source) => source && safeMediaUrl(source.src))
      .map((source) => ({
        label: String(source.label || "Auto"),
        src: safeMediaUrl(source.src)
      }))
      .sort((a, b) => qualityHeight(a.label) - qualityHeight(b.label));
  }

  function qualityHeight(label) {
    const match = label.match(/(\d+(?:\.\d+)?)\s*(k|p)?/i);
    if (!match) return Number.POSITIVE_INFINITY;
    const value = Number(match[1]);
    return match[2]?.toLowerCase() === "k" ? value * 1000 : value;
  }

  function formatLabel(video) {
    return video.orientation === "portrait" ? "9:16 · SHORT" : "16:9 · FILM";
  }

  function makeCard(video) {
    const card = document.createElement("article");
    card.className = "media-card";
    card.dataset.videoId = video.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "media-card-trigger";
    button.setAttribute("aria-label", `${video.sample ? "Sample preview" : "Play"}: ${video.title}`);

    const thumb = document.createElement("span");
    thumb.className = "card-thumb";
    const image = document.createElement("img");
    image.src = video.thumbnail;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    thumb.append(image);

    const vignette = document.createElement("span");
    vignette.className = "thumb-vignette";
    thumb.append(vignette);

    if (video.sample || validSources(video).length === 0) {
      const sample = document.createElement("span");
      sample.className = "sample-label";
      sample.textContent = "SAMPLE LISTING";
      thumb.append(sample);
    }

    const format = document.createElement("span");
    format.className = "format-label";
    format.textContent = formatLabel(video);
    thumb.append(format);

    const play = document.createElement("span");
    play.className = "play-hover";
    play.setAttribute("aria-hidden", "true");
    play.textContent = "▶";
    thumb.append(play);

    const info = document.createElement("div");
    info.className = "card-info";
    const mark = document.createElement("div");
    mark.className = "channel-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "✝";

    const copy = document.createElement("div");
    copy.className = "card-copy";
    const category = document.createElement("span");
    category.className = "card-category";
    category.textContent = video.category;
    const title = document.createElement("h3");
    const titleButton = document.createElement("button");
    titleButton.type = "button";
    titleButton.className = "card-title-button";
    titleButton.textContent = video.title;
    title.append(titleButton);
    const description = document.createElement("p");
    description.textContent = video.description;
    copy.append(category, title, description);
    info.append(mark, copy);
    button.append(thumb);
    button.addEventListener("click", () => openVideo(video));
    titleButton.addEventListener("click", () => openVideo(video));
    card.append(button, info);
    return card;
  }

  function makeShort(video) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "short-card";
    button.dataset.videoId = video.id;
    button.setAttribute("aria-label", `${video.sample ? "Sample preview" : "Play"}: ${video.title}`);

    const thumb = document.createElement("span");
    thumb.className = "short-thumb";
    const image = document.createElement("img");
    image.src = video.thumbnail;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    thumb.append(image);
    const play = document.createElement("span");
    play.className = "short-play";
    play.textContent = "▶";
    play.setAttribute("aria-hidden", "true");
    thumb.append(play);

    const copy = document.createElement("span");
    copy.className = "short-copy";
    const category = document.createElement("span");
    category.textContent = `${video.category} · ${video.sample ? "sample" : "short"}`;
    const title = document.createElement("strong");
    title.textContent = video.title;
    const description = document.createElement("small");
    description.textContent = video.description;
    copy.append(category, title, description);
    button.append(thumb, copy);
    button.addEventListener("click", () => openVideo(video));
    return button;
  }

  function matches(video, query) {
    const haystack = `${video.title} ${video.description} ${video.category}`.toLocaleLowerCase();
    return haystack.includes(query);
  }

  function render() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const sortMode = sortSelect.value;
    const visibleVideos = items.filter((video) =>
      video.orientation !== "portrait" &&
      (activeCategory === "all" || video.category === activeCategory) &&
      matches(video, query)
    );
    const visibleShorts = items.filter((video) =>
      video.orientation === "portrait" &&
      (activeCategory === "all" || video.category === activeCategory) &&
      matches(video, query)
    );

    if (sortMode === "title") visibleVideos.sort((a, b) => a.title.localeCompare(b.title));
    else visibleVideos.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

    grid.replaceChildren(...visibleVideos.map(makeCard));
    emptyState.hidden = visibleVideos.length > 0;
    emptyState.textContent = visibleShorts.length > 0
      ? "No landscape films in this selection yet. Matching short stories are shown below."
      : "No stories match that search yet. Try another word or clear your filters.";
    shortsTrack.replaceChildren(...(visibleShorts.length ? visibleShorts.map(makeShort) : []));
    if (visibleShorts.length === 0) {
      const note = document.createElement("p");
      note.className = "shorts-empty";
      note.textContent = query ? "No short films match that search yet." : "Short films will appear here.";
      shortsTrack.append(note);
    }
  }

  function setCategory(category) {
    activeCategory = category || "all";
    $$(".filter-chip").forEach((chip) => {
      const selected = chip.dataset.filter === activeCategory;
      chip.classList.toggle("selected", selected);
      chip.setAttribute("aria-pressed", String(selected));
    });
    render();
  }

  function openVideo(video) {
    activeVideo = video;
    dialogTitle.textContent = video.title;
    dialogDescription.textContent = video.description;
    dialogCategory.textContent = `${video.category} · ${formatLabel(video)}`;
    stage.classList.toggle("portrait", video.orientation === "portrait");
    poster.src = video.thumbnail;
    poster.hidden = false;

    const sources = validSources(video);
    player.pause();
    player.removeAttribute("src");
    player.replaceChildren();
    player.hidden = true;
    qualityPicker.hidden = sources.length < 2;
    qualitySelect.replaceChildren();

    if (sources.length === 0) {
      placeholder.hidden = false;
      placeholder.querySelector(".placeholder-title").textContent = video.sample ? "Sample story preview" : "A story is waiting";
      placeholder.querySelector(".placeholder-note").textContent = "Add this episode's hosted video source in site/videos.js to enable playback.";
    } else {
      placeholder.hidden = true;
      poster.hidden = true;
      player.hidden = false;
      sources.forEach((source, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = source.label;
        qualitySelect.append(option);
      });
      player.src = sources[0].src;
      player.load();
      qualitySelect.onchange = () => {
        const currentTime = player.currentTime || 0;
        const wasPlaying = !player.paused;
        const selectedSource = sources[Number(qualitySelect.value)];
        if (!selectedSource) return;
        player.src = selectedSource.src;
        player.load();
        player.addEventListener("loadedmetadata", function restorePlayback() {
          player.currentTime = Math.min(currentTime, player.duration || currentTime);
          if (wasPlaying) player.play().catch(() => {});
        }, { once: true });
      };
    }
    if (!dialog.open) dialog.showModal();
  }

  function closeVideo() {
    player.pause();
    player.removeAttribute("src");
    player.replaceChildren();
    player.load();
    activeVideo = null;
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $$(".filter-chip").forEach((chip) => chip.addEventListener("click", () => setCategory(chip.dataset.filter)));
  searchInput.addEventListener("input", render);
  $(".search-form").addEventListener("submit", (event) => event.preventDefault());
  sortSelect.addEventListener("change", render);
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", closeVideo);

  $$("[data-category-link]").forEach((link) => link.addEventListener("click", () => {
    setCategory(link.dataset.categoryLink);
    scrollTo("stories");
  }));
  $$("[data-collection-filter]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    const category = link.dataset.collectionFilter;
    setCategory(category);
    scrollTo(category === "Faith & life" ? "shorts" : "stories");
  }));
  $$("[data-nav-filter]").forEach((link) => link.addEventListener("click", () => {
    if (link.dataset.navFilter === "shorts") {
      scrollTo("shorts");
    } else {
      setCategory("all");
      scrollTo("stories");
    }
    mobileNavigation.hidden = true;
    mobileMenu.setAttribute("aria-expanded", "false");
  }));

  mobileMenu.addEventListener("click", () => {
    const opening = mobileNavigation.hidden;
    mobileNavigation.hidden = !opening;
    mobileMenu.setAttribute("aria-expanded", String(opening));
  });
  document.addEventListener("click", (event) => {
    if (mobileNavigation.hidden || mobileNavigation.contains(event.target) || mobileMenu.contains(event.target)) return;
    mobileNavigation.hidden = true;
    mobileMenu.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (event.key === "/" && !isTyping && !dialog.open) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  render();
})();
