// Web version of the School ID Maker
// Uses localStorage instead of Electron's database
// Compatible with web browsers

let qr; // Global QR variable
let fields = {
  name: "id-card-name",
  lrn: "id-card-lrn",
  "date-of-birth": "id-card-date-of-birth",
  gender: "id-card-gender",
  "grade-section": "id-grade-section",
  "school-head-name": "id-card-schoolhead",
  "school-head-position": "id-card-position",
  "school-name-input": "id-school-name",
  "school-add-input": "id-school-add",
  "parent-input": "parent",
  residence: "address-bs",
  "mobile-no": "mobile",
  sy: "id-card-sy"
};

// Collapse/expand a section: button toggles visibility of a target element
function setupToggle(btnId, targetId) {
  const btn = document.getElementById(btnId);
  const target = document.getElementById(targetId);
  if (!btn || !target) return;
  btn.addEventListener('click', () => {
    const hidden = target.style.display === 'none';
    target.style.display = hidden ? '' : 'none';
    const caret = btn.querySelector('.section-caret, .guide-caret');
    if (caret) caret.textContent = hidden ? '▾' : '▸';
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // fields is already defined globally so Add-to-List works too.

  // Collapsible sections: guide, saved IDs, bulk
  setupToggle('guide-toggle', 'guide-body');
  setupToggle('saved-toggle', 'saved-ids-list');
  setupToggle('bulk-toggle', 'bulk-body');

  // Initialize web database
  initWebDatabase();

  // 🔹 Save DOM defaults at page load
  const domDefaults = {};
  for (let field in fields) {
    const target = document.getElementById(fields[field]);
    if (target) {
      if (target.tagName === 'SELECT' || target.type === 'date') {
        domDefaults[field] = target.value;
      } else {
        domDefaults[field] = target.textContent;
      }
    }
  }
  domDefaults["photo"] = document.getElementById("id-card-photo").src;
  domDefaults["id-logo-input"] = document.getElementById("id-logo").src;

  // Restore saved values + attach live save (skip LRN/mobile: own handlers below)
  const skipLive = { lrn: 1, "mobile-no": 1 };
  for (let field in fields) {
    const target = document.getElementById(fields[field]);
    const savedValue = localStorage.getItem(field);

    if (savedValue && target) {
      if (target.tagName === 'SELECT' || target.type === 'date') {
        target.value = savedValue;
      } else {
        target.textContent = savedValue;
      }
    }

    if (target && !skipLive[field]) {
      if (target.tagName === 'SELECT' || target.type === 'date') {
        target.addEventListener("change", e => {
          safeSet(field, e.target.value);
          clearMark(field);
        });
      } else {
        target.addEventListener("input", e => {
          safeSet(field, e.target.textContent);
          clearMark(field);
        });
      }
    }
  }

  // Photo/logo persistence
  handleImageUpload("photo", "id-card-photo");
  handleImageUpload("id-logo-input", "id-logo");

  // Initialize background image with current logo
  const currentLogo = document.getElementById("id-logo").src;
  if (currentLogo) {
    updateBackgroundImage(currentLogo);
  }

  // Make images clickable for upload
  const photoImg = document.getElementById("id-card-photo");
  const logoImg = document.getElementById("id-logo");

  if (photoImg) {
    photoImg.style.cursor = "pointer";
    photoImg.addEventListener("click", () => {
      document.getElementById("photo").click();
    });
  }

  if (logoImg) {
    logoImg.style.cursor = "pointer";
    logoImg.addEventListener("click", () => {
      document.getElementById("id-logo-input").click();
    });
  }

  function handleImageUpload(inputId, imgId) {
    const input = document.getElementById(inputId);
    const img = document.getElementById(imgId);
    const savedImage = localStorage.getItem(inputId);

    if (savedImage) {
      img.src = savedImage;
      // Update background if it's the logo
      if (inputId === "id-logo-input") {
        updateBackgroundImage(savedImage);
      }
    }

    if (input) {
      input.addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
        const reader = new FileReader();
        reader.onload = event => {
          downscale(event.target.result, inputId === "photo" ? 300 : 400, dataUrl => {
            img.src = dataUrl;
            safeSet(inputId, dataUrl);
            if (inputId === "id-logo-input") updateBackgroundImage(dataUrl);
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function downscale(dataUrl, maxSize, cb) {
    const im = new Image();
    im.onload = () => {
      let w = im.width, h = im.height;
      const s = Math.min(1, maxSize / Math.max(w, h));
      if (s >= 1) { cb(dataUrl); return; }
      const c = document.createElement('canvas');
      c.width = Math.round(w * s); c.height = Math.round(h * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      // Keep PNG for PNG sources — JPEG has no alpha channel, so a
      // transparent logo would come out with a BLACK background.
      const keepPng = /^data:image\/png/i.test(dataUrl);
      cb(c.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.85));
    };
    im.onerror = () => cb(dataUrl);
    im.src = dataUrl;
  }

  function updateBackgroundImage(imageSrc) {
    const detailsBs = document.querySelector('.details-bs');
    if (detailsBs) {
      detailsBs.style.backgroundImage = `linear-gradient(to right, rgba(255,255,255,0.5) 0 100%), url("${imageSrc}")`;
    }
  }

  function safeSet(key, val) {
    try { localStorage.setItem(key, val); }
    catch (e) { console.warn('localStorage full for', key); }
  }

  // Normalize editable text: NBSP (from contenteditable) -> normal space, trim.
  function cleanText(s) {
    return String(s == null ? '' : s).split(String.fromCharCode(160)).join(' ').trim();
  }

  function getVal(key) {
    const el = document.getElementById(fields[key]);
    if (!el) return '';
    if (el.tagName === 'SELECT' || el.type === 'date') return (el.value || '').trim();
    return cleanText(el.textContent);
  }

  function caretOffset(el) {
    try {
      const sel = window.getSelection();
      if (document.activeElement !== el || !sel || sel.rangeCount === 0) return null;
      const r = sel.getRangeAt(0);
      const pre = r.cloneRange();
      pre.selectNodeContents(el);
      pre.setEnd(r.startContainer, r.startOffset);
      return pre.toString().length;
    } catch (e) { return null; }
  }
  function restoreCaret(el, off) {
    try {
      const sel = window.getSelection();
      const r = document.createRange();
      let remaining = Math.max(0, off);
      let placed = false;
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walk.nextNode())) {
        if (remaining <= node.length) { r.setStart(node, remaining); placed = true; break; }
        remaining -= node.length;
      }
      if (!placed) { r.selectNodeContents(el); r.collapse(false); }
      sel.removeAllRanges(); sel.addRange(r);
    } catch (e) {}
  }
  function keepCaret(el, clean) {
    if (el.textContent === clean) return;
    const off = caretOffset(el);
    el.textContent = clean;
    if (off !== null && document.activeElement === el) {
      restoreCaret(el, Math.min(off, clean.length));
    }
  }

  // QR Code
  qr = new QRious({
    element: document.getElementById("qrcode"),
    size: 120,
    value: localStorage.getItem("lrn") || domDefaults["lrn"] || "Default QR"
  });

  // ---- Digit-only fields: caret-safe, no double save ----
  // BUG FIX: old LRN handler rewrote textContent on EVERY keystroke AND
  // also had the generic loop saving raw value -> caret jumped to start,
  // so typing looked "right-to-left". keepCaret preserves cursor.
  const lrnTarget = document.getElementById("id-card-lrn");
  if (lrnTarget) {
    lrnTarget.setAttribute('inputmode', 'numeric');
    lrnTarget.addEventListener("input", e => {
      const raw = e.target.textContent || '';
      const clean = raw.replace(/[^0-9]/g, '').substring(0, 12);
      keepCaret(e.target, clean);
      if (qr) qr.value = clean || "No LRN";
      safeSet("lrn", clean);
      clearMark("lrn");
    });
    lrnTarget.addEventListener("paste", e => {
      e.preventDefault();
      const t = ((e.clipboardData || window.clipboardData).getData('text') || '');
      const clean = t.replace(/[^0-9]/g, '').substring(0, 12);
      try {
        if (!document.execCommand('insertText', false, clean)) {
          document.getSelection().deleteFromDocument();
          document.getSelection().getRangeAt(0).insertNode(document.createTextNode(clean));
        }
      } catch (err) { lrnTarget.textContent = clean; }
    });
    lrnTarget.addEventListener("blur", () => {
      const v = (lrnTarget.textContent || '').trim();
      if (v && !/^[0-9]{12}$/.test(v)) markInvalid("lrn", "LRN must be exactly 12 digits.");
    });
  }

  const mobTarget = document.getElementById("mobile");
  if (mobTarget) {
    mobTarget.setAttribute('inputmode', 'tel');
    mobTarget.addEventListener("input", e => {
      const raw = e.target.textContent || '';
      let clean = raw.replace(/[^0-9]/g, '').substring(0, 11);
      keepCaret(e.target, clean);
      safeSet("mobile-no", clean);
      clearMark("mobile-no");
    });
    mobTarget.addEventListener("paste", e => {
      e.preventDefault();
      const t = ((e.clipboardData || window.clipboardData).getData('text') || '');
      const clean = t.replace(/[^0-9]/g, '').substring(0, 11);
      try {
        if (!document.execCommand('insertText', false, clean)) {
          document.getSelection().deleteFromDocument();
          document.getSelection().getRangeAt(0).insertNode(document.createTextNode(clean));
        }
      } catch (err) { mobTarget.textContent = clean; }
    });
    mobTarget.addEventListener("blur", () => {
      const v = (mobTarget.textContent || '').trim();
      if (v && !/^09[0-9]{9}$/.test(v)) markInvalid("mobile-no", "Mobile must be 11 digits starting with 09.");
    });
  }

  // Name: letters only, live strip invalid chars (caret-safe)
  const nameTarget = document.getElementById("id-card-name");
  if (nameTarget) {
    nameTarget.addEventListener("input", e => {
      const raw = e.target.textContent || '';
      const clean = raw.replace(/[^A-Za-zÑñ .,'’-]/g, '').substring(0, 60);
      keepCaret(e.target, clean);
      safeSet("name", e.target.textContent);
      clearMark("name");
    });
    nameTarget.addEventListener("blur", () => {
      const v = (nameTarget.textContent || '').trim();
      if (v && !/^[A-Za-zÑñ ., '-]{2,60}$/.test(v)) markInvalid("name", "Letters, spaces, comma, . ' - only (2-60).");
    });
  }

  function markInvalid(key, msg) {
    const el = document.getElementById(fields[key]);
    if (!el) return;
    el.classList.add('field-invalid');
    if (msg) el.setAttribute('title', msg);
  }
  function clearMark(key) {
    const el = document.getElementById(fields[key]);
    if (!el) return;
    el.classList.remove('field-invalid');
    el.classList.remove('edit-placeholder');
    el.removeAttribute('title');
  }
  function setStatusLive(html, isErr) {
    const box = document.getElementById('status-message');
    if (!box) return;
    box.innerHTML = (isErr ? '⚠️ ' : '✅ ') + '<strong>' + html + '</strong>';
    box.classList.toggle('status-error', !!isErr);
    box.classList.toggle('status-ok', !isErr);
  }
  // Reset button
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset to default values?")) {
        for (let field in fields) { try { localStorage.removeItem(field); } catch (e) {} }
        try { localStorage.removeItem("photo"); } catch (e) {}
        try { localStorage.removeItem("id-logo-input"); } catch (e) {}

        // Restore DOM defaults
        for (let field in fields) {
          const target = document.getElementById(fields[field]);
          const value = domDefaults[field] || "";

          if (target) {
            if (target.tagName === 'SELECT' || target.type === 'date') {
              target.value = value;
            } else {
              target.textContent = value;
            }
          }
        }

        document.getElementById("id-card-photo").src = domDefaults["photo"];
        document.getElementById("id-logo").src = domDefaults["id-logo-input"];

        // Reset background image to default
        updateBackgroundImage(domDefaults["id-logo-input"]);

        if (qr) qr.value = domDefaults["lrn"] || "Default QR";

        document.querySelectorAll('.field-invalid').forEach(el => el.classList.remove('field-invalid'));
        setStatusLive("Card reset to defaults. Saved list was kept.", false);
      }
    });
  }

  // 🔹 Toggle button for front/back
  const toggleBtn = document.getElementById("toggle-btn");
  const frontCard = document.getElementById("id-card");
  const backCard = document.getElementById("id-card-bs");
  let isFront = true;

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (isFront) {
        frontCard.style.display = "none";
        backCard.style.display = "block";
        toggleBtn.textContent = "Show Front";
        isFront = false;
      } else {
        backCard.style.display = "none";
        frontCard.style.display = "block";
        toggleBtn.textContent = "Show Back";
        isFront = true;
      }
    });
  }
});

// Web database functions using localStorage
function initWebDatabase() {
  // Add event listeners for web buttons
  const addToListBtn = document.getElementById("add-to-list-btn");

  if (addToListBtn) {
    addToListBtn.addEventListener("click", addToListWeb);
  }

  // Load and display saved IDs
  loadSavedIdsWeb();
}

// Add current card to saved list (validates first)
async function addToListWeb() {
  const data = {};
  for (let key in fields) {
    const element = document.getElementById(fields[key]);
    if (element) {
      if (element.tagName === 'SELECT' || element.type === 'date') data[key] = (element.value || '').trim();
      else data[key] = cleanTextGlobal(element.textContent);
    } else data[key] = '';
  }
  data.photo = document.getElementById("id-card-photo").src;
  data.logo = document.getElementById("id-logo").src;

  const res = validateAllLive();
  if (!res.ok) { showErrList(res.errors); return; }
  const dup = getAllIdsWeb().some(x => x.lrn === data.lrn);
  if (dup) { alert("That LRN is already in the saved list."); return; }

  try {
    await addIdWeb(data);
    setStatus("ID added to list for <b>" + esc(data.name) + "</b> (" + esc(data.lrn) + ").", false);
    loadSavedIdsWeb();
  } catch (error) {
    console.error('Failed to add ID:', error);
    alert(error.message || "Failed to add ID to list.");
  }
}

// Shared validation + tiny helpers (global so addToListWeb can use them)
function cleanTextGlobal(s) {
  return String(s == null ? '' : s).split(String.fromCharCode(160)).join(' ').trim();
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fieldVal(key) {
  const el = document.getElementById(fields[key]);
  if (!el) return '';
  if (el.tagName === 'SELECT' || el.type === 'date') return (el.value || '').trim();
  return cleanTextGlobal(el.textContent);
}
function validateRecord(v) {
  // Placeholder values that mean "user must fill this in later".
  // Includes both "-edit-" and the descriptive labels used by SF1 import
  // (e.g. "School Address", "School Head Designation").
  const PLACEHOLDERS = [
    '-edit-', 'School Name', 'School Address',
    'School Head Name', 'School Head Designation', 'Contact Number'
  ];
  const isEdit = (val) => PLACEHOLDERS.indexOf(String(val == null ? '' : val).trim()) !== -1;
  const errors = [];
  if (!isEdit(v.name) && !/^[A-Za-zÑñ ., '-]{2,60}$/.test(v.name || '')) errors.push('Name: use 2-60 letters (comma allowed)');
  if (!isEdit(v.lrn) && !/^[0-9]{12}$/.test(v.lrn || '')) errors.push('LRN: exactly 12 digits');
  if (!isEdit(v['date-of-birth'])) {
    let dobOk = !!(v['date-of-birth']);
    if (dobOk) {
      // Parse YYYY-MM-DD as a local date (avoids UTC midnight shift in +08 etc.)
      const m = String(v['date-of-birth']).match(/^(\d{4})-(\d{2})-(\d{2})/);
      const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v['date-of-birth']);
      const t = new Date(); t.setHours(0, 0, 0, 0);
      if (isNaN(d.getTime())) dobOk = false;
      else if (d > t || d.getFullYear() < 1990) dobOk = false;
    }
    if (!dobOk) errors.push('Birthdate: invalid');
  }
  if (!isEdit(v.gender) && v.gender !== 'Male' && v.gender !== 'Female') errors.push('Gender: Male/Female');
  if (!isEdit(v['grade-section']) && (!v['grade-section'] || v['grade-section'].length > 30)) errors.push('Class: required');
  if (!isEdit(v['school-name-input']) && (!v['school-name-input'] || v['school-name-input'].length < 2)) errors.push('School name: required');
  if (!isEdit(v['school-add-input']) && (!v['school-add-input'] || v['school-add-input'].length < 2)) errors.push('School address: required');
  if (!isEdit(v['parent-input']) && (!v['parent-input'] || v['parent-input'].length < 2)) errors.push('Parent: required');
  if (!isEdit(v.residence) && (!v.residence || v.residence.length < 2)) errors.push('Residence: required');
  if (!isEdit(v['mobile-no']) && !/^09[0-9]{9}$/.test(v['mobile-no'] || '')) errors.push('Mobile: 09 + 9 digits');
  if (!isEdit(v.sy) && !v.sy) errors.push('SY: required');
  return errors;
}
function validateAllLive() {
  const labels = { name: 'Name', lrn: 'LRN', 'date-of-birth': 'Birthdate', gender: 'Gender',
    'grade-section': 'Class', 'school-head-name': 'School head', 'school-head-position': 'Position',
    'school-name-input': 'School name', 'school-add-input': 'School address',
    'parent-input': 'Parent/Guardian', residence: 'Residence', 'mobile-no': 'Mobile', sy: 'School year' };
  const v = {}; for (const k in fields) v[k] = fieldVal(k);
  const msgs = validateRecord(v);
  const errors = [];
  const seen = {};
  const markAll = (ok) => {
    for (const k in fields) {
      const el = document.getElementById(fields[k]);
      if (el) { el.classList.toggle('field-invalid', !ok); el.removeAttribute('title'); }
    }
  };
  if (msgs.length === 0) { markAll(true); return { ok: true, errors: [] }; }
  // Map message prefixes back to keys for highlighting
  const prefix2key = { 'Name': 'name', 'LRN': 'lrn', 'Birthdate': 'date-of-birth', 'Gender': 'gender',
    'Class': 'grade-section', 'School name': 'school-name-input', 'School address': 'school-add-input',
    'Parent': 'parent-input', 'Residence': 'residence', 'Mobile': 'mobile-no', 'SY': 'sy',
    'School head': 'school-head-name', 'Position': 'school-head-position' };
  markAll(true);
  msgs.forEach(m => {
    const pre = m.split(':')[0];
    const key = prefix2key[pre] || pre;
    const el = document.getElementById(fields[key]);
    if (el && !seen[key]) { el.classList.add('field-invalid'); el.setAttribute('title', m); seen[key] = 1; }
    errors.push({ key, label: labels[key] || pre, msg: m.split(':').slice(1).join(':').trim() || m });
  });
  return { ok: false, errors };
}
function showErrList(errors) {
  setStatus('⚠️ <strong>Please fix ' + errors.length + ' field(s):</strong><ul class="status-list">' +
    errors.map(e => '<li><strong>' + esc(e.label) + ':</strong> ' + esc(e.msg) + '</li>').join('') + '</ul>', true);
}
function setStatus(html, isErr) {
  const box = document.getElementById('status-message');
  if (!box) { alert(html.replace(/<[^>]+>/g, '')); return; }
  box.innerHTML = html;
  box.classList.toggle('status-error', !!isErr);
  box.classList.toggle('status-ok', !isErr);
}

// Web database (localStorage)
async function addIdWeb(idData) {
  const ids = getAllIdsWeb();
  // reduce instead of Math.max(...arr) so very large lists can't blow the stack
  const newId = ids.length > 0 ? ids.reduce((m, item) => Math.max(m, item.id || 0), 0) + 1 : 1;
  const newItem = { id: newId, ...idData };
  ids.push(newItem);
  try { localStorage.setItem('schoolIds', JSON.stringify(ids)); }
  catch (e) { throw new Error("Browser storage is full (photos too large). Try a smaller photo or delete old saved IDs."); }
  return newId;
}

function getAllIdsWeb() {
  try {
    const data = localStorage.getItem('schoolIds');
    if (!data) return [];
    const arr = JSON.parse(data);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { console.warn('Corrupt schoolIds, resetting.'); return []; }
}

async function deleteIdWeb(id) {
  const ids = getAllIdsWeb();
  const filteredData = ids.filter(item => item.id !== id);
  localStorage.setItem('schoolIds', JSON.stringify(filteredData));
  return ids.length - filteredData.length;
}

// Web version of loadSavedIds
async function loadSavedIdsWeb() {
  const listContainer = document.getElementById('saved-ids-list');

  try {
    const savedIds = getAllIdsWeb();

    if (savedIds.length === 0) {
      listContainer.innerHTML = '<div class="no-saved-ids">No saved ID cards yet. Add some using the "Add to List" button.</div>';
      return;
    }

    listContainer.innerHTML = '';

    savedIds.forEach(item => {
      const idItem = document.createElement('div');
      idItem.className = 'saved-id-item';
      const nm = document.createElement('div');
      nm.className = 'saved-id-name';
      nm.textContent = item.name || 'Unnamed';
      const det = document.createElement('div');
      det.className = 'saved-id-details';
      det.innerHTML = '';
      [['LRN', item.lrn], ['Class', item['grade-section']], ['Gender', item.gender]].forEach(([lab, val]) => {
        const d = document.createElement('div');
        d.textContent = lab + ': ' + (val || 'N/A');
        det.appendChild(d);
      });
      const acts = document.createElement('div');
      acts.className = 'saved-id-actions';
      const lb = document.createElement('button');
      lb.className = 'load-btn'; lb.textContent = 'Load';
      lb.addEventListener('click', () => loadSavedIdWeb(item.id));
      const db = document.createElement('button');
      db.className = 'delete-btn'; db.textContent = 'Delete';
      db.addEventListener('click', () => deleteSavedIdWeb(item.id));
      acts.appendChild(lb); acts.appendChild(db);
      idItem.appendChild(nm); idItem.appendChild(det); idItem.appendChild(acts);
      listContainer.appendChild(idItem);
    });

  } catch (error) {
    console.error('Failed to load saved IDs:', error);
    listContainer.innerHTML = '<div class="no-saved-ids">Error loading saved IDs.</div>';
  }
}

// Web version of loadSavedId
async function loadSavedIdWeb(id) {
  try {
    const savedIds = getAllIdsWeb();
    const savedId = savedIds.find(item => item.id === id);

    if (savedId) {
      for (let key in fields) {
        const element = document.getElementById(fields[key]);
        if (element) {
          const val = (savedId[key] == null ? '' : String(savedId[key])).trim();
          if (element.tagName === 'SELECT' || element.type === 'date') element.value = val;
          else element.textContent = val;
          try { localStorage.setItem(key, val); } catch (e) {}
        }
      }

      document.getElementById("id-card-photo").src = savedId.photo || 'img/empty-avatar.png';
      document.getElementById("id-logo").src = savedId.logo || 'img/schoollogo.png';
      updateBackgroundImageLive(savedId.logo || 'img/schoollogo.png');

      if (qr) qr.value = savedId.lrn || "No LRN";

      setStatus("Loaded ID for <b>" + esc(savedId.name || 'Unnamed') + "</b>.", false);
    }
  } catch (error) {
    console.error('Failed to load saved ID:', error);
    alert('Failed to load the selected ID.');
  }
}

function updateBackgroundImageLive(src) {
  const detailsBs = document.querySelector('.details-bs');
  if (detailsBs) detailsBs.style.backgroundImage = `linear-gradient(to right, rgba(255,255,255,0.5) 0 100%), url("${src}")`;
}

// Web version of deleteSavedId
async function deleteSavedIdWeb(id) {
  if (confirm('Are you sure you want to delete this saved ID?')) {
    try {
      await deleteIdWeb(id);
      loadSavedIdsWeb(); // Refresh the list
      alert('ID deleted successfully!');
    } catch (error) {
      console.error('Failed to delete ID:', error);
      alert('Failed to delete the ID.');
    }
  }
}

// Progress bar functions
function showProgress() {
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = 'Preparing download...';
}

function updateProgress(percent, text) {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  progressFill.style.width = percent + '%';
  progressText.textContent = text;
}

function hideProgress() {
  const progressContainer = document.getElementById('progress-container');
  setTimeout(() => {
    progressContainer.style.display = 'none';
  }, 1000);
}

// Smart download functions that detect visible face
function downloadPNG() {
  const res = validateAllLive();
  if (!res.ok) { showErrList(res.errors); return; }
  const frontCard = document.getElementById('id-card');
  const backCard = document.getElementById('id-card-bs');

  if (frontCard.style.display !== 'none') {
    downloadFrontPNG();
  } else {
    downloadBackPNG();
  }
}

function downloadPDF() {
  const res = validateAllLive();
  if (!res.ok) { showErrList(res.errors); return; }
  const frontCard = document.getElementById('id-card');
  const backCard = document.getElementById('id-card-bs');

  if (frontCard.style.display !== 'none') {
    downloadFrontPDF();
  } else {
    downloadBackPDF();
  }
}

// Download functions
function downloadFrontPNG() {
  showProgress();
  updateProgress(10, 'Preparing front card...');

  const element = document.getElementById('id-card');

  // Temporarily improve image rendering for capture
  const images = element.querySelectorAll('img');
  const originalRendering = [];
  images.forEach(img => {
    originalRendering.push(img.style.imageRendering);
    img.style.imageRendering = 'auto';
  });

  updateProgress(30, 'Capturing image...');

  html2canvas(element, {
    scale: 2, // Higher resolution
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    imageTimeout: 0,
    logging: false
  }).then(canvas => {
    updateProgress(70, 'Processing image...');

    // Restore original rendering
    images.forEach((img, index) => {
      img.style.imageRendering = originalRendering[index];
    });

    updateProgress(90, 'Creating download...');

    const link = document.createElement('a');
    link.download = 'id-card-front.png';
    link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
    link.click();

    updateProgress(100, 'Download complete!');
    hideProgress();
  }).catch(error => {
    console.error('Download failed:', error);
    updateProgress(0, 'Download failed');
    hideProgress();
    alert('Failed to download PNG. Please try again.');
  });
}

function downloadBackPNG() {
  showProgress();
  updateProgress(10, 'Preparing back card...');

  const element = document.getElementById('id-card-bs');
  const frontCard = document.getElementById('id-card');
  const wasHidden = element.style.display === 'none';
  if (wasHidden) {
    element.style.display = 'block';
    frontCard.style.display = 'none';
  }

  // Temporarily improve image rendering for capture
  const images = element.querySelectorAll('img');
  const originalRendering = [];
  images.forEach(img => {
    originalRendering.push(img.style.imageRendering);
    img.style.imageRendering = 'auto';
  });

  updateProgress(30, 'Capturing image...');

  html2canvas(element, {
    scale: 2, // Higher resolution
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    imageTimeout: 0,
    logging: false
  }).then(canvas => {
    updateProgress(70, 'Processing image...');

    // Restore original rendering
    images.forEach((img, index) => {
      img.style.imageRendering = originalRendering[index];
    });

    updateProgress(90, 'Creating download...');

    const link = document.createElement('a');
    link.download = 'id-card-back.png';
    link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
    link.click();

    if (wasHidden) {
      element.style.display = 'none';
      frontCard.style.display = 'block';
    }

    updateProgress(100, 'Download complete!');
    hideProgress();
  }).catch(error => {
    console.error('Download failed:', error);
    updateProgress(0, 'Download failed');
    hideProgress();
    alert('Failed to download PNG. Please try again.');
  });
}

// A4 multi-card PDF: PORTRAIT cards (54 mm wide × 85.6 mm tall — the CR80
// size stood on its end) laid out on A4 portrait (210 × 297 mm).
// 3 columns × 3 rows = 9 cards per page.
const A4_W = 210, A4_H = 297;
const CARD_W = 54, CARD_H = 85.6;
const CARD_COLS = 3, CARD_ROWS = 3;
const CARD_GUTTER = 2; // mm gap between cards for cutting

// Top-left margin so the grid is centred on the page
const GRID_X = (A4_W - (CARD_COLS * CARD_W + (CARD_COLS - 1) * CARD_GUTTER)) / 2;
const GRID_Y = (A4_H - (CARD_ROWS * CARD_H + (CARD_ROWS - 1) * CARD_GUTTER)) / 2;

// Place a flat list of card image data-URLs into a new A4 jsPDF.
// Images flow left-to-right, top-to-bottom; new pages as needed.
function buildA4Pdf(JSPDF, imgUrls) {
  const pdf = new JSPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const perPage = CARD_COLS * CARD_ROWS;
  for (let i = 0; i < imgUrls.length; i++) {
    const slot = i % perPage;
    if (slot === 0 && i > 0) pdf.addPage('a4', 'portrait');
    const col = slot % CARD_COLS;
    const row = Math.floor(slot / CARD_COLS);
    const x = GRID_X + col * (CARD_W + CARD_GUTTER);
    const y = GRID_Y + row * (CARD_H + CARD_GUTTER);
    pdf.addImage(imgUrls[i], 'PNG', x, y, CARD_W, CARD_H);
  }
  return pdf;
}

// Single-card PDF: front + back side by side on one A4 page.
function downloadCardAsPDF(elementId, filename) {
  if (!window.jspdf) {
    alert('PDF library (CDN) did not load - check internet and try again.');
    return;
  }
  showProgress();
  updateProgress(10, 'Preparing card...');

  const front = document.getElementById('id-card');
  const back = document.getElementById('id-card-bs');
  const backHidden = (back.style.display === 'none' ||
    getComputedStyle(back).display === 'none');

  updateProgress(30, 'Capturing front...');

  (async () => {
    await bulkRenderReady();
    const imgs = [];
    try {
      // Always capture front first
      front.style.display = 'block';
      back.style.display = 'none';
      await bulkRenderReady();
      imgs.push(await captureCardPNG(front));

      updateProgress(55, 'Capturing back...');
      front.style.display = 'none';
      back.style.display = 'block';
      await bulkRenderReady();
      imgs.push(await captureCardPNG(back));
    } finally {
      // Restore original visibility
      if (backHidden) { front.style.display = 'block'; back.style.display = 'none'; }
      else { front.style.display = 'none'; back.style.display = 'block'; }
    }

    updateProgress(75, 'Generating A4 PDF...');
    const pdf = buildA4Pdf(window.jspdf.jsPDF, imgs);

    updateProgress(95, 'Saving PDF...');
    pdf.save(filename);
    updateProgress(100, 'Download complete!');
    hideProgress();
  })().catch(error => {
    console.error('Download failed:', error);
    updateProgress(0, 'Download failed');
    hideProgress();
    alert('Failed to download PDF. Please try again.');
  });
}

function downloadFrontPDF() {
  downloadCardAsPDF('id-card', 'id-card-front.pdf');
}

function downloadBackPDF() {
  downloadCardAsPDF('id-card-bs', 'id-card-back.pdf');
}

// Add an <option> on the fly if CSV has an SY not in the preset list
function ensureSyOption(val) {
  const sel = document.getElementById('id-card-sy');
  if (!sel || !val) return;
  const exists = Array.from(sel.options).some(o => o.value === val || o.text === val);
  if (!exists) {
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = val;
    sel.appendChild(opt);
  }
}

// Function to populate card with data
function populateCard(data) {
  if (data.sy) ensureSyOption(String(data.sy).trim());
  for (let key in fields) {
    const element = document.getElementById(fields[key]);
    if (element) {
      const val = (data[key] == null ? '' : String(data[key])).trim();
      if (element.tagName === 'SELECT' || element.type === 'date') {
        element.value = val;
      } else {
        element.textContent = val;
      }
      try { localStorage.setItem(key, val); } catch (e) {}
    }
  }

  // Set photo and logo
  document.getElementById("id-card-photo").src = data.photo || 'img/empty-avatar.png';
  document.getElementById("id-logo").src = data.logo || 'img/schoollogo.png';
  updateBackgroundImageLive(data.logo || 'img/schoollogo.png');

  // Update QR code
  if (qr) qr.value = (data.lrn && String(data.lrn).trim()) || "Default QR";
}

/* ============ BULK GENERATE FROM EXCEL / CSV ============
 * Upload .xlsx/.xls (SheetJS CDN) or .csv (built-in parser),
 * preview + validate rows, import valid rows, or PNG each row. */
let bulkRows = [];

function bulkInit() {
  const fileInput = document.getElementById('bulk-file');
  if (!fileInput) return;
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (f) bulkReadFile(f);
  });
  const importBtn = document.getElementById('bulk-import-btn');
  const pngBtn = document.getElementById('bulk-png-btn');
  const pdfBtn = document.getElementById('bulk-pdf-btn');
  const tplBtn = document.getElementById('bulk-template-btn');
  if (importBtn) importBtn.addEventListener('click', bulkImport);
  if (pngBtn) pngBtn.addEventListener('click', bulkDownloadPNG);
  if (pdfBtn) pdfBtn.addEventListener('click', bulkDownloadPDF);
  if (tplBtn) tplBtn.addEventListener('click', bulkTemplate);

  // Shared card-details panel
  bulkInitCardDetails();
}

/* ---- Shared card-details panel (school name / address / head / position / SY / logo) ---- */
let bulkLogoDataUrl = ''; // persisted logo override for bulk export

function bulkInitCardDetails() {
  // Mirror the SY options from the card's select
  const cardSy = document.getElementById('id-card-sy');
  const bulkSy = document.getElementById('bulk-sy');
  if (cardSy && bulkSy) {
    Array.from(cardSy.options).forEach(o => {
      if (!o.value) return;
      const opt = document.createElement('option');
      opt.value = o.value; opt.textContent = o.textContent;
      bulkSy.appendChild(opt);
    });
  }

  // Logo upload → store as data URL
  const logoInput = document.getElementById('bulk-logo-input');
  if (logoInput) {
    logoInput.addEventListener('change', () => {
      const f = logoInput.files && logoInput.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => { bulkLogoDataUrl = reader.result; };
      reader.readAsDataURL(f);
    });
  }

  const applyBtn = document.getElementById('bulk-apply-btn');
  if (applyBtn) applyBtn.addEventListener('click', bulkApplyCardDetails);

  // Prefill from current card values
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set('bulk-school-name', fieldVal('school-name-input'));
  set('bulk-school-add', fieldVal('school-add-input'));
  set('bulk-school-head', fieldVal('school-head-name'));
  set('bulk-school-position', fieldVal('school-head-position'));
  set('bulk-sy', fieldVal('sy'));
}

function bulkApplyCardDetails() {
  if (!bulkRows.length) { bulkMsg('Import a file first, then apply card details.', true); return; }
  const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const name = v('bulk-school-name');
  const add  = v('bulk-school-add');
  const head = v('bulk-school-head');
  const pos  = v('bulk-school-position');
  const sy   = v('bulk-sy');

  // SY may not exist in the select yet — ensure it
  if (sy) ensureSyOption(sy);

  let count = 0;
  bulkRows.forEach(item => {
    if (name) item.data['school-name-input'] = name;
    if (add)  item.data['school-add-input']  = add;
    if (head) item.data['school-head-name']  = head;
    if (pos)  item.data['school-head-position'] = pos;
    if (sy)   item.data.sy = sy;
    if (bulkLogoDataUrl) item.data.logo = bulkLogoDataUrl;
    // Re-validate now that placeholders are filled
    item.errors = validateRecord(item.data);
    item.valid = item.errors.length === 0;
    count++;
  });
  bulkRender();
  const ok = bulkRows.filter(x => x.valid).length;
  bulkMsg('Applied card details to <b>' + ok + '</b> row(s).', false);

  // Also offer to apply to the saved ID list
  const saved = getAllIdsWeb();
  if (saved.length > 0) {
    if (confirm('Apply the same card details to ' + saved.length +
        ' saved ID card(s) in your list?')) {
      let updated = 0;
      saved.forEach(item => {
        if (name) item.data['school-name-input'] = name;
        if (add)  item.data['school-add-input']  = add;
        if (head) item.data['school-head-name']  = head;
        if (pos)  item.data['school-head-position'] = pos;
        if (sy)   item.data.sy = sy;
        if (bulkLogoDataUrl) item.data.logo = bulkLogoDataUrl;
        updated++;
      });
      try { localStorage.setItem('schoolIds', JSON.stringify(saved)); } catch (e) {}
      loadSavedIdsWeb();
      bulkMsg('Applied card details to <b>' + ok + '</b> bulk row(s) and <b>' +
        updated + '</b> saved ID(s).', false);
    }
  }
}

/* ---- Reset / clear the saved ID list ---- */
function clearAllSavedIds() {
  const saved = getAllIdsWeb();
  if (!saved.length) { alert('The saved ID list is already empty.'); return; }
  if (!confirm('Delete ALL ' + saved.length + ' saved ID card(s)? This cannot be undone.')) return;
  try { localStorage.removeItem('schoolIds'); } catch (e) {}
  loadSavedIdsWeb();
  alert('Saved ID list cleared.');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bulkInit);
} else { bulkInit(); }

const BULK_COLS = {
  name: 'name', fullname: 'name', 'learner name': 'name', learner: 'name',
  lrn: 'lrn', 'lrn no': 'lrn', 'lrn number': 'lrn',
  birthdate: 'date-of-birth', birthday: 'date-of-birth', dob: 'date-of-birth',
  'date of birth': 'date-of-birth', birth: 'date-of-birth',
  gender: 'gender', sex: 'gender',
  class: 'grade-section', grade: 'grade-section', section: 'grade-section',
  'grade section': 'grade-section', 'grade and section': 'grade-section',
  parent: 'parent-input', guardian: 'parent-input',
  'parent guardian': 'parent-input', 'parent name': 'parent-input',
  'emergency contact': 'parent-input',
  residence: 'residence', 'home address': 'residence',
  address: 'residence', homeaddress: 'residence',
  mobile: 'mobile-no', 'mobile no': 'mobile-no',
  'mobile number': 'mobile-no', 'contact no': 'mobile-no',
  'contact number': 'mobile-no', contact: 'mobile-no',
  sy: 'sy', 'school year': 'sy', 's.y.': 'sy',
  schoolhead: 'school-head-name', 'school head': 'school-head-name',
  'school head name': 'school-head-name', principal: 'school-head-name',
  position: 'school-head-position', designation: 'school-head-position',
  schoolname: 'school-name-input', 'school name': 'school-name-input',
  schooladd: 'school-add-input', 'school address': 'school-add-input',
  'school addr': 'school-add-input'
};

function normHeader(h) {
  // strip BOM + normalize separators so "Name", "LRN No.", "mobile-no" all match
  let s = String(h == null ? '' : h);
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  return s.trim().toLowerCase()
    .split('_').join(' ').split('-').join(' ')
    .replace(/\s+/g, ' ').trim().replace(/\.$/, '');
}

function pad2(n) { return String(n).padStart(2, '0'); }
function localISO(y, mo, d) { return y + '-' + pad2(mo) + '-' + pad2(d); }

function excelDateToISO(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string') {
    const s = v.trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return localISO(m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return localISO(m[3], +m[1], +m[2]);
    const d = new Date(s);
    // use local parts (not toISOString) to avoid off-by-one in UTC+ timezones
    if (!isNaN(d.getTime())) return localISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return s;
  }
  if (typeof v === 'number') {
    if (v > 20000 && v < 80000) {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return localISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    return String(v);
  }
  if (v instanceof Date && !isNaN(v.getTime())) return localISO(v.getFullYear(), v.getMonth() + 1, v.getDate());
  return String(v).trim();
}

function cleanCell(key, v) {
  let s = (v == null ? '' : String(v)).trim();
  if (key === 'lrn') s = s.replace(/[^0-9]/g, '').substring(0, 12);
  else if (key === 'mobile-no') s = s.replace(/[^0-9]/g, '').substring(0, 11);
  else if (key === 'date-of-birth') s = excelDateToISO(v);
  else if (key === 'gender') {
    const t = s.toLowerCase();
    s = (t.charAt(0) === 'm') ? 'Male' : (t.charAt(0) === 'f' ? 'Female' : s);
  }
  else if (key === 'sy' && s) {
    // Accept "2025-2026", "SY 2025-2026", "S.Y. 2025-2026" -> normalize to "S.Y. 2025-2026"
    const m = s.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (m) s = 'S.Y. ' + m[1] + '-' + m[2];
  }
  return s;
}

// Minimal CSV parser (handles quoted commas) for offline use
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else q = false;
      } else cell += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c === '\r') { /* skip */ }
      else cell += c;
    }
  }
  row.push(cell); rows.push(row);
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}

