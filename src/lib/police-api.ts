const API_BASE = "https://data.police.uk/api";

export type AvailabilityDate = {
  date: string;
  "stop-and-search": string[];
};

export type CrimeCategory = {
  url: string;
  name: string;
};

export type CrimeLocation = {
  latitude: string | null;
  longitude: string | null;
  street: {
    id: number;
    name: string;
  };
};

export type OutcomeStatus = {
  category: string;
  date: string;
} | null;

export type Crime = {
  category: string;
  persistent_id: string;
  location_subtype: string;
  id: number;
  location: CrimeLocation;
  context: string;
  month: string;
  location_type: string;
  outcome_status: OutcomeStatus;
};

export type StopAndSearch = {
  age_range: string | null;
  officer_defined_ethnicity: string | null;
  involved_person: boolean;
  self_defined_ethnicity: string | null;
  gender: string | null;
  legislation: string | null;
  outcome_linked_to_object_of_search: boolean | null;
  datetime: string;
  outcome_object: { id: string; name: string } | null;
  location: CrimeLocation;
  object_of_search: string | null;
  operation: boolean | null;
  outcome: string | null;
  type: string;
  operation_name: string | null;
  removal_of_more_than_outer_clothing: boolean | null;
};

export type CrimeOutcomeEntry = {
  category: { code: string; name: string };
  date: string | null;
  person_id: number | null;
};

export type CrimeWithOutcomes = {
  crime: Crime;
  outcomes: CrimeOutcomeEntry[];
};

export async function getAvailability(): Promise<AvailabilityDate[]> {
  const res = await fetch(`${API_BASE}/crimes-street-dates`, {
    next: { revalidate: 60 * 60 },
  });
  if (!res.ok) throw new Error(`Availability request failed: ${res.status}`);
  return res.json();
}

export async function getCrimeCategories(date: string): Promise<CrimeCategory[]> {
  const res = await fetch(`${API_BASE}/crime-categories?date=${date}`, {
    next: { revalidate: 60 * 60 },
  });
  if (!res.ok) throw new Error(`Crime categories request failed: ${res.status}`);
  return res.json();
}

export async function getStreetCrimes(params: {
  lat: number;
  lng: number;
  date: string;
}): Promise<Crime[]> {
  const url = `${API_BASE}/crimes-street/all-crime?lat=${params.lat}&lng=${params.lng}&date=${params.date}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Street crimes request failed: ${res.status}`);
  return res.json();
}

export async function getStopsStreet(params: {
  lat: number;
  lng: number;
  date: string;
}): Promise<StopAndSearch[]> {
  const url = `${API_BASE}/stops-street?lat=${params.lat}&lng=${params.lng}&date=${params.date}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Stop and search request failed: ${res.status}`);
  return res.json();
}

export async function getOutcomesForCrime(persistentId: string): Promise<CrimeWithOutcomes> {
  const url = `${API_BASE}/outcomes-for-crime/${persistentId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Outcomes request failed: ${res.status}`);
  return res.json();
}

export async function getCrimeTrend(
  lat: number,
  lng: number,
  dates: string[]
): Promise<{ date: string; crimes: Crime[] }[]> {
  const results: { date: string; crimes: Crime[] }[] = [];
  for (const date of dates) {
    try {
      const crimes = await getStreetCrimes({ lat, lng, date });
      results.push({ date, crimes });
      await new Promise((r) => setTimeout(r, 250));
    } catch {
      results.push({ date, crimes: [] });
    }
  }
  return results;
}