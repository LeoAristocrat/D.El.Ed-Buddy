// Delegation also covers cards added by search and saved-resource rendering.
const selector = '.card, .format-grid > a, .unit-row, .search-result, .internship-banner, .home-support, .feature-panel, .upi-card, #contact';
const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
let active: HTMLElement | null = null;
let bounds: DOMRect | null = null;
let frame = 0;
let x = .5;
let y = .5;

function reset() {
  cancelAnimationFrame(frame);
  frame = 0;
  active?.classList.remove('depth-active');
  active = null;
  bounds = null;
}

document.addEventListener('pointerover', event => {
  if (!motion.matches || !pointer.matches || event.pointerType === 'touch') return;
  const card = event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
  if (card === active) return;
  reset();
  if (!card || card.contains(document.activeElement) || card.closest('.id-card-mount')) return;
  active = card;
  bounds = card.getBoundingClientRect();
  card.classList.add('card-depth', 'depth-active');
});
document.addEventListener('pointermove', event => {
  if (!active || !bounds) return;
  x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  if (frame) return;
  frame = requestAnimationFrame(() => {
    if (active) {
      active.style.setProperty('--card-rx', `${(0.5 - y) * 10}deg`);
      active.style.setProperty('--card-ry', `${(x - 0.5) * 10}deg`);
      active.style.setProperty('--card-light-x', `${x * 100}%`);
      active.style.setProperty('--card-light-y', `${y * 100}%`);
    }
    frame = 0;
  });
});
document.addEventListener('pointerout', event => {
  if (active && (!(event.relatedTarget instanceof Node) || !active.contains(event.relatedTarget))) reset();
});
document.addEventListener('pointercancel', reset);
document.addEventListener('focusin', reset);
window.addEventListener('scroll', reset, { passive: true });
window.addEventListener('blur', reset);
motion.addEventListener('change', reset);
pointer.addEventListener('change', reset);
