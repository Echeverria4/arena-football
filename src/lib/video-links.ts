export function normalizePublicVideoUrl(rawValue?: string | null) {
  const trimmedValue = String(rawValue ?? "").trim();

  if (!trimmedValue) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(candidate);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(videoUrl?: string | null) {
  const normalizedUrl = normalizePublicVideoUrl(videoUrl);

  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();

    if (hostname === "youtu.be") {
      const pathnameSegments = parsedUrl.pathname.split("/").filter(Boolean);
      return pathnameSegments[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      const pathnameSegments = parsedUrl.pathname.split("/").filter(Boolean);
      const [firstSegment, secondSegment] = pathnameSegments;

      if (
        firstSegment === "embed" ||
        firstSegment === "shorts" ||
        firstSegment === "live"
      ) {
        return secondSegment ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isYouTubeVideoUrl(videoUrl?: string | null) {
  return Boolean(extractYouTubeVideoId(videoUrl));
}

export function buildYouTubeEmbedUrl(videoUrl?: string | null) {
  const videoId = extractYouTubeVideoId(videoUrl);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}

export function buildYouTubeThumbnailUrl(videoUrl?: string | null) {
  const videoId = extractYouTubeVideoId(videoUrl);

  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function isRemoteVideoUrl(videoUrl?: string | null) {
  return Boolean(normalizePublicVideoUrl(videoUrl));
}
