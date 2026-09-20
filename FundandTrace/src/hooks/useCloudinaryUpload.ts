import { useState } from "react";
import axios from "axios";
import { cloudinaryUploadUrl } from "../utils/cloudinary";

export const useCloudinaryUpload = (uploadPreset = "campaignImage", cloudName?: string) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setSelectedFile(reader.result as string);
    };
  };

  const upload = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("upload_preset", uploadPreset);
      formData.append("file", file);
      const res = await axios.post<{ secure_url: string }>(
        cloudinaryUploadUrl(cloudName as string),
        formData
      );
      setLoading(false);
      if (res?.data?.secure_url) {
        setUploadedUrl(res.data.secure_url);
        previewFile(file);
        return res.data.secure_url;
      }
      previewFile(file);
      return "";
    } catch (error) {
      setLoading(false);
      return "";
    }
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>, onUrl?: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url && onUrl) onUrl(url);
  };

  const clear = () => {
    setSelectedFile(null);
    setUploadedUrl("");
  };

  return { loading, selectedFile, setSelectedFile, uploadedUrl, setUploadedUrl, previewFile, upload, handleSelect, clear };
};
