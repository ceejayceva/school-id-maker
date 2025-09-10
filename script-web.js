// Web version of the School ID Maker
// Uses localStorage instead of Electron's database
// Compatible with web browsers

let qr; // Global QR variable
let fields; // Global fields object

document.addEventListener("DOMContentLoaded", () => {
  fields = {
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

  // Restore saved values from localStorage
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

    if (target) {
      if (target.tagName === 'SELECT' || target.type === 'date') {
        target.addEventListener("change", e => {
          const value = e.target.value;
          localStorage.setItem(field, value);
        });
      } else {
        target.addEventListener("input", e => {
          const value = e.target.textContent;
          localStorage.setItem(field, value);
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
        const reader = new FileReader();
        reader.onload = event => {
          img.src = event.target.result;
          localStorage.setItem(inputId, event.target.result);
          // Update background if it's the logo
          if (inputId === "id-logo-input") {
            updateBackgroundImage(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function updateBackgroundImage(imageSrc) {
    const detailsBs = document.querySelector('.details-bs');
    if (detailsBs) {
      detailsBs.style.backgroundImage = `linear-gradient(to right, rgba(255, 255, 255, 0.5) 0 100%), url('${imageSrc}')`;
    }
  }

  // QR Code
  qr = new QRious({
    element: document.getElementById("qrcode"),
    size: 120,
    value: localStorage.getItem("lrn") || domDefaults["lrn"] || "Default QR"
  });

  const lrnTarget = document.getElementById("id-card-lrn");
  if (lrnTarget) {
    lrnTarget.addEventListener("input", e => {
      // Validate LRN - only allow numbers and limit to 12 characters
      let value = e.target.textContent.replace(/[^0-9]/g, ''); // Remove non-numeric characters
      if (value.length > 12) {
        value = value.substring(0, 12); // Limit to 12 characters
      }
      e.target.textContent = value;

      qr.value = value || "No LRN";
      localStorage.setItem("lrn", value);
    });

    // Add validation on paste
    lrnTarget.addEventListener("paste", e => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const numericText = pastedText.replace(/[^0-9]/g, '').substring(0, 12);
      document.execCommand('insertText', false, numericText);
    });
  }

  // 🔹 Reset button
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset to default values?")) {
        localStorage.clear();

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

        qr.value = domDefaults["lrn"] || "Default QR";

        alert("All data has been reset to original defaults.");
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

// Web version of addToList using localStorage
async function addToListWeb() {
  const data = {};
  for (let key in fields) {
    const element = document.getElementById(fields[key]);
    if (element) {
      if (element.tagName === 'SELECT' || element.type === 'date') {
        data[key] = element.value;
      } else {
        data[key] = element.textContent;
      }
    } else {
      data[key] = '';
    }
  }

  // Get photo and logo as base64
  data.photo = document.getElementById("id-card-photo").src;
  data.logo = document.getElementById("id-logo").src;

  try {
    await addIdWeb(data);
    alert("ID added to list successfully! You can continue editing.");
    loadSavedIdsWeb(); // Refresh the list
  } catch (error) {
    console.error('Failed to add ID:', error);
    alert("Failed to add ID to list.");
  }
}

// Web database functions using localStorage
async function addIdWeb(idData) {
  const ids = getAllIdsWeb();
  const newId = ids.length > 0 ? Math.max(...ids.map(item => item.id)) + 1 : 1;
  const newItem = { id: newId, ...idData };
  ids.push(newItem);
  localStorage.setItem('schoolIds', JSON.stringify(ids));
  return newId;
}

function getAllIdsWeb() {
  const data = localStorage.getItem('schoolIds');
  return data ? JSON.parse(data) : [];
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

    savedIds.forEach(id => {
      const idItem = document.createElement('div');
      idItem.className = 'saved-id-item';
      idItem.innerHTML = `
        <div class="saved-id-name">${id.name || 'Unnamed'}</div>
        <div class="saved-id-details">
          <div>LRN: ${id.lrn || 'N/A'}</div>
          <div>Grade: ${id.grade_section || 'N/A'}</div>
          <div>Gender: ${id.gender || 'N/A'}</div>
        </div>
        <div class="saved-id-actions">
          <button class="load-btn" onclick="loadSavedIdWeb(${id.id})">Load</button>
          <button class="delete-btn" onclick="deleteSavedIdWeb(${id.id})">Delete</button>
        </div>
      `;
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
      // Populate the form fields
      for (let key in fields) {
        const element = document.getElementById(fields[key]);
        if (element) {
          if (element.tagName === 'SELECT' || element.type === 'date') {
            element.value = savedId[key] || '';
          } else {
            element.textContent = savedId[key] || '';
          }
        }
      }

      // Set photo and logo
      document.getElementById("id-card-photo").src = savedId.photo || 'img/empty-avatar.png';
      document.getElementById("id-logo").src = savedId.logo || 'img/schoollogo.png';

      // Update QR code
      if (qr && savedId.lrn) {
        qr.value = savedId.lrn;
      }

      // Update localStorage for persistence
      for (let key in fields) {
        const element = document.getElementById(fields[key]);
        if (element) {
          const value = savedId[key] || '';
          localStorage.setItem(key, value);
        }
      }

      alert(`Loaded ID for ${savedId.name || 'Unnamed'}`);
    }
  } catch (error) {
    console.error('Failed to load saved ID:', error);
    alert('Failed to load the selected ID.');
  }
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
  const frontCard = document.getElementById('id-card');
  const backCard = document.getElementById('id-card-bs');

  if (frontCard.style.display !== 'none') {
    downloadFrontPNG();
  } else {
    downloadBackPNG();
  }
}

function downloadPDF() {
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

function downloadFrontPDF() {
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
    updateProgress(60, 'Processing PDF...');

    // Restore original rendering
    images.forEach((img, index) => {
      img.style.imageRendering = originalRendering[index];
    });

    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    updateProgress(80, 'Generating PDF...');

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    updateProgress(95, 'Saving PDF...');
    pdf.save('id-card-front.pdf');

    updateProgress(100, 'Download complete!');
    hideProgress();
  }).catch(error => {
    console.error('Download failed:', error);
    updateProgress(0, 'Download failed');
    hideProgress();
    alert('Failed to download PDF. Please try again.');
  });
}

function downloadBackPDF() {
  showProgress();
  updateProgress(10, 'Preparing back card...');

  const element = document.getElementById('id-card-bs');

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
    updateProgress(60, 'Processing PDF...');

    // Restore original rendering
    images.forEach((img, index) => {
      img.style.imageRendering = originalRendering[index];
    });

    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    updateProgress(80, 'Generating PDF...');

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    updateProgress(95, 'Saving PDF...');
    pdf.save('id-card-back.pdf');

    updateProgress(100, 'Download complete!');
    hideProgress();
  }).catch(error => {
    console.error('Download failed:', error);
    updateProgress(0, 'Download failed');
    hideProgress();
    alert('Failed to download PDF. Please try again.');
  });
}

// Function to populate card with data
function populateCard(data) {
  for (let key in fields) {
    const element = document.getElementById(fields[key]);
    if (element) {
      if (element.tagName === 'SELECT' || element.type === 'date') {
        element.value = data[key] || '';
      } else {
        element.textContent = data[key] || '';
      }
    }
  }

  // Set photo and logo
  document.getElementById("id-card-photo").src = data.photo || 'img/empty-avatar.png';
  document.getElementById("id-logo").src = data.logo || 'img/schoollogo.png';

  // Update QR code
  qr.value = data.lrn || "Default QR";
}
