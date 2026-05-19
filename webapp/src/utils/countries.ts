export type CountryOption = {
  code: string;
  name: string;
  dialCode?: string;
};

type RestCountry = {
  name?: { common?: string };
  cca2?: string;
  idd?: { root?: string; suffixes?: string[] };
};

export async function fetchCountryOptions(signal?: AbortSignal): Promise<CountryOption[]> {
  const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,idd", {
    signal
  });

  if (!response.ok) {
    throw new Error(`Country API returned ${response.status}`);
  }

  const payload = (await response.json()) as RestCountry[];

  return payload
    .filter((country) => country.cca2 && country.name?.common)
    .map((country) => {
      const root = country.idd?.root ?? "";
      const suffix = country.idd?.suffixes?.[0] ?? "";
      return {
        code: country.cca2!.toUpperCase(),
        name: country.name!.common!,
        dialCode: root ? `${root}${suffix}` : undefined
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCountryLabel(countryCode: string, countries: CountryOption[]): string {
  const normalizedCode = countryCode.trim().toUpperCase();
  if (!normalizedCode) {
    return "-";
  }

  const match = countries.find((country) => country.code === normalizedCode);
  return match ? `${match.name} (${match.code})` : normalizedCode;
}
