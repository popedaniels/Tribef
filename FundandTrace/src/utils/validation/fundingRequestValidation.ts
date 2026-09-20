import type { FundingRequestBody } from "../../types/fundingRequest";

export interface FundingValidationResult {
  valid: boolean;
  message?: string;
}

export const validateFundingRequest = (fundingRequest: FundingRequestBody): FundingValidationResult => {
  if (!fundingRequest.amount || !fundingRequest.fundingType || !fundingRequest.purposeOfFunding) {
    return { valid: false, message: "Please Fill the mandatory fields" };
  }

  if (fundingRequest.fundingType === "third-party") {
    if (
      !fundingRequest.thirdPartyAccountName ||
      !fundingRequest.thirdPartyAccountNumber ||
      !fundingRequest.thirdPartyBankName ||
      !fundingRequest.thirdPartyContact ||
      !fundingRequest.thirdPartyNameOfRef
    ) {
      // For third-party, proof is optional in original logic – just check third-party fields
      // But the submit handler still posts even if some validation fails silently;
      // we mimic original behavior: require all third-party fields.
      return { valid: false, message: "Please Fill the mandatory fields" };
    }
    return { valid: true };
  }

  if (!fundingRequest.proofOfFunding) {
    return { valid: false, message: "Please Fill the mandatory fields" };
  }

  return { valid: true };
};

export const isAmountExceedingRaised = (amount: number, amountRaised?: number): boolean => {
  if (amountRaised === undefined || amountRaised === null) return false;
  return amount > Number(amountRaised);
};
