// Comprehensive location & country utilities with offline-first static data

const countriesList = [
  { name: "Nigeria", phone_code: "234", href: { flag: "https://flagcdn.com/w40/ng.png" }, states: ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"] },
  { name: "United States", phone_code: "1", href: { flag: "https://flagcdn.com/w40/us.png" }, states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"] },
  { name: "United Kingdom", phone_code: "44", href: { flag: "https://flagcdn.com/w40/gb.png" }, states: ["England", "Scotland", "Wales", "Northern Ireland", "Greater London", "Greater Manchester", "West Midlands", "West Yorkshire"] },
  { name: "Canada", phone_code: "1", href: { flag: "https://flagcdn.com/w40/ca.png" }, states: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"] },
  { name: "Ghana", phone_code: "233", href: { flag: "https://flagcdn.com/w40/gh.png" }, states: ["Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"] },
  { name: "Kenya", phone_code: "254", href: { flag: "https://flagcdn.com/w40/ke.png" }, states: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kilifi", "Meru", "Kajiado"] },
  { name: "South Africa", phone_code: "27", href: { flag: "https://flagcdn.com/w40/za.png" }, states: ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"] },
  { name: "Germany", phone_code: "49", href: { flag: "https://flagcdn.com/w40/de.png" }, states: ["Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"] },
  { name: "France", phone_code: "33", href: { flag: "https://flagcdn.com/w40/fr.png" }, states: ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Provence-Alpes-Côte d'Azur", "Hauts-de-France", "Grand Est"] },
  { name: "Australia", phone_code: "61", href: { flag: "https://flagcdn.com/w40/au.png" }, states: ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"] },
  { name: "India", phone_code: "91", href: { flag: "https://flagcdn.com/w40/in.png" }, states: ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "Uttar Pradesh", "Telangana", "Kerala", "West Bengal", "Rajasthan"] },
  { name: "United Arab Emirates", phone_code: "971", href: { flag: "https://flagcdn.com/w40/ae.png" }, states: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"] },
  { name: "Rwanda", phone_code: "250", href: { flag: "https://flagcdn.com/w40/rw.png" }, states: ["Kigali", "Eastern Province", "Northern Province", "Southern Province", "Western Province"] },
  { name: "Uganda", phone_code: "256", href: { flag: "https://flagcdn.com/w40/ug.png" }, states: ["Central Region", "Eastern Region", "Northern Region", "Western Region", "Kampala"] },
  { name: "Tanzania", phone_code: "255", href: { flag: "https://flagcdn.com/w40/tz.png" }, states: ["Dar es Salaam", "Arusha", "Dodoma", "Mwanza", "Kilimanjaro", "Zanzibar"] },
  { name: "Egypt", phone_code: "20", href: { flag: "https://flagcdn.com/w40/eg.png" }, states: ["Cairo", "Alexandria", "Giza", "Dakahlia", "Red Sea", "Sharqia", "Gharbia"] },
  { name: "Ireland", phone_code: "353", href: { flag: "https://flagcdn.com/w40/ie.png" }, states: ["Dublin", "Cork", "Galway", "Limerick", "Waterford"] },
  { name: "Netherlands", phone_code: "31", href: { flag: "https://flagcdn.com/w40/nl.png" }, states: ["North Holland", "South Holland", "Utrecht", "North Brabant", "Gelderland"] },
  { name: "Sweden", phone_code: "46", href: { flag: "https://flagcdn.com/w40/se.png" }, states: ["Stockholm", "Västra Götaland", "Skåne", "Uppsala"] },
  { name: "Switzerland", phone_code: "41", href: { flag: "https://flagcdn.com/w40/ch.png" }, states: ["Zurich", "Geneva", "Bern", "Vaud", "Basel-City"] },
];

const getStates = async (countryName) => {
  if (!countryName) return [];
  const found = countriesList.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (found && found.states) {
    return found.states.map((s) => ({ name: s }));
  }
  return [
    { name: "Central" },
    { name: "Capital Region" },
    { name: "North" },
    { name: "South" },
    { name: "East" },
    { name: "West" },
  ];
};

const getCountries = async () => {
  return {
    country_name: "Nigeria",
    calling_code: "234",
    flag: "https://flagcdn.com/w40/ng.png",
  };
};

const getAllCountries = async () => {
  return countriesList;
};

const handleCountrySearchFunction = (allCountries, selectedCountry) => {
  if (!selectedCountry) return allCountries || [];
  return (allCountries || []).filter((country) =>
    country?.name?.toLowerCase().includes(selectedCountry?.toLowerCase())
  );
};

const handlePhoneSearchFunction = (allCountries, selectedPhone) => {
  if (!selectedPhone) return allCountries || [];
  return (allCountries || []).filter(
    (item) =>
      item?.name?.toLowerCase().includes(selectedPhone?.toLowerCase()) ||
      item?.phone_code?.includes(selectedPhone)
  );
};

const handleStateSearchFunction = (allStates, selectedState) => {
  if (!selectedState) return allStates || [];
  return (allStates || []).filter((state) =>
    state?.name?.toLowerCase().includes(selectedState?.toLowerCase())
  );
};

export {
  handleCountrySearchFunction,
  handleStateSearchFunction,
  getAllCountries,
  getStates,
  getCountries,
  handlePhoneSearchFunction,
};
