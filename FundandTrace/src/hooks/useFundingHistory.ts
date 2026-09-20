import { useCallback, useEffect, useState } from "react";
import { fetchAllFundings } from "../services/fundingRequestService";

export const useFundingHistory = (campaignId: string | string[] | undefined, refresh: boolean) => {
  const [allFundings, setAllFundings] = useState<unknown[]>([]);

  const getAllFundings = useCallback(async () => {
    try {
      const data = await fetchAllFundings(campaignId);
      data && setAllFundings(data);
    } catch (error) {
      // silent as in original
    }
  }, [campaignId]);

  useEffect(() => {
    getAllFundings();
  }, [refresh, getAllFundings]);

  return { allFundings, getAllFundings };
};
