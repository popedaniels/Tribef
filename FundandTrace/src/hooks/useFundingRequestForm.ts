import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import { cloudinaryUploadUrl } from "../utils/cloudinary";
import { useGeolocation } from "./useGeolocation";
import type { FundingRequestBody, FundingView, FundingCampaign } from "../types/fundingRequest";
import { createFundingRequest } from "../services/fundingRequestService";
import { validateFundingRequest } from "../utils/validation/fundingRequestValidation";
import { toast } from "../../store/slices/ToastSlice";
import { grabErrorMessage, grabErrorStatus } from "../components/helperFunctions/helperFunctions";
import { logout } from "../../store/slices/authSlice";
import { useAppDispatch } from "../../store/hooks";

interface UseFundingRequestFormOptions {
  campaign: FundingCampaign | null;
  campaignId: string | string[] | undefined;
}

export const useFundingRequestForm = ({ campaign, campaignId }: UseFundingRequestFormOptions) => {
  const dispatch = useAppDispatch();
  const [fundingView, setFundingView] = useState<FundingView>("");
  const [selectedFile, setSelectedFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const [fundingRequest, setFundingRequest] = useState<FundingRequestBody>({
    fundingType: "",
    currency: campaign?.funding?.currency,
    amount: 0,
    purposeOfFunding: "",
    proofOfFunding: "",
    thirdPartyAccountNumber: 0,
    thirdPartyAccountName: "",
    thirdPartyBankName: "",
    thirdPartyNameOfRef: "",
    thirdPartyContact: "",
  });

  const empty: FundingRequestBody = useMemo(
    () => ({
      fundingType: "",
      amount: 0,
      currency: campaign?.funding?.currency,
      purposeOfFunding: "",
      proofOfFunding: "",
      thirdPartyAccountNumber: 0,
      thirdPartyBankName: "",
      thirdPartyAccountName: "",
      thirdPartyNameOfRef: "",
      thirdPartyContact: "",
    }),
    [campaign?.funding?.currency]
  );

  const { captureGeolocation } = useGeolocation(setFundingRequest);

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setSelectedFile(reader.result);
      }
    };
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const file = e.target.files![0];
      if (!file) {
        setLoading(false);
        return;
      }

      captureGeolocation();

      const formData = new FormData();
      formData.append("upload_preset", "campaignImage");
      formData.append("file", file);

      const res = await axios.post(cloudinaryUploadUrl("dlanmi4el"), formData);
      setLoading(false);
      if (res?.data?.secure_url) {
        setFundingRequest((prev) => ({
          ...prev,
          proofOfFunding: res.data.secure_url,
        }));
      }

      previewFile(file);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const validation = validateFundingRequest(fundingRequest);
      if (!validation.valid) {
        dispatch(toast(true, validation.message as string, "error"));
        return;
      }

      // Preserve original branching for third-party vs proof flows to keep behavior identical
      if (fundingRequest.fundingType === "third-party") {
        const res = await createFundingRequest(fundingRequest, campaign, campaignId);
        res && setFundingView("success");
        res && dispatch(toast(true, "Funding Request Sent", "success"));
        res && setRefresh(!refresh);
      } else {
        const res = await createFundingRequest(fundingRequest, campaign, campaignId);
        res && setFundingView("success");
        res && dispatch(toast(true, "Funding Request Sent", "success"));
        res && setRefresh(!refresh);
      }
    } catch (error) {
      dispatch(toast(true, grabErrorMessage(error), "error"));
      if (grabErrorStatus(error) == 403) {
        dispatch(logout());
      }
    }
  };

  const resetForFundingType = useCallback(
    (type: FundingView, fundingTypeValue: string) => {
      setFundingView(type);
      setFundingRequest({ ...empty, fundingType: fundingTypeValue });
      setSelectedFile("");
    },
    [empty]
  );

  const clearProof = useCallback(() => {
    setFundingRequest((prev) => ({ ...prev, proofOfFunding: "" }));
    setSelectedFile("");
  }, []);

  return {
    fundingRequest,
    setFundingRequest,
    fundingView,
    setFundingView,
    selectedFile,
    setSelectedFile,
    loading,
    showDropdown,
    setShowDropdown,
    refresh,
    setRefresh,
    empty,
    handleSelect,
    previewFile,
    handleSubmit,
    resetForFundingType,
    clearProof,
  };
};
