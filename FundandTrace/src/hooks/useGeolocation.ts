import { useCallback } from "react";
import type { FundingRequestBody } from "../types/fundingRequest";

type SetFundingRequest = React.Dispatch<React.SetStateAction<FundingRequestBody>>;

export const useGeolocation = (setFundingRequest: SetFundingRequest) => {
  const captureGeolocation = useCallback(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFundingRequest((prev) => ({
            ...prev,
            mobileFieldVerification: {
              captureTimestampNTP: new Date(),
              geolocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude,
                accuracyMeters: position.coords.accuracy,
                isMockProvider: false,
              },
              deviceAttestation: {
                platform: "mobile_web",
                hardwareKeystoreSigned: false,
              },
            },
          }));
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [setFundingRequest]);

  return { captureGeolocation };
};
