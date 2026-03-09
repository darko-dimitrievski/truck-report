// ========================
// PWA & Service Worker
// ========================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// PWA Install prompt
let deferredPrompt = null;
const installBanner = document.createElement('div');
installBanner.id = 'installBanner';
installBanner.innerHTML = `
  <p><strong>Install the App</strong><br>Add to home screen for quick access</p>
  <button id="installBtn">Install</button>
  <button id="dismissBanner">×</button>
`;
document.body.appendChild(installBanner);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => installBanner.classList.add('show'), 2000);
});

installBanner.querySelector('#installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBanner.classList.remove('show');
});

installBanner.querySelector('#dismissBanner').addEventListener('click', () => {
  installBanner.classList.remove('show');
});

// ========================
// Elements
// ========================
const form = document.getElementById('reportForm');
const status = document.getElementById('status');
const locationInput = document.getElementById('location');
const detectBtn = document.getElementById('detectLocation');
const photosInput = document.getElementById('photos');
const preview = document.getElementById('preview');
const fileLabel = document.getElementById('fileLabel');
const fileDrop = document.getElementById('fileDrop');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');

// ========================
// Image Preview
// ========================
photosInput.addEventListener('change', () => {
  renderPreviews(photosInput.files);
});

function renderPreviews(files) {
  preview.innerHTML = '';
  if (files.length === 0) {
    fileLabel.textContent = 'Tap to select or drag photos here';
    return;
  }
  fileLabel.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} selected`;
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wrap = document.createElement('div');
      wrap.className = 'thumb-wrap';
      const img = document.createElement('img');
      img.src = e.target.result;
      wrap.appendChild(img);
      preview.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
}

// Drag-and-drop on file area
fileDrop.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileDrop.classList.add('drag-over');
});
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
fileDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  fileDrop.classList.remove('drag-over');
  const dt = e.dataTransfer;
  if (dt.files.length) {
    photosInput.files = dt.files;
    renderPreviews(dt.files);
  }
});

// ========================
// Geolocation
// ========================
async function getAddress(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    return data.display_name || '';
  } catch {
    return '';
  }
}

detectBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation not supported by your browser');
    return;
  }
  detectBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px;animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>`;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const address = await getAddress(pos.coords.latitude, pos.coords.longitude);
      locationInput.value = address || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      detectBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" opacity=".3"/></svg>`;
    },
    () => {
      alert('Location access denied. Please type the address manually.');
      detectBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" opacity=".3"/></svg>`;
    }
  );
});

// CSS for spin animation
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleEl);

// ========================
// Form Submission
// ========================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('', '');

  const loadStatus = form.querySelector('input[name="loadStatus"]:checked');
  if (!loadStatus) return setStatus('Please select Loaded or Unloaded.', 'error');
  if (!locationInput.value.trim()) {
    locationInput.focus();
    return setStatus('Location is required.', 'error');
  }
  if (!form.phone.value.trim()) {
    form.phone.focus();
    return setStatus('Phone number is required.', 'error');
  }
  if (photosInput.files.length === 0) return setStatus('Please attach at least one photo.', 'error');

  submitBtn.disabled = true;
  btnText.textContent = 'Sending…';

  const formData = new FormData(form);

  try {
    const res = await fetch('/api/send-report', {
      method: 'POST',
      body: formData
    });
    const text = await res.text();
    if (res.ok) {
      setStatus('✓ Report submitted successfully!', 'success');
      form.reset();
      preview.innerHTML = '';
      fileLabel.textContent = 'Tap to select or drag photos here';
    } else {
      setStatus(text || 'Something went wrong. Try again.', 'error');
    }
  } catch {
    setStatus('Network error. Check your connection and retry.', 'error');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Submit Report';
  }
});

function setStatus(msg, type) {
  status.textContent = msg;
  status.className = type;
  if (msg) status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
