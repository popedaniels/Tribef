// Cloudinary direct-upload URL builder.
// The cloud name can be overridden per environment; the defaults preserve
// the cloud names previously hardcoded at each call site.
const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";

export function cloudinaryUploadUrl(
  cloudName: string = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "wisdomosara",
  resourceType: "image" | "video" | "auto" = "image"
): string {
  return `${CLOUDINARY_API_BASE}/${cloudName}/${resourceType}/upload`;
}
