import { cloudinaryUploadUrl } from "../cloudinary";

describe("cloudinaryUploadUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("builds an image upload URL with the default cloud", () => {
    expect(cloudinaryUploadUrl()).toBe(
      "https://api.cloudinary.com/v1_1/wisdomosara/image/upload"
    );
  });

  it("honours NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "mycloud";
    // Re-import so the default parameter re-reads the env.
    jest.isolateModules(() => {
      const { cloudinaryUploadUrl: fresh } = require("../cloudinary");
      expect(fresh()).toBe("https://api.cloudinary.com/v1_1/mycloud/image/upload");
    });
  });

  it("supports explicit cloud and resource type", () => {
    expect(cloudinaryUploadUrl("dlanmi4el")).toBe(
      "https://api.cloudinary.com/v1_1/dlanmi4el/image/upload"
    );
    expect(cloudinaryUploadUrl("wisdomosara", "auto")).toBe(
      "https://api.cloudinary.com/v1_1/wisdomosara/auto/upload"
    );
  });
});
