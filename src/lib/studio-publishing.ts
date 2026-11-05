/**
 * A story can publish with either an uploaded video or a YouTube link.
 * When a direct upload is still pending, save the story as a draft first so
 * the uploader has an episode ID to attach the video to.
 */
export function resolveStoryPublication(requestedPublish: boolean, hasUploadedVideo: boolean, youtubeId: string | null) {
  const savedAsDraft = requestedPublish && !hasUploadedVideo && !youtubeId;
  return {
    published: requestedPublish && !savedAsDraft,
    savedAsDraft,
  };
}
