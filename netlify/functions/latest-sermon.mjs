const ORIGIN = "https://live.irvingcollege.church";
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, max-age=0" };

async function getJson(path) {
  const response = await fetch(ORIGIN + path, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Video service returned " + response.status);
  return response.json();
}

export default async () => {
  const [statusResult, catalogResult] = await Promise.allSettled([
    getJson("/api/status"),
    getJson("/sermons/catalog.json")
  ]);

  const online = statusResult.status === "fulfilled" && statusResult.value.online === true;
  const sermons = catalogResult.status === "fulfilled" && Array.isArray(catalogResult.value)
    ? catalogResult.value.filter((item) => {
        if (!item || typeof item.title !== "string" || typeof item.date !== "string" || typeof item.url !== "string") return false;
        try {
          const url = new URL(item.url);
          return url.origin === ORIGIN && url.pathname.startsWith("/sermons/") && url.pathname.endsWith(".mp4");
        } catch { return false; }
      }).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  if (statusResult.status === "rejected") console.error("Owncast status unavailable:", statusResult.reason);
  if (catalogResult.status === "rejected") console.error("Sermon catalog unavailable:", catalogResult.reason);

  return new Response(JSON.stringify({
    online,
    liveUrl: ORIGIN + "/embed/video",
    latestSermon: sermons[0] || null,
    sermons,
    statusAvailable: statusResult.status === "fulfilled"
  }), { status: statusResult.status === "rejected" && catalogResult.status === "rejected" ? 503 : 200, headers });
};