function bulkReadFile(file) {
  const name = (file.name || '').toLowerCase();
  const reader = new FileReader();
  reader.onerror = () => bulkMsg('Could not read file.', true);
  if (name.endsWith('.csv')) {
    reader.onload = e => {
      try {
        let text = String(e.target.result || '');
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
        bulkProcessGrid(parseCSV(text));
      }
      catch (err) { bulkMsg('Could not parse CSV: ' + err.message, true); }
    };
    reader.readAsText(file);
  } else {
    reader.onload = e => {
      try {
        if (typeof XLSX === 'undefined') {
          bulkMsg('Excel library (CDN) did not load — check internet, or save as .CSV and upload that.', true);
          return;
        }
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
        // Detect School Form 1 (SF1) layout and parse it separately
        if (detectSF1(grid)) {
          bulkProcessSF1(grid);
        } else {
          bulkProcessGrid(grid);
        }
      } catch (err) { bulkMsg('Could not parse Excel file: ' + err.message, true); }
    };
    reader.readAsArrayBuffer(file);
  }
}

/* ============ SCHOOL FORM 1 (SF1) IMPORT ============
 * DepEd SF1 "School Register" — .xls/.xlsx produced by the school.
 * Layout (0-indexed columns in the sheet grid):
 *   Row 0: title "School Form 1 (SF1) School Register"
 *   Row 3: School Name (col 5), School Year (col 19)
 *   Row 3: Grade Level (col 30), Section (col 38)
 *   Row 5-6: column headers (merged)
 *   Data rows from row 6 onward:
 *     A(0)=LRN  C(2)=NAME(Last,First,Middle)  G(6)=Sex  H(7)=BirthDate
 *     J(9)=Age  L(11)=MotherTongue  N(13)=IP  O(14)=Religion
 *     P(15)=House/Street  R(17)=Barangay  U(20)=Municipality  W(22)=Province
 *     AB(27)=Father  AF(31)=Mother  AK(36)=Guardian  AO(40)=Relationship
 *     AP(41)=Contact  AR(43)=Modality  AS(44)=Remarks
 *   Rows with "TOTAL" / "COMBINED" are skipped.
 * Fields not in SF1 get the "-edit-" placeholder. */

