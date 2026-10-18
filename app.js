const $ = s => document.querySelector(s);
let ARTS = [], CUR = null;

const esc = s => (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function pinta(lista){
  $('#grid').innerHTML = lista.map(a => {
    const no = !a.clave;
    return `<button class="card${no?' no':''}" data-slug="${esc(a.slug)}" ${no?'disabled':''} aria-label="${esc(a.nombre)}">
      ${a.foto?`<img src="${esc(a.foto)}" alt="${esc(a.nombre)}" loading="lazy">`:''}
      <span class="lock">${no?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>':'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>'}</span>
      <span class="c-body">
        <span class="c-name">${esc(a.nombre)}</span>
        <span class="c-meta">${a.sello?`<span class="sello">${esc(a.sello)}</span>`:''}${no?'próximamente':'carpeta privada'}</span>
      </span>
    </button>`;
  }).join('');
  document.querySelectorAll('.card[data-slug]').forEach(b => {
    if (b.disabled) return;
    b.addEventListener('click', () => abre(b.dataset.slug));
  });
}

function abre(slug){
  CUR = ARTS.find(a => a.slug === slug);
  if (!CUR) return;
  $('#mname').textContent = CUR.nombre;
  $('#mmeta').textContent = (CUR.generos||[]).join(' · ') || 'Rabat Music Group';
  $('#mimg').src = CUR.foto || 'assets/logo-rabat.svg';
  $('#mpass').value = '';
  $('#merr').classList.remove('on');
  $('#modal').classList.add('on');
  $('#modal').setAttribute('aria-hidden','false');
  setTimeout(() => $('#mpass').focus(), 120);
}
function cierra(){
  $('#modal').classList.remove('on');
  $('#modal').setAttribute('aria-hidden','true');
  CUR = null;
}
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function descifra(k, pass){
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:b64(k.s), iterations:k.it, hash:'SHA-256'},
    km, {name:'AES-GCM', length:256}, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:b64(k.i)}, key, b64(k.c));
  return new TextDecoder().decode(pt);
}

async function intenta(){
  if (!CUR) return;
  const pass = $('#mpass').value.trim();
  if (!pass) return;
  const btn = $('#mgo');
  btn.disabled = true; btn.textContent = 'Comprobando…';
  $('#merr').classList.remove('on');
  try {
    const url = await descifra(CUR.clave, pass);
    if (!/^https:\/\//.test(url)) throw new Error('url');
    $('#ok').classList.add('on');
    setTimeout(() => { window.location.href = url; }, 600);
  } catch (e) {
    $('#merr').classList.add('on');
    $('#mpass').value = '';
    $('#mpass').focus();
    btn.disabled = false; btn.textContent = 'Abrir mi carpeta';
  }
}
$('#mgo').addEventListener('click', intenta);
$('#mpass').addEventListener('keydown', e => { if (e.key === 'Enter') intenta(); });
$('#mx').addEventListener('click', cierra);
$('#bd').addEventListener('click', cierra);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cierra(); });
$('#q').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  pinta(ARTS.filter(a => a.nombre.toLowerCase().includes(q) || a.slug.includes(q)));
});
fetch('data/artistas.json').then(r => r.json()).then(d => {
  ARTS = d.artistas || [];
  pinta(ARTS);
});
