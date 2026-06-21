import { useQuery } from "@tanstack/react-query";
import type { BaysResponse } from "./domain/bay";

type Props = {
  facilityId: string;
};

const getFacilityBays = async (facilityId: string): Promise<BaysResponse> => {
  const response = await fetch(
    `http://localhost:3000/v1/facilities/${facilityId}/bays`,
  );

  return response.json();
};

export const MapController = ({ facilityId }: Props) => {
  const baysQuery = useQuery({
    queryKey: ["facilityBays", facilityId],
    queryFn: () => getFacilityBays(facilityId),
  });

  console.log(baysQuery.data);

  return <div>Test</div>;
};
