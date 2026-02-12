const form = document.getElementById("reportForm");
const status = document.getElementById("status");
const locationInput = document.getElementById("location");
const detectBtn = document.getElementById("detectLocation");
const photosInput = document.getElementById("photos");
const preview = document.getElementById("preview");

// -------------------
// Image preview
// -------------------
photosInput.addEventListener("change", () => {
  preview.innerHTML = "";
  const files = photosInput.files;

  Array.from(files).forEach(file => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// -------------------
// Reverse geocoding
// -------------------
async function getAddress(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    return data.display_name || "";
  } catch (err) {
    console.error("Geocoding failed:", err);
    return "";
  }
}

// -------------------
// Detect location button
// -------------------
detectBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  detectBtn.textContent = "Detecting...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const address = await getAddress(lat, lon);

      if (address) {
        locationInput.value = address;
      } else {
        alert("Could not fetch address. Please type manually.");
      }

      detectBtn.textContent = "Use My Location";
    },
    () => {
      alert("Location permission denied. Please type manually.");
      detectBtn.textContent = "Use My Location";
    }
  );
});

// -------------------
// Form submission
// -------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  status.textContent = "";
  status.className = "";

  if (photosInput.files.length === 0) {
    status.textContent = "Please upload at least one photo.";
    status.classList.add("error");
    return;
  }

  if (!locationInput.value.trim()) {
    status.textContent = "Location is mandatory.";
    status.classList.add("error");
    locationInput.focus();
    return;
  }

  const formData = new FormData(form);

  try {
    const res = await fetch("/api/send-report", {
      method: "POST",
      body: formData
    });

    const text = await res.text();

    if (res.ok) {
      status.textContent = text;
      status.classList.add("success");
      form.reset();
      preview.innerHTML = "";
    } else {
      status.textContent = text;
      status.classList.add("error");
    }
  } catch (err) {
    console.error(err);
    status.textContent = "Server error.";
    status.classList.add("error");
  }
});
