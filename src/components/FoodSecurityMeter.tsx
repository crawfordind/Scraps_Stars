type FoodSecurityMeterProps = {
  score: number;
  label: string;
};

export function FoodSecurityMeter({ score, label }: FoodSecurityMeterProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="security-meter" role="img" aria-label={`Food security score ${clamped} out of 100, ${label}`}>
      <div className="security-meter__ring-wrap">
        <svg className="security-meter__ring" viewBox="0 0 100 100" aria-hidden>
          <circle className="security-meter__track" cx="50" cy="50" r={radius} />
          <circle
            className="security-meter__fill"
            cx="50"
            cy="50"
            r={radius}
            style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
          />
        </svg>
        <span className="security-meter__score">{clamped}</span>
      </div>
      <span className="security-meter__label">{label}</span>
    </div>
  );
}
