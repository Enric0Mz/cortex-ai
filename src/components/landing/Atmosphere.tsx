export function Atmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="atmosphere-dots" />
      <div className="atmosphere-halo" />
    </div>
  );
}
