function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function folioLabel(doc){
  return `${doc.series ? `${doc.series}-` : ''}${doc.folio}`;
}

export function createDocumentItem(doc, entityName){
  const li = document.createElement('li');
  li.className = 'document-item';
  const amount = (doc.totalAmount !== undefined) ? ` &middot; ${escapeHtml(String(doc.currency || ''))}${escapeHtml(String(doc.totalAmount))}` : '';
  const status = doc.status ? ` <span class="status-badge">${escapeHtml(doc.status)}</span>` : '';
  const info = document.createElement('span');
  info.innerHTML = `<strong>${escapeHtml(folioLabel(doc))}</strong> &middot; ${escapeHtml(doc.startDate)} &rarr; ${escapeHtml(doc.endDate)}` +
    `${doc.quantity ? ' &middot; ' + escapeHtml(String(doc.quantity)) + ' cant.' : ''}${amount}${status}` +
    `${entityName ? `<div class="muted">${escapeHtml(entityName)}</div>` : ''}`;
  li.appendChild(info);
  return li;
}
