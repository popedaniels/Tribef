const { normaliseCampaignVideo, youtubeId } = require("../../utility/videoUrl");
it("accepts real YouTube links and our uploads, rejects look-alikes", () => {
  expect(normaliseCampaignVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  expect(normaliseCampaignVideo("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  expect(normaliseCampaignVideo("https://res.cloudinary.com/acme/video/upload/v1/clip.mp4")).toBe("https://res.cloudinary.com/acme/video/upload/v1/clip.mp4");
  expect(normaliseCampaignVideo("")).toBe("");
  for (const bad of ["https://evil.example/?youtube.com", "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ", "javascript:alert(1)//youtube.com", "http://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://evil.example/res.cloudinary.com/video/upload/x.mp4"]) {
    expect(normaliseCampaignVideo(bad)).toBeNull();
  }
  expect(youtubeId("https://www.youtube.com/embed/<script>")).toBeNull();
});
