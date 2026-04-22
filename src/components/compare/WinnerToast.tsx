type WinnerToastProps = {
  visible: boolean;
};

export function WinnerToast({ visible }: WinnerToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-7 left-1/2 z-[100] flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] bg-[color:var(--ink)] px-5 py-3 text-[13px] font-medium text-[color:var(--bg)] shadow-[0_8px_32px_rgba(26,20,16,0.22)] transition-[transform,opacity] duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      style={{
        transform: `translate(-50%, ${visible ? "0px" : "80px"})`,
        opacity: visible ? 1 : 0,
      }}
    >
      <span
        aria-hidden="true"
        className="h-[7px] w-[7px] rounded-full bg-[color:var(--purple-light)]"
      />
      Voto registrado! Obrigado por ajudar a comunidade.
    </div>
  );
}
