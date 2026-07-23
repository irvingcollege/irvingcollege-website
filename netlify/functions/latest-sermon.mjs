const CHANNEL_ID = "UCzvfQahUozA6xOzMd3uQrCQ";
const NUMBER_OF_SERMONS = 12;

function findDescriptionField(description, fieldName) {
  if (!description) return "";

  const line = description
    .split("\n")
    .find((item) =>
      item.trim().toLowerCase().startsWith(`${fieldName.toLowerCase()}:`)
    );

  if (!line) return "";

  return line.substring(line.indexOf(":") + 1).trim();
}

export default async () => {
  const apiKey = Netlify.env.get("YOUTUBE_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "YouTube API key is missing.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${apiKey}`
    );

    if (!channelResponse.ok) {
      throw new Error("Unable to retrieve YouTube channel information.");
    }

    const channelData = await channelResponse.json();

    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error("The channel uploads playlist could not be found.");
    }

    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${NUMBER_OF_SERMONS}&key=${apiKey}`
    );

    if (!playlistResponse.ok) {
      throw new Error("Unable to retrieve sermons from YouTube.");
    }

    const playlistData = await playlistResponse.json();

    const sermons = (playlistData.items || [])
      .map((item) => {
        const video = item.snippet;
        const videoId = video?.resourceId?.videoId;

        if (!video || !videoId) return null;

        const description = video.description || "";

        return {
          title: video.title,
          description,
          publishedAt: video.publishedAt,
          thumbnail:
            video.thumbnails?.maxres?.url ||
            video.thumbnails?.high?.url ||
            video.thumbnails?.medium?.url ||
            video.thumbnails?.default?.url,
          videoId,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          scripture:
            findDescriptionField(description, "Scripture") ||
            "Scripture not listed",
          speaker:
            findDescriptionField(description, "Speaker") ||
            "Pastor Ryan",
          series:
            findDescriptionField(description, "Series") ||
            "Standalone Messages",
          week: findDescriptionField(description, "Week"),
        };
      })
      .filter(Boolean);

    if (sermons.length === 0) {
      throw new Error("No sermon videos were found.");
    }

    return new Response(
      JSON.stringify({
        latestSermon: sermons[0],
        sermons,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=900",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};