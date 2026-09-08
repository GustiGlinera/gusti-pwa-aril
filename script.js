/* =========================================================
   GUDANG — Sistem Inventaris Ruangan
   Semua data disimpan di LocalStorage (tanpa database).
   ========================================================= */

const STORAGE_KEY = 'gudang_inventaris_items';
const THEME_KEY   = 'gudang_theme';

/* Ganti nama di sini saja — otomatis dipakai di splash screen & footer */
const APP_MAKER_NAME = 'Gusti Aril';

function initMakerName(){
  document.getElementById('makerName').textContent = APP_MAKER_NAME;
  document.getElementById('footerMaker').textContent = APP_MAKER_NAME;
  document.getElementById('footerYear').textContent = new Date().getFullYear();
}

/* ---------------- LocalStorage helpers ---------------- */
function getItems(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Gagal membaca data:', e);
    return [];
  }
}

function saveItems(items){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function uid(){
  return 'itm_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

/* ---------------- Seed contoh data (hanya sekali) ---------------- */
function seedIfEmpty(){
  if (localStorage.getItem(STORAGE_KEY) !== null) return;
  const contoh = [
    { id: uid(), nama:'Komputer Desktop', kode:'INV-0001', ruangan:'Lab Komputer', jumlah:20, kondisi:'Baik' },
    { id: uid(), nama:'Kursi Siswa', kode:'INV-0002', ruangan:'Ruang Kelas', jumlah:36, kondisi:'Baik' },
    { id: uid(), nama:'Proyektor', kode:'INV-0003', ruangan:'Ruang Kelas', jumlah:2, kondisi:'Rusak Ringan' },
    { id: uid(), nama:'Rak Buku', kode:'INV-0004', ruangan:'Perpustakaan', jumlah:8, kondisi:'Baik' },
    { id: uid(), nama:'Printer', kode:'INV-0005', ruangan:'Ruang Guru', jumlah:1, kondisi:'Rusak Berat' },
  ];
  saveItems(contoh);
}

/* =========================================================
   SPLASH SCREEN
   ========================================================= */
function initSplash(){
  const splash = document.getElementById('splash');
  const app = document.getElementById('app');
  window.setTimeout(()=>{
    splash.classList.add('splash-out');
    app.classList.remove('hidden');
    window.setTimeout(()=> splash.remove(), 550);
  }, 2000);
}

/* =========================================================
   NAVIGASI ANTAR VIEW
   ========================================================= */
function gotoView(viewId){
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-active', v.id === viewId));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('is-active', b.dataset.goto === viewId));
  document.getElementById('app').scrollTo?.(0,0);
  if (viewId === 'view-home') renderHome();
  if (viewId === 'view-list') renderList();
}

function initNav(){
  document.querySelectorAll('[data-goto]').forEach(el=>{
    el.addEventListener('click', ()=> gotoView(el.dataset.goto));
  });
}

/* =========================================================
   TEMA (DARK MODE) — bonus
   ========================================================= */
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') document.documentElement.setAttribute('data-theme','dark');
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark){
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'light');
    } else {
      document.documentElement.setAttribute('data-theme','dark');
      localStorage.setItem(THEME_KEY, 'dark');
    }
  });
}

/* =========================================================
   HALAMAN UTAMA (RINGKASAN)
   ========================================================= */
function renderHome(){
  const items = getItems();
  const totalBarang = items.reduce((s,i)=> s + Number(i.jumlah||0), 0);
  const baik = items.filter(i=> i.kondisi === 'Baik').reduce((s,i)=> s + Number(i.jumlah||0), 0);
  const rusak = totalBarang - baik;

  document.getElementById('statTotal').textContent = totalBarang;
  document.getElementById('statBaik').textContent = baik;
  document.getElementById('statRusak').textContent = rusak;

  // Sebaran per ruangan
  const perRuangan = {};
  items.forEach(i=>{
    perRuangan[i.ruangan] = (perRuangan[i.ruangan]||0) + Number(i.jumlah||0);
  });
  const maxVal = Math.max(1, ...Object.values(perRuangan));
  const breakdownEl = document.getElementById('roomBreakdown');
  const ruanganList = Object.keys(perRuangan);
  breakdownEl.innerHTML = ruanganList.length ? ruanganList.map(r=>`
    <div class="room-row">
      <span class="room-name">${escapeHtml(r)}</span>
      <span class="room-bar-track"><span class="room-bar-fill" style="width:${(perRuangan[r]/maxVal*100).toFixed(0)}%"></span></span>
      <span class="room-count">${perRuangan[r]}</span>
    </div>`).join('') : '<p class="empty-state">Belum ada data.</p>';

  // Data terbaru (5 terakhir)
  const recent = [...items].reverse().slice(0,5);
  const recentEl = document.getElementById('recentList');
  recentEl.innerHTML = recent.length ? recent.map(itemCardHtml).join('') : '<p class="empty-state">Belum ada data inventaris.</p>';
  bindItemActions(recentEl);
}

