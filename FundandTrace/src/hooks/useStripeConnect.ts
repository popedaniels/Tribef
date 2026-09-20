import { useState } from "react";
import { createStripeConnectAccount } from "../services/fundingRequestService";
import { toast } from "../../store/slices/ToastSlice";
import { grabErrorMessage } from "../components/helperFunctions/helperFunctions";
import { useAppDispatch } from "../../store/hooks";
import type { StripeConnect } from "../types/fundingRequest";

export const useStripeConnect = (
  campaignId: string | string[] | undefined,
  initial: StripeConnect
) => {
  const dispatch = useAppDispatch();
  const [stripeConnect, setStripeConnect] = useState<StripeConnect>(initial);
  const [connectLoading, setConnectLoading] = useState(false);

  const connectStripePayouts = async () => {
    try {
      setConnectLoading(true);
      const res = await createStripeConnectAccount(campaignId);
      if (res?.data?.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        setConnectLoading(false);
        dispatch(toast(true, "Could not start Stripe onboarding.", "error"));
      }
    } catch (error) {
      setConnectLoading(false);
      dispatch(toast(true, grabErrorMessage(error), "error"));
    }
  };

  return { stripeConnect, setStripeConnect, connectLoading, connectStripePayouts };
};