function detectSF1(grid) {
  if (!grid || !grid.length) return false;
  // Title in A1
  if (grid[0] && grid[0][0]) {
    const c = String(grid[0][0]).toLowerCase();
    if (c.indexOf('school form 1') !== -1 || c.indexOf('(sf1)') !== -1) return true;
  }
  // LRN header in row 5 (index 4)
  if (grid[4] && grid[4][0]) {
    if (String(grid[4][0]).trim().toLowerCase() === 'lrn') return true;
  }
  return false;
}

function sf1Cell(grid, row, col) {
  if (grid[row] && grid[row][col] != null) return String(grid[row][col]).trim();
  return '';
}

// "LAST,FIRST,MIDDLE" → "LAST, FIRST MIDDLE"; empty parts and "-" dropped
function sf1ParseName(raw) {
  const parts = String(raw || '').split(',').map(p => p.trim()).filter(p => p && p !== '-');
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];
  return parts[0] + ', ' + parts.slice(1).join(' ');
}

// "MM-DD-YYYY" / "MM/DD/YYYY" → "YYYY-MM-DD"
function sf1ParseDOB(raw) {
  const m = String(raw || '').match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
  if (!m) return '';
  // SF1 birth date is mm/dd/yyyy — group1=month, group2=day, group3=year
  return m[3] + '-' + m[1].padStart(2, '0') + '-' + m[2].padStart(2, '0');
}

