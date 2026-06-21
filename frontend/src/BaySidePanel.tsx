import type { BayResponse } from "./domain/bay";

type Props = {
  bay: BayResponse;
  onClose: () => void;
};

export const BaySidePanel = ({ bay, onClose }: Props) => {
  return (
    <aside
      aria-label="Selected bay details"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 240,
        padding: 16,
        boxSizing: "border-box",
        background: "white",
      }}
    >
      <button type="button" onClick={onClose} aria-label="Close bay details">
        Close
      </button>
      <h2>Bay {bay.code}</h2>
      <p>Status: {bay.status}</p>
      <p>Area: {bay.area.toFixed(1)} m²</p>
    </aside>
  );
};
