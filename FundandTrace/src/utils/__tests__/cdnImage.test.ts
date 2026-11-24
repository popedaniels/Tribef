import { cdnImage, responsiveImage } from "../cloudinary";

const U = "https://res.cloudinary.com/wisdomosara/image/upload/v1700000000/campaigns/roof.jpg";

describe("campaign image delivery", () => {
  it("asks Cloudinary for a sized, auto-format, auto-quality image", () => {
    expect(cdnImage(U, 640)).toBe("https://res.cloudinary.com/wisdomosara/image/upload/f_auto,q_auto,c_limit,w_640/v1700000000/campaigns/roof.jpg");
  });
  it("leaves other URLs and already-transformed ones alone", () => {
    expect(cdnImage("/images/stories/water_story.jpg", 640)).toBe("/images/stories/water_story.jpg");
    expect(cdnImage("https://example.com/a.jpg", 640)).toBe("https://example.com/a.jpg");
    const t = "https://res.cloudinary.com/x/image/upload/w_200,c_fill/v1/a.jpg";
    expect(cdnImage(t, 640)).toBe(t);
    expect(cdnImage(undefined, 640)).toBe("");
  });
  it("builds a srcset only for Cloudinary images", () => {
    expect(responsiveImage(U, [360, 720], "100vw")).toEqual({
      srcSet: expect.stringContaining("w_360/v1700000000/campaigns/roof.jpg 360w"),
      sizes: "100vw",
    });
    expect(responsiveImage("/images/a.jpg", [360], "100vw")).toEqual({});
  });
});
