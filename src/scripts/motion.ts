import './card-depth';
import './mobile-navigation';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector<HTMLElement>('.header');
const sentinel = document.querySelector('.nav-sentinel');
if (sentinel && header && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(sentinel);
}

// Reveal once on arrival, with visible-by-default markup and no scroll handler.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    if (!reduced.matches) entry.target.classList.add('is-revealing');
    observer.unobserve(entry.target);
  }), { threshold: 0.06 });
  document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
}

const folio = document.querySelector<HTMLElement>('[data-folio]');
const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
if (folio) {
  let bounds: DOMRect | undefined;
  let frame = 0;
  const reset = () => { cancelAnimationFrame(frame); frame = 0; folio.style.removeProperty('--tilt-x'); folio.style.removeProperty('--tilt-y'); };
  folio.addEventListener('pointerenter', () => { bounds = folio.getBoundingClientRect(); });
  folio.addEventListener('pointermove', event => {
    if (reduced.matches || !precisePointer.matches || !bounds || frame) return;
    const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
    frame = requestAnimationFrame(() => { folio.style.setProperty('--tilt-x', `${-y * 7}deg`); folio.style.setProperty('--tilt-y', `${x * 7}deg`); frame = 0; });
  });
  folio.addEventListener('pointerleave', reset);
  reduced.addEventListener('change', reset);
}

let toastTimer: ReturnType<typeof setTimeout>;
export function notify(message: string) {
  const toast = document.querySelector<HTMLElement>('#buddy-toast');
  if (!toast) return;
  clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('is-visible');
  toastTimer = setTimeout(() => { toast.classList.remove('is-visible'); }, 4000);
}
document.addEventListener('click', event => {
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[download]') : null;
  if (link && !event.defaultPrevented) notify('Download requested. Your browser will save the file.');
});

// Only actual embedded documents/images receive a loading state.
document.querySelectorAll<HTMLImageElement | HTMLIFrameElement>('.infographic-reader img, #study-notes-frame').forEach(media => {
  if (media instanceof HTMLImageElement && media.complete && media.naturalWidth > 0) return;
  const message = document.createElement('p'); message.className = 'media-loading'; message.setAttribute('role', 'status'); message.textContent = 'Opening your study material…';
  const preview = media instanceof HTMLImageElement ? media.closest('a') || media : media;
  preview.before(message);
  const timeout = setTimeout(() => { message.className = 'media-error'; message.textContent = 'Taking a little longer to load. You can use the full-size or full-screen link above.'; }, 15000);
  const loaded = () => { clearTimeout(timeout); message.remove(); };
  const failed = () => { clearTimeout(timeout); if (media instanceof HTMLImageElement) media.hidden = true; message.className = 'media-error'; message.textContent = 'This preview could not load. Try the original file link above, or report the issue below.'; };
  media.addEventListener('load', loaded, { once: true }); media.addEventListener('error', failed, { once: true });
  if (media instanceof HTMLImageElement && media.complete) failed();
});
