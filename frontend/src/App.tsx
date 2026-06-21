import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MapController } from "./MapController";

const queryClient = new QueryClient();

const DEMO_FACILITY = {
  id: "fac-gladsaxe-demo",

  center: {
    longitude: 12.471464365,
    latitude: 55.73219763,
  },

  bbox: {
    minLng: 12.47090392,
    minLat: 55.7319461,
    maxLng: 12.47202481,
    maxLat: 55.73244916,
  },
} as const;

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MapController
        facilityId={DEMO_FACILITY.id}
        facilityCenter={DEMO_FACILITY.center}
      />
    </QueryClientProvider>
  );
};
