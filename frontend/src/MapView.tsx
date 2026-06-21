import { Layer, Map, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import { BayStatus } from "./domain/bay";

type Props = {
  facilityCenter: {
    longitude: number;
    latitude: number;
  };
  sourceData: FeatureCollection;
};

const BAY_STATUS_COLOR = {
  [BayStatus.Available]: "#4ade80",
  [BayStatus.Reserved]: "#facc15",
  [BayStatus.Occupied]: "#f87171",
} as const;

const BAY_STATUS_FALLBACK_COLOR = "#94a3b8";

export const MapView = ({ facilityCenter, sourceData }: Props) => {
  return (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}>
      <Map
        initialViewState={{
          ...facilityCenter,
          zoom: 18,
        }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
      >
        <Source id="bays" type="geojson" data={sourceData}>
          <Layer
            id="bays-fill"
            type="fill"
            paint={{
              "fill-color": [
                "match",
                ["get", "status"],
                BayStatus.Available,
                BAY_STATUS_COLOR[BayStatus.Available],
                BayStatus.Reserved,
                BAY_STATUS_COLOR[BayStatus.Reserved],
                BayStatus.Occupied,
                BAY_STATUS_COLOR[BayStatus.Occupied],
                BAY_STATUS_FALLBACK_COLOR,
              ],
              "fill-opacity": 0.6,
            }}
          />

          <Layer
            id="bays-outline"
            type="line"
            paint={{
              "line-color": "#111827",
              "line-width": 1,
            }}
          />
        </Source>
      </Map>
    </div>
  );
};
