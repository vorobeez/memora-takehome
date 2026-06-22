import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  BayStatus,
  type BayResponse,
  type BaysResponse,
  type BayStatusValues,
} from "./domain/bay";
import { BaySidePanel } from "./BaySidePanel";
import { MapView } from "./MapView";
import type { FeatureCollection } from "geojson";

type Props = {
  operatorId: string;
  facilityId: string;
  facilityCenter: {
    longitude: number;
    latitude: number;
  };
};

const getFacilityBays = async (
  operatorId: string,
  facilityId: string,
  status?: BayStatusValues,
): Promise<BaysResponse> => {
  const headers = new Headers();

  headers.set("x-operator-id", operatorId);

  const statusQuery = status ? `?status=${encodeURIComponent(status)}` : "";

  const response = await fetch(
    `http://localhost:3000/v1/facilities/${facilityId}/bays${statusQuery}`,
    {
      headers,
    },
  );

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message ?? "Unknown error");
  }

  return responseData;
};

export const MapController = ({
  operatorId,
  facilityId,
  facilityCenter,
}: Props) => {
  const [selectedBay, setSelectedBay] = useState<BayResponse | null>(null);
  const [status, setStatus] = useState<BayStatusValues | undefined>();
  const baysQuery = useQuery({
    queryKey: ["facilityBays", operatorId, facilityId, status ?? "all"],
    queryFn: () => getFacilityBays(operatorId, facilityId, status),
    placeholderData: keepPreviousData,
    retry: false,
  });

  let content: ReactNode;

  switch (baysQuery.status) {
    case "pending":
      content = <div>Loading...</div>;
      break;
    case "error":
      content = <div>Error: {baysQuery.error.message}</div>;
      break;
    case "success": {
      if (!Array.isArray(baysQuery.data)) {
        content = <div>Incorrect response schema</div>;
      } else if (baysQuery.data.length === 0) {
        content = <div>Empty response</div>;
      } else {
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

        content = (
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

      break;
    }
  }

  return (
    <>
      {content}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
        <label htmlFor="bay-status">Status: </label>
        <select
          id="bay-status"
          value={status ?? ""}
          onChange={(event) => {
            const nextStatus = event.target.value as BayStatusValues | "";
            setSelectedBay(null);
            setStatus(nextStatus || undefined);
          }}
        >
          <option value="">All</option>
          <option value={BayStatus.Available}>Available</option>
          <option value={BayStatus.Reserved}>Reserved</option>
          <option value={BayStatus.Occupied}>Occupied</option>
        </select>
      </div>
    </>
  );
};