function bulkProcessSF1(grid) {
  bulkRows = [];
  if (!grid || grid.length < 8) {
    bulkMsg('SF1 file looks empty or too short to contain learner data.', true);
    bulkRender(); return;
  }

  // Header info
  const schoolName = sf1Cell(grid, 3, 5) || '';
  const syRaw = sf1Cell(grid, 3, 19);
  const gradeLevel = sf1Cell(grid, 3, 30).replace(/^grade\s*/i, '').trim();
  const section = sf1Cell(grid, 3, 38).trim();
  let gradeSection = '';
  if (gradeLevel && section) gradeSection = gradeLevel + '-' + section;
  else if (gradeLevel) gradeSection = gradeLevel;
  else if (section) gradeSection = section;

  let sy = '';
  const syMatch = syRaw.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (syMatch) sy = 'S.Y. ' + syMatch[1] + '-' + syMatch[2];

  // School Head Name: cell directly below the "Certified Correct:" label.
  // Scan the whole grid (it sits near the bottom, but row varies by SF1 layout).
  let schoolHeadName = '';
  outer:
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r] || []).length; c++) {
      const v = sf1Cell(grid, r, c);
      if (/certified\s*correct/i.test(v)) {
        schoolHeadName = sf1Cell(grid, r + 1, c);
        break outer;
      }
    }
  }

  const cardNow = {};
  for (const k in fields) cardNow[k] = fieldVal(k);
  const currentLogo = document.getElementById('id-logo').src;
  const seenLRN = {};
  getAllIdsWeb().forEach(x => { if (x.lrn) seenLRN[String(x.lrn)] = 'saved'; });
  const MAX_BULK_ROWS = 2000;

  for (let r = 6; r < grid.length && bulkRows.length < MAX_BULK_ROWS; r++) {
    const lrn = sf1Cell(grid, r, 0).replace(/[^0-9]/g, '').substring(0, 12);
    const nameRaw = sf1Cell(grid, r, 2);
    // Skip blanks, summary rows ("TOTAL MALE", "COMBINED"), and non-LRN rows
    if (!lrn || !/^[0-9]{12}$/.test(lrn)) continue;
    if (/total|combined/i.test(nameRaw)) continue;

    const data = Object.assign({}, cardNow);
    data.photo = '';
    data.logo = currentLogo;

    // Core fields
    data.lrn = lrn;
    data.name = sf1ParseName(nameRaw);
    const g = sf1Cell(grid, r, 6).toUpperCase();
    data.gender = g === 'M' ? 'Male' : (g === 'F' ? 'Female' : '');
    data['date-of-birth'] = sf1ParseDOB(sf1Cell(grid, r, 7));
    data['grade-section'] = gradeSection;
    data.sy = sy;

    // Address: House + Barangay + Municipality + Province
    const addrParts = [sf1Cell(grid, r, 15), sf1Cell(grid, r, 17),
                       sf1Cell(grid, r, 20), sf1Cell(grid, r, 22)]
      .filter(Boolean);
    data.residence = addrParts.join(', ') || '-edit-';

    // Parent: prefer father, fall back to mother, then guardian.
    // Normalize "LAST,FIRST,MIDDLE" → "LAST, FIRST MIDDLE" for display.
    let parent = sf1Cell(grid, r, 27) || sf1Cell(grid, r, 31) || sf1Cell(grid, r, 36);
    parent = sf1ParseName(parent) || '-edit-';
    data['parent-input'] = parent;

    // Per-learner placeholders only when the SF1 cell is genuinely empty.
    // Shared school-level fields are set once below (same for every learner
    // in this section/class).
    if (!data['date-of-birth']) data['date-of-birth'] = '-edit-';
    if (!data.gender) data.gender = '-edit-';
    if (!data.name) data.name = '-edit-';
    if (!gradeSection) data['grade-section'] = '-edit-';
    if (!sy) data.sy = '-edit-';

    // Mobile: keep only digits; must be 09XXXXXXXXX
    let mobile = sf1Cell(grid, r, 41).replace(/[^0-9]/g, '');
    if (mobile.length === 10 && mobile.charAt(0) !== '0') mobile = '0' + mobile;
    if (!/^09[0-9]{9}$/.test(mobile)) mobile = '-edit-';
    data['mobile-no'] = mobile;

    // School-level fields — identical for every learner in this SF1 file.
    // Use descriptive labels (not "-edit-") so the card tells the user
    // exactly which value to type in.
    data['school-name-input'] = schoolName || 'School Name';
    data['school-add-input'] = 'School Address';
    data['school-head-name'] = schoolHeadName || 'School Head Name';
    data['school-head-position'] = 'School Head Designation';

    // Extra SF1 fields saved alongside the card data (not printed on card)
    data._sf1 = {
      age: sf1Cell(grid, r, 9),
      mother_tongue: sf1Cell(grid, r, 11),
      ip: sf1Cell(grid, r, 13),
      religion: sf1Cell(grid, r, 14),
      house: sf1Cell(grid, r, 15),
      barangay: sf1Cell(grid, r, 17),
      municipality: sf1Cell(grid, r, 20),
      province: sf1Cell(grid, r, 22),
      father: sf1Cell(grid, r, 27),
      mother: sf1Cell(grid, r, 31),
      guardian: sf1Cell(grid, r, 36),
      guardian_rel: sf1Cell(grid, r, 40),
      contact: sf1Cell(grid, r, 41),
      modality: sf1Cell(grid, r, 43),
      remarks: sf1Cell(grid, r, 44)
    };

    const errors = validateRecord(data);
    if (lrn) {
      if (seenLRN[lrn]) {
        errors.push(seenLRN[lrn] === 'saved'
          ? 'LRN: already in saved list'
          : 'LRN: duplicated in file (row ' + seenLRN[lrn] + ')');
      } else seenLRN[lrn] = r + 1;
    }
    bulkRows.push({ rowNum: r + 1, data, errors, valid: errors.length === 0 });
  }

  bulkRender();
  const ok = bulkRows.filter(x => x.valid).length;
  const bad = bulkRows.length - ok;
  bulkMsg('Loaded <b>' + bulkRows.length + '</b> learner(s) from SF1: ' +
    '<span class="ok">' + ok + ' valid</span>, ' +
    '<span class="bad">' + bad + ' with errors</span>. ' +
    'Fields not in SF1 (school address, school head, position, missing contact) ' +
    'are blank — fill them on the card after loading.', bad > 0);
  document.getElementById('bulk-import-btn').disabled = ok === 0;
  document.getElementById('bulk-png-btn').disabled = ok === 0;
  const pdfBtn2 = document.getElementById('bulk-pdf-btn');
  if (pdfBtn2) pdfBtn2.disabled = ok === 0;
}

