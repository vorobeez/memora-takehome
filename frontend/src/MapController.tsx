import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { BayResponse, BaysResponse } from "./domain/bay";
import { BaySidePanel } from "./BaySidePanel";
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

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message ?? "Unknown error");
  }

  return responseData;
};

export const MapController = ({ facilityId, facilityCenter }: Props) => {
  const [selectedBay, setSelectedBay] = useState<BayResponse | null>(null);
  const baysQuery = useQuery({
    queryKey: ["facilityBays", facilityId],
    queryFn: () => getFacilityBays(facilityId),
    retry: false,
  });

  switch (baysQuery.status) {
    case "pending":
      return <div>Loading...</div>;
    case "error":
      return <div>Error: {baysQuery.error.message}</div>;
    case "success": {
      if (!Array.isArray(baysQuery.data)) {
        return <div>Incorrect response schema</div>;
      }

      if (baysQuery.data.length === 0) {
        return <div>Empty response</div>;
      }

      const sourceData: FeatureCollection = {
        type: "FeatureCollection",
        features: baysQuery.data.map(({ geometry, id, status }) => ({
          type: "Feature",
          geometry,
          properties: {
            id,
            status,
          },
        })),
      };

      return (
        <>
          <MapView
            facilityCenter={facilityCenter}
            sourceData={sourceData}
            selectedBayId={selectedBay?.id ?? null}
            onBaySelect={(bayId) => {
              setSelectedBay(
                baysQuery.data.find((bay) => bay.id === bayId) ?? null,
              );
            }}
          />
          {selectedBay && (
            <BaySidePanel
              bay={selectedBay}
              onClose={() => setSelectedBay(null)}
            />
          )}
        </>
      );
    }
  }
};
