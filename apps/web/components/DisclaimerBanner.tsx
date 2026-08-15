export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "text-xs text-riq-gray" : "text-sm text-riq-gray"}>
      RaceIQ is an independent motorsport analytics project and is not affiliated with Formula 1,
      the FIA, any team, or any driver. Race data is used descriptively under FastF1&apos;s
      publicly documented data access.
    </p>
  );
}
