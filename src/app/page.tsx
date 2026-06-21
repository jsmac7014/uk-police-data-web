import CrimeApp from "@/components/CrimeApp";
import {
  getAvailability,
  getCrimeCategories,
  getStreetCrimes,
  getStopsStreet,
} from "@/lib/police-api";

const DEFAULT_LAT = 51.4975;
const DEFAULT_LNG = -0.1357;
const DEFAULT_LOCATION_NAME = "London (Westminster)";

export default async function Home() {
  const availability = await getAvailability();
  const dates = availability.map((a) => a.date);
  const initialDate = dates[0] ?? "2025-01";

  const [categories, crimes, stops] = await Promise.all([
    getCrimeCategories(initialDate),
    getStreetCrimes({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, date: initialDate }),
    getStopsStreet({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, date: initialDate }),
  ]);

  return (
    <CrimeApp
      initialDates={dates}
      initialCrimes={crimes}
      initialStops={stops}
      initialCategories={categories}
      initialDate={initialDate}
      initialLat={DEFAULT_LAT}
      initialLng={DEFAULT_LNG}
      initialLocationName={DEFAULT_LOCATION_NAME}
    />
  );
}