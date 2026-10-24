import assert from "node:assert/strict";
import test from "node:test";

const {
  parseYouTubeVideoUrl,
  youTubeEmbedUrl,
  youTubeWatchUrl,
  youTubeThumbnailUrl,
  canonicalYouTubeUrl,
} = await import(new URL("./sermon-video.ts", import.meta.url).href);

const VIDEO_ID = "dQw4w9WgXcQ";

test("parses valid watch, short, and embed URLs", () => {
  assert.deepEqual(parseYouTubeVideoUrl(`https://www.youtube.com/watch?v=${VIDEO_ID}`), {
    ok: true,
    videoId: VIDEO_ID,
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://youtu.be/${VIDEO_ID}`), {
    ok: true,
    videoId: VIDEO_ID,
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://www.youtube.com/embed/${VIDEO_ID}`), {
    ok: true,
    videoId: VIDEO_ID,
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=42s&list=PLx`), {
    ok: true,
    videoId: VIDEO_ID,
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://m.youtube.com/watch?v=${VIDEO_ID}`), {
    ok: true,
    videoId: VIDEO_ID,
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://www.youtube.com/shorts/${VIDEO_ID}`), {
    ok: true,
    videoId: VIDEO_ID,
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`), {
    ok: true,
    videoId: VIDEO_ID,
  });
});

test("rejects malformed URLs and invalid video IDs", () => {
  assert.equal(parseYouTubeVideoUrl("").ok, false);
  assert.equal(parseYouTubeVideoUrl(null).ok, false);
  assert.equal(parseYouTubeVideoUrl("not a url").ok, false);
  assert.equal(parseYouTubeVideoUrl("https://www.youtube.com/watch").ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://www.youtube.com/watch?v=`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://www.youtube.com/watch?v=short`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://www.youtube.com/watch?v=${VIDEO_ID}!`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://youtu.be/`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://youtu.be/${VIDEO_ID}/extra`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`javascript:alert(1)`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://www.youtube.com/watch?v=${VIDEO_ID} with space`).ok, false);
});

test("rejects deceptive and unsupported hostnames", () => {
  assert.deepEqual(parseYouTubeVideoUrl(`https://youtube.com.evil.example/watch?v=${VIDEO_ID}`), {
    ok: false,
    reason: "unsupported_host",
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://fakeyoutube.com/watch?v=${VIDEO_ID}`), {
    ok: false,
    reason: "unsupported_host",
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://www.youtube.com.evil.example/embed/${VIDEO_ID}`), {
    ok: false,
    reason: "unsupported_host",
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://vimeo.com/123456789`), {
    ok: false,
    reason: "unsupported_host",
  });
  assert.deepEqual(parseYouTubeVideoUrl(`https://evil-youtu.be/${VIDEO_ID}`), {
    ok: false,
    reason: "unsupported_host",
  });
});

test("rejects arbitrary iframe and embed HTML injection attempts", () => {
  assert.equal(parseYouTubeVideoUrl(`<iframe src="https://www.youtube.com/embed/${VIDEO_ID}"></iframe>`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`<embed src="https://www.youtube.com/embed/${VIDEO_ID}">`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://www.youtube.com/embed/${VIDEO_ID}" onload="alert(1)`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`<script>alert(1)</script>https://youtu.be/${VIDEO_ID}`).ok, false);
  assert.equal(parseYouTubeVideoUrl(`https://user:pass@www.youtube.com/watch?v=${VIDEO_ID}`).ok, false);
});

test("generates embed, watch, and thumbnail URLs only from valid IDs", () => {
  assert.equal(youTubeEmbedUrl(VIDEO_ID), `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`);
  assert.equal(youTubeWatchUrl(VIDEO_ID), `https://www.youtube.com/watch?v=${VIDEO_ID}`);
  assert.equal(youTubeThumbnailUrl(VIDEO_ID), `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`);
  assert.equal(canonicalYouTubeUrl(VIDEO_ID), `https://www.youtube.com/watch?v=${VIDEO_ID}`);
  assert.equal(youTubeEmbedUrl("short"), null);
  assert.equal(youTubeWatchUrl(""), null);
  assert.equal(youTubeThumbnailUrl(`${VIDEO_ID}!`), null);
  assert.equal(canonicalYouTubeUrl("../evil"), null);
});
