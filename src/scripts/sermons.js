const endpoint = "/.netlify/functions/latest-sermon";
const featured = document.getElementById("featured-sermon");
const grid = document.getElementById("sermon-grid");
let currentKey = "";

function makeVideo(sermon) {
  const video = document.createElement("video");
  video.src = sermon.url;
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.style.cssText = "width:100%;aspect-ratio:16/9;background:#111;border-radius:12px;display:block";
  return video;
}

function makeLink(href, label) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "button";
  link.textContent = label;
  return link;
}

async function loadSermons() {
  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("Video service unavailable");
    const data = await response.json();
    const newest = data.latestSermon;
    const key = (data.online ? "live" : "offline") + ":" + (newest?.url || "none");
    if (key === currentKey) return;
    currentKey = key;
    featured.replaceChildren();
    grid.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = data.online ? "Watch Live Worship" : newest?.title || "Recent Worship";
    featured.append(heading);
    if (data.online) {
      const iframe = document.createElement("iframe");
      iframe.src = data.liveUrl;
      iframe.title = "Irving College Baptist Church livestream";
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.style.cssText = "width:100%;aspect-ratio:16/9;border:0;border-radius:12px";
      featured.append(iframe, makeLink("https://live.irvingcollege.church", "Open Livestream"));
    } else if (newest) {
      featured.append(makeVideo(newest), makeLink(newest.url, "Open Recording"));
    } else {
      const message = document.createElement("p");
      message.textContent = "No recordings are available right now.";
      featured.append(message);
    }

    const sermons = Array.isArray(data.sermons) ? data.sermons : [];
    for (const sermon of sermons.slice(data.online ? 0 : 1)) {
      const card = document.createElement("article");
      card.className = "sermon-card";
      const body = document.createElement("div");
      body.className = "sermon-card-content";
      const title = document.createElement("h3");
      title.textContent = sermon.title;
      const date = document.createElement("p");
      date.textContent = sermon.date;
      body.append(title, date, makeLink(sermon.url, "Watch Recording"));
      card.append(body);
      grid.append(card);
    }
    if (!grid.children.length) grid.textContent = "More recordings will appear here as they are archived.";
  } catch (error) {
    console.error(error);
    if (!currentKey) {
      featured.textContent = "Worship videos are temporarily unavailable.";
      grid.textContent = "Please check back later.";
    }
  }
}

loadSermons();
window.setInterval(loadSermons, 30000);
