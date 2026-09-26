import { cardTemplates, institutes, initialCard, type CardField, type TextBlock } from '../data/id-card';

const form = document.querySelector<HTMLFormElement>('#id-card-form');
if (form) {
  const svg = document.querySelector<SVGSVGElement>('#student-id-card')!;
  const status = document.querySelector<HTMLElement>('#id-export-status')!;
  const layoutStatus = document.querySelector<HTMLElement>('#id-layout-status')!;
  const dialog = document.querySelector<HTMLDialogElement>('#id-print-preview')!;
  const preset = document.querySelector<HTMLSelectElement>('#id-institute')!;
  const photoInput = document.querySelector<HTMLInputElement>('#id-photo')!;
  const photoStatus = document.querySelector<HTMLElement>('#id-photo-status')!;
  const adjustments = document.querySelector<HTMLElement>('#id-photo-adjustments')!;
  const photo = svg.querySelector<SVGImageElement>('[data-card-photo]')!;
  const placeholder = svg.querySelector<SVGGElement>('[data-photo-placeholder]')!;
  const zoom = document.querySelector<HTMLInputElement>('#id-photo-zoom')!;
  const panX = document.querySelector<HTMLInputElement>('#id-photo-x')!;
  const panY = document.querySelector<HTMLInputElement>('#id-photo-y')!;
  const fields = Object.fromEntries(Object.keys(initialCard).map(key => [key, form.elements.namedItem(key)])) as Record<CardField, HTMLInputElement>;
  const measure = document.createElement('canvas').getContext('2d')!;
  let template = cardTemplates[institutes[0].template];
  let photoSize: { width: number; height: number } | null = null;
  let photoVersion = 0;
  let photoLoading = false;
  let exportBusy = false;
  let overflow: string[] = [];
  const ns = 'http://www.w3.org/2000/svg';
  const today = new Date();
  fields.dob.max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function splitLines(text: string, width: number) {
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure.measureText(candidate).width <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ''; }
      // Break long words as well, so unbroken names cannot escape the card.
      for (const character of Array.from(word)) {
        if (line && measure.measureText(line + character).width > width) { lines.push(line); line = ''; }
        line += character;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function renderBlock(key: CardField, text: string, block: TextBlock) {
    const element = svg.querySelector<SVGTextElement>(`[data-card-field="${key}"]`)!;
    let lines: string[] = [];
    let size = block.size;
    for (; size >= block.minSize; size--) {
      measure.font = `700 ${size}px Arial, sans-serif`;
      lines = splitLines(text, block.width);
      if (lines.length <= block.lines) break;
    }
    if (lines.length > block.lines) overflow.push(key === 'instituteName' ? 'institute name' : key === 'fatherName' ? 'father’s name' : key === 'fullName' ? 'full name' : key);
    element.replaceChildren();
    element.setAttribute('font-size', String(Math.max(size, block.minSize)));
    element.setAttribute('text-anchor', block.anchor || 'start');
    let baseline = block.y;
    if (key === 'instituteName' && lines.length > 1) baseline = 38;
    for (const [index, line] of lines.slice(0, block.lines).entries()) {
      const span = document.createElementNS(ns, 'tspan');
      span.setAttribute('x', String(block.x));
      span.setAttribute('y', String(baseline + index * block.lineHeight));
      span.textContent = line;
      element.append(span);
    }
  }

  function update() {
    overflow = [];
    for (const key of Object.keys(fields) as CardField[]) {
      const input = fields[key];
      input.setCustomValidity(input.required && !input.value.trim() ? 'Please fill in this field.' : '');
      let value = input.value.trim();
      if (key === 'dob' && value) value = value.split('-').reverse().join('-');
      if (key === 'fullName' || key === 'instituteName') value = value.toUpperCase();
      renderBlock(key, value || (key === 'fullName' ? 'YOUR NAME' : ''), template.blocks[key]);
    }
    const phone = fields.contact.value.trim();
    const digits = phone.replace(/\D/g, '');
    fields.contact.setCustomValidity(phone && (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) ? 'Use 7–15 digits, with an optional +, spaces, brackets or dashes.' : '');
    layoutStatus.textContent = overflow.length ? `Please shorten the ${overflow.join(', ')} to fit the card before exporting.` : '';
  }

  function updatePhoto() {
    if (!photoSize) return;
    const area = template.photo;
    const scale = Math.max(area.size / photoSize.width, area.size / photoSize.height) * Number(zoom.value);
    const width = photoSize.width * scale;
    const height = photoSize.height * scale;
    photo.setAttribute('width', String(width));
    photo.setAttribute('height', String(height));
    photo.setAttribute('x', String(area.x + (area.size - width) / 2 + (width - area.size) / 2 * Number(panX.value) / 100));
    photo.setAttribute('y', String(area.y + (area.size - height) / 2 + (height - area.size) / 2 * Number(panY.value) / 100));
  }

  function removePhoto() {
    photoVersion++;
    photoLoading = false;
    photoSize = null;
    photo.removeAttribute('href');
    placeholder.style.display = '';
    photoInput.value = '';
    adjustments.hidden = true;
    zoom.value = '1'; panX.value = '0'; panY.value = '0';
    photoStatus.textContent = '';
  }

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    const version = ++photoVersion;
    photoLoading = false;
    if (!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      photoStatus.textContent = 'Choose a JPG, PNG, WebP, GIF or AVIF image under 10 MB. Your previous photo is unchanged.';
      photoInput.value = '';
      return;
    }
    photoLoading = true;
    photoStatus.textContent = 'Preparing your photo…';
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (version !== photoVersion) return;
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) throw new Error('Image too large');
      // Normalize orientation, strip metadata and bound export size, entirely in memory.
      const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      photo.setAttribute('href', canvas.toDataURL('image/jpeg', 0.94));
      photoSize = { width: canvas.width, height: canvas.height };
      zoom.value = '1'; panX.value = '0'; panY.value = '0';
      placeholder.style.display = 'none'; adjustments.hidden = false;
      updatePhoto();
      photoStatus.textContent = 'Photo ready. Use the sliders to position your face.';
    } catch {
      if (version === photoVersion) { photoStatus.textContent = 'This image could not be opened. Try a smaller JPG or PNG. Your previous photo is unchanged.'; photoInput.value = ''; }
    } finally {
      URL.revokeObjectURL(url);
      if (version === photoVersion) photoLoading = false;
    }
  });
  [zoom, panX, panY].forEach(input => input.addEventListener('input', updatePhoto));
  document.querySelector('#id-photo-remove')!.addEventListener('click', removePhoto);
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', () => { status.textContent = ''; update(); });
  preset.addEventListener('change', () => {
    const institute = institutes.find(item => item.id === preset.value);
    if (institute) {
      template = cardTemplates[institute.template];
      fields.instituteName.value = institute.name;
      fields.cardTitle.value = institute.cardTitle;
      fields.validity.value = institute.defaultValidity;
      fields.course.value = institute.course;
    } else { fields.instituteName.value = ''; fields.instituteName.focus(); }
    update();
  });
  form.addEventListener('reset', event => {
    event.preventDefault();
    for (const key of ['fullName','session','dob','fatherName','contact'] as CardField[]) fields[key].value = '';
    removePhoto(); update(); status.textContent = 'Student details cleared.';
  });

  function ready() {
    update();
    if (!form.reportValidity()) return false;
    if (photoLoading || overflow.length) {
      status.textContent = photoLoading ? 'Please wait for your photo to finish loading.' : 'Some text is too long. Shorten the fields listed above before exporting.';
      status.focus(); return false;
    }
    return !exportBusy;
  }
  function printCard(pdf = false) {
    if (!ready()) return;
    if (dialog.open) dialog.close();
    status.textContent = pdf ? 'Choose “Save as PDF” in the print dialog, with 100% scale and headers and footers off.' : 'Print at 100% scale with headers and footers off.';
    window.print();
  }
  document.querySelector('#id-print')!.addEventListener('click', () => printCard());
  document.querySelector('#id-pdf')!.addEventListener('click', () => printCard(true));
  document.querySelector('#id-dialog-print')!.addEventListener('click', () => printCard());
  document.querySelector('#id-preview-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.querySelector('#id-dialog-card')!.replaceChildren());
  document.querySelector('#id-preview-button')!.addEventListener('click', () => {
    if (!ready()) return;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    // Separate SVG fragment IDs prevent collisions with the live card.
    copy.removeAttribute('id'); copy.removeAttribute('aria-labelledby'); copy.setAttribute('aria-label', 'ID card print preview');
    copy.querySelector('title')?.remove();
    copy.querySelector('clipPath')!.id = 'print-preview-photo-circle';
    copy.querySelector('[clip-path]')!.setAttribute('clip-path', 'url(#print-preview-photo-circle)');
    document.querySelector('#id-dialog-card')!.replaceChildren(copy);
    dialog.showModal();
  });
  window.addEventListener('beforeprint', () => { if (dialog.open) dialog.close(); });

  document.querySelector<HTMLButtonElement>('#id-png')!.addEventListener('click', async event => {
    if (!ready()) return;
    exportBusy = true;
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true; status.textContent = 'Preparing PNG…';
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = template.width * 3; canvas.height = template.height * 3;
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Export failed')), 'image/png'));
      const download = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = download; link.download = 'student-id-card.png';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(download), 30000);
      status.textContent = 'PNG downloaded. For correct physical sizing, use Print or Save as PDF.';
    } catch { status.textContent = 'PNG export failed. Please try again or use Save as PDF.'; }
    finally { URL.revokeObjectURL(url); exportBusy = false; button.disabled = false; }
  });
  update();
  document.querySelector<HTMLFieldSetElement>('#id-editor-fields')!.disabled = false;
  document.querySelectorAll<HTMLButtonElement>('.id-export-actions button').forEach(button => button.disabled = false);
}