function bulkProcessGrid(grid) {
  bulkRows = [];
  if (!grid || grid.length < 2) {
    bulkMsg('File looks empty — need a header row + at least 1 data row.', true);
    bulkRender(); return;
  }
  const headers = grid[0].map(normHeader);
  const col2key = headers.map(h => BULK_COLS[h] || null);
  const need = ['name', 'lrn', 'date-of-birth', 'gender',
    'grade-section', 'parent-input', 'residence', 'mobile-no'];
  const needLabel = { name: 'name', lrn: 'lrn', 'date-of-birth': 'birthdate',
    gender: 'gender', 'grade-section': 'class', 'parent-input': 'parent',
    residence: 'residence', 'mobile-no': 'mobile' };
  const missing = need.filter(k => col2key.indexOf(k) === -1);
  if (missing.length) {
    bulkMsg('Missing required column(s): <b>' + esc(missing.map(k => needLabel[k] || k).join(', ')) +
      '</b>. Tip: download the CSV template.', true);
  }
  const cardNow = {};
  for (const k in fields) cardNow[k] = fieldVal(k);
  const seenLRN = {};
  getAllIdsWeb().forEach(x => { if (x.lrn) seenLRN[String(x.lrn)] = 'saved'; });
  // Cap rows to keep the browser responsive on huge files
  const MAX_BULK_ROWS = 2000;
  if (grid.length - 1 > MAX_BULK_ROWS) {
    bulkMsg('File has ' + (grid.length - 1) + ' data rows; only the first ' +
      MAX_BULK_ROWS + ' will be processed.', true);
  }
  // NOTE: bulk rows intentionally use the placeholder photo ('') instead of the
  // current card photo — otherwise every imported learner would share one face,
  // and storing the same base64 photo N times would blow the 5MB localStorage quota.
  const currentLogo = document.getElementById('id-logo').src;
  for (let r = 1; r < grid.length && bulkRows.length < MAX_BULK_ROWS; r++) {
    const line = grid[r];
    if (line.every(c => String(c == null ? '' : c).trim() === '')) continue;
    const data = Object.assign({}, cardNow);
    data.photo = '';
    data.logo = currentLogo;
    for (let c = 0; c < col2key.length; c++) {
      if (!col2key[c]) continue;
      data[col2key[c]] = cleanCell(col2key[c], line[c]);
    }
    const errors = validateRecord(data);
    const lrn = data.lrn || '';
    if (lrn) {
      if (seenLRN[lrn]) {
        errors.push(seenLRN[lrn] === 'saved'
          ? 'LRN: already in saved list'
          : 'LRN: duplicated in file (row ' + seenLRN[lrn] + ')');
      } else seenLRN[lrn] = r + 1;
    }
    bulkRows.push({ rowNum: r + 1, data, errors, valid: errors.length === 0 });
  }
  bulkRender();
  const ok = bulkRows.filter(x => x.valid).length;
  const bad = bulkRows.length - ok;
  bulkMsg('Loaded <b>' + bulkRows.length + '</b> row(s): ' +
    '<span class="ok">' + ok + ' valid</span>, ' +
    '<span class="bad">' + bad + ' with errors</span>.', bad > 0);
  document.getElementById('bulk-import-btn').disabled = ok === 0;
  document.getElementById('bulk-png-btn').disabled = ok === 0;
  const pdfBtn2 = document.getElementById('bulk-pdf-btn');
  if (pdfBtn2) pdfBtn2.disabled = ok === 0;
}

