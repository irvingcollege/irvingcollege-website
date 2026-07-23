 async function loadSermons() {
      const response = await fetch("/.netlify/functions/latest-sermon");
      const data = await response.json();

      const featured = data.latestSermon;
      const sermons = data.sermons;

      document.getElementById("featured-sermon").innerHTML = `
        <div class="featured-sermon-card">
          <img src="${featured.thumbnail}" alt="${featured.title}">
          <div class="featured-content">
            <p class="series">${featured.series}</p>
            <h2>${featured.title}</h2>
            <p>${featured.scripture}</p>
            <p>${featured.speaker}</p>
           <a
  class="button"
  href="${featured.videoUrl}"
  target="_blank"
  rel="noopener noreferrer"
>
  ▶ Watch on YouTube
</a>
          </div>
        </div>
      `;

      document.getElementById("sermon-grid").innerHTML =
        sermons
          .slice(1)
          .map(
            (sermon) => `
            <article class="sermon-card">
              <img src="${sermon.thumbnail}" alt="${sermon.title}">
              <div class="sermon-card-content">
                <p class="series">${sermon.series}</p>
                <h3>${sermon.title}</h3>
                <p>${sermon.scripture}</p>
                <a href="${sermon.videoUrl}" target="_blank">
                  Watch →
                </a>
              </div>
            </article>
          `
          )
          .join("");
    }

    loadSermons();