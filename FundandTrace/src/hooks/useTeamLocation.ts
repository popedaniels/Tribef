import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectStartCampaignState } from "../../store/slices/startCampaignSlice";
import {
  getAllCountries,
  getStates,
  handleCountrySearchFunction,
  handlePhoneSearchFunction,
  handleStateSearchFunction,
} from "../components/helperFunctions/locationFunctions";

interface CountryOption {
  name: string;
  phone_code: string;
  href: { flag: string };
  states: string[];
}

interface StateOption {
  name: string;
}

export const useTeamLocation = () => {
  const { startCampaign } = useSelector(selectStartCampaignState) as any;

  const [states, setStates] = useState<StateOption[]>([]);
  const [allStates, setAllStates] = useState<StateOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [allCountries, setAllCountries] = useState<CountryOption[]>([]);
  const [showCountries, setShowCountries] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const [states2, setStates2] = useState<StateOption[]>([]);
  const [allStates2, setAllStates2] = useState<StateOption[]>([]);
  const [countries2, setCountries2] = useState<CountryOption[]>([]);
  const [showCountries2, setShowCountries2] = useState(false);
  const [showStates2, setShowStates2] = useState(false);
  const [selectedCountry2, setSelectedCountry2] = useState("");
  const [selectedState2, setSelectedState2] = useState("");
  const [flag, setFlag] = useState("");
  const [flag2, setFlag2] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [showPhone2, setShowPhone2] = useState(false);
  const [selectedPhone2, setSelectedPhone2] = useState("");
  const [phones, setPhones] = useState<CountryOption[]>([]);
  const [phones2, setPhones2] = useState<CountryOption[]>([]);

  const getAllCountriesFromFunction = useCallback(async () => {
    const countriesList = await getAllCountries();
    setAllCountries(countriesList);
    setCountries(countriesList);
    setCountries2(countriesList);
    setPhones(countriesList);
    setPhones2(countriesList);
  }, []);

  const getAllStatesFromFunction = useCallback(async () => {
    const data = await getStates(startCampaign?.team?.primaryContact?.country);
    setStates(data);
    setAllStates(data);
  }, [startCampaign?.team?.primaryContact?.country]);

  const getAllStatesFromFunction2 = useCallback(async () => {
    const data = await getStates(startCampaign?.team?.secondContact?.country);
    setStates2(data);
    setAllStates2(data);
  }, [startCampaign?.team?.secondContact?.country]);

  useEffect(() => {
    getAllCountriesFromFunction();
  }, [getAllCountriesFromFunction]);

  const handleCountrySearch = useCallback(() => {
    setCountries(handleCountrySearchFunction(allCountries, selectedCountry));
  }, [allCountries, selectedCountry]);

  const handleCountrySearch2 = useCallback(() => {
    setCountries2(handleCountrySearchFunction(allCountries, selectedCountry2));
  }, [allCountries, selectedCountry2]);

  const handlePhoneSearch = useCallback(() => {
    setPhones(handlePhoneSearchFunction(allCountries, selectedPhone));
  }, [allCountries, selectedPhone]);

  const handlePhoneSearch2 = useCallback(() => {
    setPhones2(handlePhoneSearchFunction(allCountries, selectedPhone2));
  }, [allCountries, selectedPhone2]);

  const handleStateSearch = useCallback(() => {
    setStates(handleStateSearchFunction(allStates, selectedState));
  }, [allStates, selectedState]);

  const handleStateSearch2 = useCallback(() => {
    setStates(handleStateSearchFunction(allStates2, selectedState2));
  }, [allStates2, selectedState2]);

  useEffect(() => {
    handlePhoneSearch();
  }, [handlePhoneSearch]);

  useEffect(() => {
    handlePhoneSearch2();
  }, [handlePhoneSearch2]);

  useEffect(() => {
    handleCountrySearch();
  }, [handleCountrySearch]);

  useEffect(() => {
    handleCountrySearch2();
  }, [handleCountrySearch2]);

  useEffect(() => {
    handleStateSearch();
  }, [handleStateSearch]);

  useEffect(() => {
    handleStateSearch2();
  }, [handleStateSearch2]);

  useEffect(() => {
    startCampaign?.team?.primaryContact?.country && getAllStatesFromFunction();
  }, [startCampaign?.team?.primaryContact?.country, getAllStatesFromFunction]);

  useEffect(() => {
    startCampaign?.team?.secondContact?.country && getAllStatesFromFunction2();
  }, [startCampaign?.team?.secondContact?.country, getAllStatesFromFunction2]);

  return {
    // primary
    states,
    setStates,
    allStates,
    countries,
    allCountries,
    showCountries,
    setShowCountries,
    showStates,
    setShowStates,
    selectedCountry,
    setSelectedCountry,
    selectedState,
    setSelectedState,
    // secondary
    states2,
    setStates2,
    allStates2,
    countries2,
    showCountries2,
    setShowCountries2,
    showStates2,
    setShowStates2,
    selectedCountry2,
    setSelectedCountry2,
    selectedState2,
    setSelectedState2,
    // phones
    flag,
    setFlag,
    flag2,
    setFlag2,
    showPhone,
    setShowPhone,
    selectedPhone,
    setSelectedPhone,
    showPhone2,
    setShowPhone2,
    selectedPhone2,
    setSelectedPhone2,
    phones,
    phones2,
  };
};