function bulkRender() {
  const body = document.getElementById('bulk-preview-body');
  if (!body) return;
  body.innerHTML = '';
  if (!bulkRows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5; td.className = 'bulk-empty';
    td.textContent = 'No rows found.';
    tr.appendChild(td); body.appendChild(tr);
    return;
  }
  // Render via DocumentFragment; cap preview rows so huge files stay fast
  const PREVIEW_LIMIT = 500;
  const frag = document.createDocumentFragment();
  bulkRows.slice(0, PREVIEW_LIMIT).forEach(item => {
    const tr = document.createElement('tr');
    tr.className = item.valid ? 'row-ok' : 'row-bad';
    [String(item.rowNum), item.data.name || '', item.data.lrn || '',
     item.data['grade-section'] || ''].forEach(t => {
      const td = document.createElement('td');
      td.textContent = t;
      tr.appendChild(td);
    });
    const st = document.createElement('td');
    if (item.valid) st.textContent = '✓ Ready';
    else { st.textContent = item.errors.join('; '); st.className = 'bulk-err'; }
    tr.appendChild(st);
    frag.appendChild(tr);
  });
  body.appendChild(frag);
  if (bulkRows.length > PREVIEW_LIMIT) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5; td.className = 'bulk-empty';
    td.textContent = 'Showing first ' + PREVIEW_LIMIT + ' of ' + bulkRows.length + ' rows.';
    tr.appendChild(td); body.appendChild(tr);
  }
}

