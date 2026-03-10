// ========================
// PWA
// ========================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

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

// driver fields
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('driverEmail');

// ========================
// Auto save driver info
// ========================
function saveDriverInfo() {
  const driver = {
    name: nameInput.value,
    phone: phoneInput.value,
    email: emailInput.value
  };
  localStorage.setItem('driverInfo', JSON.stringify(driver));
}

function loadDriverInfo() {
  const saved = localStorage.getItem('driverInfo');
  if (!saved) return;

  try {
    const driver = JSON.parse(saved);
    if (driver.name) nameInput.value = driver.name;
    if (driver.phone) phoneInput.value = driver.phone;
    if (driver.email) emailInput.value = driver.email;
  } catch {}
}

[nameInput, phoneInput, emailInput].forEach(el => {
  el.addEventListener('change', saveDriverInfo);
});

loadDriverInfo();

// ========================
// Image preview
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

    reader.onload = e => {

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

// drag drop
fileDrop.addEventListener('dragover', e => {
  e.preventDefault();
  fileDrop.classList.add('drag-over');
});

fileDrop.addEventListener('dragleave', () => {
  fileDrop.classList.remove('drag-over');
});

fileDrop.addEventListener('drop', e => {

  e.preventDefault();
  fileDrop.classList.remove('drag-over');

  const dt = e.dataTransfer;

  if (dt.files.length) {
    photosInput.files = dt.files;
    renderPreviews(dt.files);
  }
});

// ========================
// GEOLOCATION
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
    alert('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {

    const address = await getAddress(pos.coords.latitude, pos.coords.longitude);

    locationInput.value =
      address ||
      `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;

  });
});

// ========================
// FORM SUBMIT
// ========================
form.addEventListener('submit', async e => {

  e.preventDefault();

  setStatus('', '');

  const loadStatus = form.querySelector('input[name="loadStatus"]:checked');

  if (!loadStatus) return setStatus('Select Loaded or Unloaded.', 'error');

  if (!locationInput.value.trim()) {
    locationInput.focus();
    return setStatus('Location is required.', 'error');
  }

  if (!phoneInput.value.trim()) {
    phoneInput.focus();
    return setStatus('Phone required.', 'error');
  }

  if (!emailInput.value.trim()) {
    emailInput.focus();
    return setStatus('Driver email is required.', 'error');
  }

  if (photosInput.files.length === 0)
    return setStatus('Attach at least one photo.', 'error');

  submitBtn.disabled = true;
  btnText.textContent = 'Sending...';

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

      loadDriverInfo();

    } else {

      setStatus(text || 'Something went wrong', 'error');
    }

  } catch {

    setStatus('Network error. Try again.', 'error');

  } finally {

    submitBtn.disabled = false;
    btnText.textContent = 'Submit Report';
  }
});

function setStatus(msg, type) {

  status.textContent = msg;
  status.className = type;

  if (msg)
    status.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
}