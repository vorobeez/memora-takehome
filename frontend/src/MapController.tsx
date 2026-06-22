import { useEffect, useState, type ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

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
  cursor?: string,
): Promise<BaysResponse> => {
  const headers = new Headers();

  headers.set("x-operator-id", operatorId);

  const queryParams = new URLSearchParams();

  if (status) {
    queryParams.set("status", status);
  }

  if (cursor) {
    queryParams.set("cursor", cursor);
  }

  const query = queryParams.size > 0 ? `?${queryParams.toString()}` : "";

  const response = await fetch(
    `http://localhost:3000/v1/facilities/${facilityId}/bays${query}`,
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
  const baysQuery = useInfiniteQuery({
    queryKey: ["facilityBays", operatorId, facilityId, status ?? "all"],
    queryFn: ({ pageParam }) =>
      getFacilityBays(operatorId, facilityId, status, pageParam),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    retry: false,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = baysQuery;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderContent = (): ReactNode => {
    if (baysQuery.status === "pending") {
      return <div>Loading...</div>;
    }

    if (baysQuery.status === "error") {
      return <div>Error: {baysQuery.error.message}</div>;
    }

    if (!baysQuery.data.pages.every((page) => Array.isArray(page.items))) {
      return <div>Incorrect response schema</div>;
    }

    const bays = baysQuery.data.pages.flatMap((page) => page.items);

    if (bays.length === 0) {
      return <div>Empty response</div>;
    }

    const sourceData: FeatureCollection = {
      type: "FeatureCollection",
      features: bays.map(({ geometry, id, status }) => ({
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
            setSelectedBay(bays.find((bay) => bay.id === bayId) ?? null);
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
  };

  const content = renderContent();

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
