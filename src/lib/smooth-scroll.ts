// Slower than the browser's short smooth scroll, and interruptible by the guest.
export function scrollToLetter(element: HTMLElement, onComplete: () => void): () => void {
  const start = window.scrollY;
  const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 24;
  const end = Math.min(document.documentElement.scrollHeight - window.innerHeight, Math.max(0, start + element.getBoundingClientRect().top - margin));
  const began = performance.now();
  let frame = 0;
  function cancel() {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", cancel);
  }
  function step(now: number) {
    const t = Math.min(1, (now - began) / 1200);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo({ top: start + (end - start) * eased, behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else { cancel(); onComplete(); }
  }
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", cancel);
  frame = requestAnimationFrame(step);
  return cancel;
}
