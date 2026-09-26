const header = document.querySelector<HTMLElement>('.header');
const compact = matchMedia('(max-width: 1280px)');
if (header) {
  let previous = window.scrollY;
  let travelled = 0;
  let direction = 0;
  let frame = 0;
  const show = () => header.classList.remove('nav-hidden');
  const update = () => {
    frame = 0;
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const current = Math.max(0, Math.min(window.scrollY, maximum));
    const delta = current - previous;
    previous = current;
    const focused = document.activeElement;
    const interacting = header.querySelector('.open, details[open]') ||
      (focused instanceof Element && header.contains(focused) && focused.matches(':focus-visible'));
    if (!compact.matches || current < header.offsetHeight + 32 || interacting) {
      show(); travelled = 0; direction = 0; return;
    }
    if (!delta) return;
    const nextDirection = Math.sign(delta);
    travelled = nextDirection === direction ? travelled + Math.abs(delta) : Math.abs(delta);
    direction = nextDirection;
    if (travelled >= 12) {
      header.classList.toggle('nav-hidden', direction > 0);
      travelled = 0;
    }
  };
  window.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  header.addEventListener('focusin', show);
  compact.addEventListener('change', () => { show(); previous = window.scrollY; travelled = 0; });
  window.addEventListener('pageshow', () => { show(); previous = window.scrollY; });
}
