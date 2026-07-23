const CHANNEL_ID = "UCzvfQahUozA6xOzMd3uQrCQ";

export default async () => {
  const apiKey = Netlify.env.get("YOUTUBE_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "YouTube API key is missing." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
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
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${apiKey}`
    );

    if (!playlistResponse.ok) {
      throw new Error("Unable to retrieve the latest sermon.");
    }

    const playlistData = await playlistResponse.json();
    const latestVideo = playlistData.items?.[0]?.snippet;

    if (!latestVideo) {
      throw new Error("No sermon videos were found.");
    }

    const videoId = latestVideo.resourceId.videoId;

    return new Response(
      JSON.stringify({
        title: latestVideo.title,
        description: latestVideo.description,
        publishedAt: latestVideo.publishedAt,
        thumbnail:
          latestVideo.thumbnails?.maxres?.url ||
          latestVideo.thumbnails?.high?.url ||
          latestVideo.thumbnails?.medium?.url,
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
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
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};