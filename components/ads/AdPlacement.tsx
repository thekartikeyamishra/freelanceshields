// components/ads/AdPlacement.tsx — named, env-controlled ad placement.
import AdSlot from "@/components/ads/AdSlot";
import { adSlotFor, type AdPlacementName } from "@/lib/ads";

export default function AdPlacement({ name, className = "" }: { name: AdPlacementName; className?: string }) {
  const slot = adSlotFor(name);
  if (!slot) return null;
  return (
    <div className={`mx-auto max-w-3xl px-6 ${className}`}>
      <AdSlot slotId={slot} reservedHeight={280} />
    </div>
  );
}