function bulkMsg(html, isErr) {
  const box = document.getElementById('bulk-summary');
  if (!box) return;
  box.innerHTML = (isErr ? '&#10007; ' : '&#10003; ') + html;
}

async function bulkImport() {
  const okRows = bulkRows.filter(x => x.valid);
  if (!okRows.length) { bulkMsg('Nothing valid to import.', true); return; }
  let added = 0;
  const existing = {};
  getAllIdsWeb().forEach(x => { if (x.lrn) existing[String(x.lrn)] = 1; });
  for (const item of okRows) {
    if (existing[item.data.lrn]) continue;
    try {
      await addIdWeb(Object.assign({}, item.data));
      existing[item.data.lrn] = 1;
      added++;
    } catch (err) {
      bulkMsg('Import stopped: ' + esc(err.message || 'storage error'), true);
      break;
    }
  }
  loadSavedIdsWeb();
  setStatus('Bulk import: <b>' + added + '</b> of ' + okRows.length +
    ' valid row(s) added to the list.', added < okRows.length);
  bulkMsg('Imported <span class="ok">' + added + '</span> of ' +
    okRows.length + ' valid row(s).', added < okRows.length);
}

function captureCardPNG(el) {
  return html2canvas(el, {
    scale: 2, useCORS: true, allowTaint: true,
    backgroundColor: null, logging: false
  }).then(canvas => canvas.toDataURL('image/png', 1.0));
}

function saveDataUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
  const bin = atob(parts[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function bulkSafeName(s) {
  return String(s || 'id').replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '').substring(0, 40) || 'id';
}

// Wait for fonts/images so html2canvas doesn't capture half-rendered cards
function bulkRenderReady() {
  const jobs = [];
  if (document.fonts && document.fonts.ready) jobs.push(document.fonts.ready.catch(() => {}));
  jobs.push(new Promise(r => setTimeout(r, 250)));
  return Promise.all(jobs);
}

// Bulk PNG: one ZIP with front+back per learner (single download —
// browsers block dozens of individual downloads). Falls back to
// individual files if the JSZip CDN failed to load.
async function bulkDownloadPNG() {
  const okRows = bulkRows.filter(x => x.valid);
  if (!okRows.length) { bulkMsg('Nothing valid to download.', true); return; }
  const front = document.getElementById('id-card');
  const back = document.getElementById('id-card-bs');
  const backHidden = (back.style.display === 'none' ||
    getComputedStyle(back).display === 'none');
  const useZip = typeof JSZip !== 'undefined';
  const zip = useZip ? new JSZip() : null;
  showProgress();
  let done = 0;
  for (const item of okRows) {
    updateProgress(Math.round((done / okRows.length) * 100),
      'Rendering ' + (done + 1) + '/' + okRows.length + ': ' + item.data.name);
    populateCard(item.data);
    await bulkRenderReady();
    const tag = bulkSafeName(item.data.lrn || item.data.name);
    try {
      front.style.display = 'block'; back.style.display = 'none';
      await bulkRenderReady();
      const fUrl = await captureCardPNG(front);
      front.style.display = 'none'; back.style.display = 'block';
      await bulkRenderReady();
      const bUrl = await captureCardPNG(back);
      if (zip) {
        zip.file('ID-front-' + tag + '.png', dataUrlToBlob(fUrl));
        zip.file('ID-back-' + tag + '.png', dataUrlToBlob(bUrl));
      } else {
        saveDataUrl(fUrl, 'ID-front-' + tag + '.png');
        saveDataUrl(bUrl, 'ID-back-' + tag + '.png');
      }
    } catch (err) {
      console.error('Bulk PNG failed on row ' + item.rowNum, err);
    }
    done++;
  }
  if (backHidden) { front.style.display = 'block'; back.style.display = 'none'; }
  if (zip) {
    updateProgress(100, 'Building ZIP...');
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'school-ids-png.zip';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (err) {
      console.error('ZIP build failed:', err);
      bulkMsg('Could not build ZIP: ' + esc(err.message || 'error'), true);
    }
  }
  updateProgress(100, 'Download complete!');
  hideProgress();
  setStatus('Bulk PNG: rendered <b>' + done +
    '</b> learner(s) (front + back each)' + (zip ? ' in one ZIP.' : '.'), false);
}

async function bulkDownloadPDF() {
  const okRows = bulkRows.filter(x => x.valid);
  if (!okRows.length) { bulkMsg('Nothing valid to download.', true); return; }
  if (!window.jspdf) {
    bulkMsg('PDF library (CDN) did not load - check internet and try again.', true);
    return;
  }
  const front = document.getElementById('id-card');
  const back = document.getElementById('id-card-bs');
  const backHidden = (back.style.display === 'none' ||
    getComputedStyle(back).display === 'none');
  const JSPDF = window.jspdf.jsPDF;
  showProgress();
  const allImgs = [];
  let done = 0;
  for (const item of okRows) {
    updateProgress(Math.round((done / okRows.length) * 60),
      'Rendering ' + (done + 1) + '/' + okRows.length + ': ' + item.data.name);
    populateCard(item.data);
    await bulkRenderReady();
    try {
      front.style.display = 'block'; back.style.display = 'none';
      await bulkRenderReady();
      allImgs.push(await captureCardPNG(front));
      front.style.display = 'none'; back.style.display = 'block';
      await bulkRenderReady();
      allImgs.push(await captureCardPNG(back));
    } catch (err) {
      console.error('Bulk PDF failed on row ' + item.rowNum, err);
    }
    done++;
  }
  if (backHidden) { front.style.display = 'block'; back.style.display = 'none'; }
  updateProgress(70, 'Building A4 PDF (' + allImgs.length + ' cards)...');
  const pdf = buildA4Pdf(JSPDF, allImgs);
  updateProgress(100, 'Saving PDF...');
  pdf.save('school-ids-bulk.pdf');
  hideProgress();
  setStatus('Bulk PDF: saved <b>' + done +
    '</b> learner(s), front + back, <b>' + allImgs.length +
    '</b> cards laid out on A4 pages.', false);
}

function bulkTemplate() {
  const head = 'name,lrn,birthdate,gender,class,parent,residence,mobile';
  const ex1 = '"Dela Cruz, Juan A.",108794888829,2018-08-01,Male,6-Jasmine,' +
    '"Dela Cruz, Pedro",Brgy. Gumian Infanta Quezon,09123456789';
  const ex2 = '"Santos, Maria B.",108794888830,2017-05-12,Female,6-Rose,' +
    '"Santos, Ana",Brgy. Pinaglapatan Infanta Quezon,09123456780';
  const blob = new Blob([head + '\n' + ex1 + '\n' + ex2 + '\n'], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'learners-template.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