/* =========================================================
   FORM TAMBAH / EDIT
   ========================================================= */
function initForm(){
  const form = document.getElementById('itemForm');
  const roomSelect = document.getElementById('namaRuangan');
  const customField = document.getElementById('customRoomField');
  const customInput = document.getElementById('namaRuanganCustom');
  const cancelBtn = document.getElementById('cancelEdit');

  roomSelect.addEventListener('change', ()=>{
    const isCustom = roomSelect.value === '__custom__';
    customField.hidden = !isCustom;
    customInput.required = isCustom;
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    const nama = document.getElementById('namaBarang').value.trim();
    const kode = document.getElementById('kodeInventaris').value.trim();
    let ruangan = roomSelect.value;
    if (ruangan === '__custom__') ruangan = customInput.value.trim();
    const jumlah = Number(document.getElementById('jumlahBarang').value);
    const kondisi = form.querySelector('input[name="kondisi"]:checked').value;
    const editId = document.getElementById('itemId').value;

    if (!nama || !kode || !ruangan || !jumlah || jumlah < 1){
      showToast('Mohon lengkapi semua data dengan benar.');
      return;
    }

    const items = getItems();

    if (editId){
      const idx = items.findIndex(i=> i.id === editId);
      if (idx > -1){
        items[idx] = { ...items[idx], nama, kode, ruangan, jumlah, kondisi };
      }
      showToast('Data berhasil diperbarui.');
    } else {
      items.push({ id: uid(), nama, kode, ruangan, jumlah, kondisi });
      showToast('Barang berhasil ditambahkan.');
    }

    saveItems(items);
    resetForm();
    gotoView('view-list');
  });

  cancelBtn.addEventListener('click', ()=>{
    resetForm();
    gotoView('view-list');
  });
}

function resetForm(){
  const form = document.getElementById('itemForm');
  form.reset();
  document.getElementById('itemId').value = '';
  document.getElementById('customRoomField').hidden = true;
  document.getElementById('formTitle').textContent = 'Tambah Barang';
  document.getElementById('submitBtn').textContent = 'Simpan Barang';
  document.getElementById('cancelEdit').hidden = true;
}

function loadItemIntoForm(id){
  const item = getItems().find(i=> i.id === id);
  if (!item) return;

  document.getElementById('itemId').value = item.id;
  document.getElementById('namaBarang').value = item.nama;
  document.getElementById('kodeInventaris').value = item.kode;
  document.getElementById('jumlahBarang').value = item.jumlah;

  const roomSelect = document.getElementById('namaRuangan');
  const knownRooms = ['Lab Komputer','Ruang Kelas','Perpustakaan','Ruang Guru'];
  if (knownRooms.includes(item.ruangan)){
    roomSelect.value = item.ruangan;
    document.getElementById('customRoomField').hidden = true;
  } else {
    roomSelect.value = '__custom__';
    document.getElementById('customRoomField').hidden = false;
    document.getElementById('namaRuanganCustom').value = item.ruangan;
  }

  const radio = document.querySelector(`input[name="kondisi"][value="${item.kondisi}"]`);
  if (radio) radio.checked = true;

  document.getElementById('formTitle').textContent = 'Ubah Barang';
  document.getElementById('submitBtn').textContent = 'Simpan Perubahan';
  document.getElementById('cancelEdit').hidden = false;

  gotoView('view-add');
}

/* =========================================================
   DAFTAR INVENTARIS + PENCARIAN + FILTER
   ========================================================= */
