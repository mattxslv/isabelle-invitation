export function MonogramLoader({ label = "Loading invitation" }: { label?: string }) {
  return <div className="monogram-loader" role="status" aria-label={label}>
    <span className="loader-monogram" aria-hidden="true">I<span>&#10023;</span></span>
  </div>;
}
