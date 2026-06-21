import { useQuery } from "@tanstack/react-query";

import type { BaysResponse } from "./domain/bay";
import { MapView } from "./MapView";
import type { FeatureCollection } from "geojson";

type Props = {
  facilityId: string;
  facilityCenter: {
    longitude: number;
    latitude: number;
  };
};

const getFacilityBays = async (facilityId: string): Promise<BaysResponse> => {
  const response = await fetch(
    `http://localhost:3000/v1/facilities/${facilityId}/bays`,
  );

  return response.json();
};

export const MapController = ({ facilityId, facilityCenter }: Props) => {
  const baysQuery = useQuery({
    queryKey: ["facilityBays", facilityId],
    queryFn: () => getFacilityBays(facilityId),
  });

  switch (baysQuery.status) {
    case "pending":
      return <div>Loading...</div>;
    case "error":
      return <div>Error: {baysQuery.error.message}</div>;
    case "success": {
      const sourceData: FeatureCollection = {
        type: "FeatureCollection",
        features: baysQuery.data.map(({ geometry, status }) => ({
          type: "Feature",
          geometry,
          properties: {
            status,
          },
        })),
      };

      return (
        <MapView facilityCenter={facilityCenter} sourceData={sourceData} />
      );
    }
  }
};
