import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MapController } from "./MapController";

const queryClient = new QueryClient();

const FACILITY_ID = "fac-gladsaxe-demo";

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MapController facilityId={FACILITY_ID} />
    </QueryClientProvider>
  );
};
