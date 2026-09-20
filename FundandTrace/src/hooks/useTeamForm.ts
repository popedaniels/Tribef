import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { loadStartCampaign, selectStartCampaignState } from "../../store/slices/startCampaignSlice";
import { startCampaignActions } from "../../store/slices/startCampaignSlice";
import { useAppDispatch } from "../../store/hooks";
import { toast } from "../../store/slices/ToastSlice";
import axios from "axios";
import { cloudinaryUploadUrl } from "../utils/cloudinary";
import { useTeamLocation } from "./useTeamLocation";

export const useTeamForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { startCampaign } = useSelector(selectStartCampaignState) as any;

  const [campaignId, setCampaignId] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(true);
  const [second, setSecond] = useState(false);

  const location = useTeamLocation();

  useEffect(() => {
    const storedCampaignId = localStorage.getItem("campaignId") || "";
    setCampaignId(storedCampaignId);
    dispatch(loadStartCampaign(storedCampaignId) as any);
  }, [dispatch]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const file = e.target.files![0];
      if (!file) {
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("upload_preset", "campaignImage");
      formData.append("file", file);
      const url = await axios.post<{ secure_url: string }>(cloudinaryUploadUrl(), formData);
      setLoading(false);

      dispatch(
        startCampaignActions.setPrimaryContact({
          idImage: url.data.secure_url,
        })
      );

      previewFile(file);
    } catch (error) {
      setLoading(false);
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setSelectedFile(reader.result as string);
    };
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/startCampaign/team",
        { team: startCampaign?.team, id: campaignId },
        { withCredentials: true }
      );

      res && router.push("/StartACampaign/Funding");
    } catch (error) {
      dispatch(toast(true, "Server Error", "error"));
    }
  };

  return {
    startCampaign,
    campaignId,
    selectedFile,
    setSelectedFile,
    loading,
    first,
    setFirst,
    second,
    setSecond,
    handleSelect,
    handleSubmit,
    ...location,
  };
};
