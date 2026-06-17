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

const MAX_FILES = 4;
const MAX_FILE_SIZE_BYTES = 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 4 * 1024 * 1024;
const TARGET_FILE_SIZE_BYTES = 900 * 1024;

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
// FORM VALIDATION
// ========================
const requiredFields = {
  name: nameInput,
  phone: phoneInput,
  driverEmail: emailInput,
  location: locationInput,
  truckNumber: document.getElementById('truckNumber'),
  trailerNumber: document.getElementById('trailerNumber'),
  breakdown: document.getElementById('breakdown')
};

function validateForm() {
  // Check all text inputs
  for (const [fieldName, field] of Object.entries(requiredFields)) {
    if (!field.value.trim()) return false;
  }

  // Check load status radio
  const loadStatus = form.querySelector('input[name="loadStatus"]:checked');
  if (!loadStatus) return false;

  // Check at least one photo
  if (photosInput.files.length === 0) return false;

  return true;
}

function updateSubmitButton() {
  submitBtn.disabled = !validateForm();
}

// Add listeners to all required fields
Object.values(requiredFields).forEach(field => {
  field.addEventListener('input', updateSubmitButton);
  field.addEventListener('change', updateSubmitButton);
});

form.querySelectorAll('input[name="loadStatus"]').forEach(radio => {
  radio.addEventListener('change', updateSubmitButton);
});

function enforceClientFileCount(fileList) {
  const files = Array.from(fileList);

  if (files.length <= MAX_FILES) {
    return files;
  }

  setStatus(`Only ${MAX_FILES} photos are allowed. Extra photos were skipped.`, 'error');
  return files.slice(0, MAX_FILES);
}

photosInput.addEventListener('change', () => {
  const limitedFiles = enforceClientFileCount(photosInput.files);

  if (limitedFiles.length !== photosInput.files.length) {
    const dataTransfer = new DataTransfer();
    limitedFiles.forEach(file => dataTransfer.items.add(file));
    photosInput.files = dataTransfer.files;
  }

  renderPreviews(photosInput.files);
  updateSubmitButton();
});

// Initial state
updateSubmitButton();

// ========================
// IMAGE COMPRESSION
// ========================
async function imageFileToBlob(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onerror = () => reject(new Error('Could not read image.'));

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onerror = () => reject(new Error('Could not decode image.'));

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image.'));
              return;
            }

            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
}

async function compressImage(file) {
  const attempts = [
    { maxWidth: 2000, quality: 0.65 },
    { maxWidth: 1800, quality: 0.55 },
    { maxWidth: 1600, quality: 0.5 },
    { maxWidth: 1400, quality: 0.45 },
    { maxWidth: 1200, quality: 0.4 },
    { maxWidth: 1000, quality: 0.35 }
  ];

  let bestBlob = null;

  for (const attempt of attempts) {
    const blob = await imageFileToBlob(file, attempt.maxWidth, attempt.quality);
    bestBlob = blob;

    if (blob.size <= TARGET_FILE_SIZE_BYTES) {
      break;
    }
  }

  return new File([bestBlob], file.name, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}

// ========================
// Image preview
// ========================
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
    const limitedFiles = enforceClientFileCount(dt.files);
    const dataTransfer = new DataTransfer();

    limitedFiles.forEach(file => dataTransfer.items.add(file));
    photosInput.files = dataTransfer.files;

    renderPreviews(photosInput.files);
    updateSubmitButton();
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
  btnText.textContent = 'Compressing images...';

  const formData = new FormData(form);

  // Compress images before sending
  try {
    const compressedFiles = [];
    let totalCompressedSize = 0;

    for (const file of photosInput.files) {
      const compressed = await compressImage(file);

      if (compressed.size > MAX_FILE_SIZE_BYTES) {
        return setStatus('One photo is still too large after compression. Use smaller images.', 'error');
      }

      totalCompressedSize += compressed.size;

      if (totalCompressedSize > MAX_TOTAL_SIZE_BYTES) {
        return setStatus('Photos are too large in total. Use fewer photos or smaller images.', 'error');
      }

      compressedFiles.push(compressed);
    }

    // Remove original photos and add compressed ones
    formData.delete('photos');
    compressedFiles.forEach(file => {
      formData.append('photos', file);
    });
  } catch (err) {
    return setStatus('Image compression failed. Try with smaller files.', 'error');
  }

  btnText.textContent = 'Sending...';

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

      if (text === 'EMAIL_AUTH_FAILURE') {
        setStatus('Email authentication failed. The server cannot log in to the mail account — please contact IT support.', 'error');
      } else if (text === 'EMAIL_CONNECTION_FAILURE') {
        setStatus('Could not connect to the mail server. Check your internet connection and try again.', 'error');
      } else {
        setStatus(text || 'Something went wrong', 'error');
      }
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