function populateRoomFilter(){
  const items = getItems();
  const rooms = [...new Set(items.map(i=> i.ruangan))].sort();
  const select = document.getElementById('filterRoom');
  const current = select.value;
  select.innerHTML = '<option value="">Semua ruangan</option>' +
    rooms.map(r=> `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  select.value = current;
}

function renderList(){
  populateRoomFilter();

  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const roomFilter = document.getElementById('filterRoom').value;
  const condFilter = document.getElementById('filterCondition').value;

  let items = getItems();

  if (query){
    items = items.filter(i=>
      i.nama.toLowerCase().includes(query) || i.kode.toLowerCase().includes(query)
    );
  }
  if (roomFilter) items = items.filter(i=> i.ruangan === roomFilter);
  if (condFilter) items = items.filter(i=> i.kondisi === condFilter);

  const container = document.getElementById('listContainer');
  const emptyState = document.getElementById('emptyState');
  const tableWrap = document.getElementById('invTableWrap');

  emptyState.hidden = items.length !== 0;
  container.innerHTML = items.map(itemCardHtml).join('');
  bindItemActions(container);

  renderTable(items);
}

function renderTable(items){
  let wrap = document.getElementById('invTableWrap');
  if (!wrap){
    wrap = document.createElement('div');
    wrap.id = 'invTableWrap';
    wrap.className = 'inv-wrap';
    document.getElementById('listContainer').after(wrap);
  }
  wrap.innerHTML = `
    <table class="inv-table">
      <thead>
        <tr><th>Nama</th><th>Kode</th><th>Ruangan</th><th>Jml</th><th>Kondisi</th><th></th></tr>
      </thead>
      <tbody>
        ${items.map(i=>`
          <tr>
            <td>${escapeHtml(i.nama)}</td>
            <td class="code-cell">${escapeHtml(i.kode)}</td>
            <td>${escapeHtml(i.ruangan)}</td>
            <td>${i.jumlah}</td>
            <td>${conditionTagHtml(i.kondisi)}</td>
            <td class="table-actions">
              <button data-edit="${i.id}">Ubah</button>
              <button class="del-btn" data-del="${i.id}">Hapus</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  bindItemActions(wrap);
}

function conditionTagHtml(kondisi){
  const map = { 'Baik':'tag-baik', 'Rusak Ringan':'tag-ringan', 'Rusak Berat':'tag-berat' };
  return `<span class="condition-tag ${map[kondisi]||''}">${escapeHtml(kondisi)}</span>`;
}

function itemCardHtml(item){
  return `
  <div class="item-card" data-id="${item.id}">
    <div class="item-card-top">
      <div>
        <div class="item-name">${escapeHtml(item.nama)}</div>
        <div class="item-code">${escapeHtml(item.kode)}</div>
      </div>
      ${conditionTagHtml(item.kondisi)}
    </div>
    <div class="item-meta">
      <span>Ruangan: <strong>${escapeHtml(item.ruangan)}</strong></span>
      <span>Jumlah: <strong>${item.jumlah}</strong></span>
    </div>
    <div class="item-actions">
      <button data-edit="${item.id}">Ubah</button>
      <button class="del-btn" data-del="${item.id}">Hapus</button>
    </div>
  </div>`;
}

function bindItemActions(scope){
  scope.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=> loadItemIntoForm(btn.dataset.edit));
  });
  scope.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', ()=> askDelete(btn.dataset.del));
  });
}

function initListControls(){
  document.getElementById('searchInput').addEventListener('input', renderList);
  document.getElementById('filterRoom').addEventListener('change', renderList);
  document.getElementById('filterCondition').addEventListener('change', renderList);

  const views = document.getElementById('view-list');
  document.getElementById('viewToggle').addEventListener('click', ()=>{
    views.classList.toggle('list-view-table');
  });
}

/* =========================================================
   HAPUS DATA (dengan konfirmasi)
   ========================================================= */
let pendingDeleteId = null;

function askDelete(id){
  const item = getItems().find(i=> i.id === id);
  pendingDeleteId = id;
  document.getElementById('confirmDetail').textContent = item ? `${item.nama} (${item.kode})` : '';
  document.getElementById('confirmModal').hidden = false;
}

function initModal(){
  document.getElementById('confirmCancel').addEventListener('click', ()=>{
    pendingDeleteId = null;
    document.getElementById('confirmModal').hidden = true;
  });
  document.getElementById('confirmOk').addEventListener('click', ()=>{
    if (pendingDeleteId){
      const items = getItems().filter(i=> i.id !== pendingDeleteId);
      saveItems(items);
      showToast('Data berhasil dihapus.');
    }
    pendingDeleteId = null;
    document.getElementById('confirmModal').hidden = true;
    renderList();
    renderHome();
  });
}

/* =========================================================
   EKSPOR / IMPOR DATA — bonus
   ========================================================= */
function initDataTools(){
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const data = JSON.stringify(getItems(), null, 2);
    const blob = new Blob([data], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaris-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor.');
  });

  document.getElementById('importInput').addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Format tidak valid');
        const valid = imported.every(i=> i && i.nama && i.kode && i.ruangan);
        if (!valid) throw new Error('Format tidak valid');
        saveItems(imported);
        renderList();
        renderHome();
        showToast('Data berhasil diimpor.');
      }catch(err){
        showToast('Gagal mengimpor: file tidak valid.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });
}

/* =========================================================
   TOAST NOTIFIKASI
   ========================================================= */
let toastTimer = null;
function showToast(msg){
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.hidden = true, 2200);
}

/* =========================================================
   UTIL
   ========================================================= */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s=>({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[s]));
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  seedIfEmpty();
  initMakerName();
  initSplash();
  initTheme();
  initNav();
  initForm();
  initListControls();
  initModal();
  initDataTools();
  renderHome();
  renderList();
});

/* =========================================================
   SERVICE WORKER REGISTRATION (PWA)
   ========================================================= */
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(err=>{
      console.warn('Registrasi service worker gagal:', err);
    });
  });
}
