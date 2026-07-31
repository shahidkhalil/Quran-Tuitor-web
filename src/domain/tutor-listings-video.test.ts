import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasListingIntroAudio,
  hasListingIntroVideo,
  isLikelyIntroAudioUrl,
  listingIntroVideoEmbedUrl,
} from "./tutor-listings";

describe("listing intro media helpers", () => {
  it("detects video presence", () => {
    assert.equal(hasListingIntroVideo({ intro_video_url: null }), false);
    assert.equal(hasListingIntroVideo({ intro_video_url: "  " }), false);
    assert.equal(
      hasListingIntroVideo({
        intro_video_url: "https://youtu.be/abcdefghijk",
      }),
      true,
    );
  });

  it("detects audio presence and validates URLs", () => {
    assert.equal(hasListingIntroAudio({ intro_audio_url: null }), false);
    assert.equal(
      hasListingIntroAudio({
        intro_audio_url: "https://res.cloudinary.com/demo/video/upload/v1/a.mp3",
      }),
      true,
    );
    assert.equal(
      isLikelyIntroAudioUrl("https://cdn.example.com/sample.mp3"),
      true,
    );
    assert.equal(
      isLikelyIntroAudioUrl("http://insecure.example.com/a.mp3"),
      false,
    );
    assert.equal(isLikelyIntroAudioUrl("https://example.com/page"), false);
  });

  it("builds youtube embeds", () => {
    assert.equal(
      listingIntroVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    assert.equal(
      listingIntroVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ"),
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    assert.equal(
      listingIntroVideoEmbedUrl("https://drive.google.com/file/d/x"),
      null,
    );
  });
});
