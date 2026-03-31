const csvFileInput = document.getElementById('csvFile');
const dropZone = document.getElementById('dropZone');
const feedback = document.getElementById('feedback');
const submitBtn = document.getElementById('submitBtn');
const spinner = document.getElementById('spinner');
const btnText = document.getElementById('btnText');
const emailInput = document.getElementById('emailInput');
const emailFeedback = document.getElementById('emailFeedback');

let parsedData = [];
let currentFile = null;
const MAX_FILE_SIZE_MB = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildLocalTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

const buildUploadFileName = (email, originalName) => {
  const sanitizedEmail = email
    .trim()
    .replace(/@/g, '_at_')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const sanitizedOriginalName = originalName.replace(/[\\/:*?"<>|]/g, '_');
  const timestamp = buildLocalTimestamp();
  return `KICamCat_${sanitizedEmail}_${timestamp}_${sanitizedOriginalName}`;
};

const updateSubmitState = () => {
  const hasValidEmail = EMAIL_REGEX.test(emailInput.value.trim());
  submitBtn.disabled = !(currentFile && hasValidEmail);
};

const validateEmail = () => {
  const email = emailInput.value.trim();

  if (!email) {
    emailFeedback.textContent = 'Email address is required.';
    emailFeedback.className = 'error';
    updateSubmitState();
    return false;
  }

  if (!EMAIL_REGEX.test(email)) {
    emailFeedback.textContent = 'Enter a valid email address.';
    emailFeedback.className = 'error';
    updateSubmitState();
    return false;
  }

  emailFeedback.textContent = 'Email looks valid.';
  emailFeedback.className = 'success';
  updateSubmitState();
  return true;
};

const validateCSV = (file) => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    feedback.innerHTML = '<p class="error">Invalid file type. Please upload a .csv file.</p>';
    currentFile = null;
    updateSubmitState();
    return;
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    feedback.innerHTML = `<p class="error">File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.</p>`;
    currentFile = null;
    updateSubmitState();
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const delimiter = results.meta.delimiter;
      if (delimiter !== ',' && delimiter !== '\t') {
        feedback.innerHTML = `<p class="error">Invalid delimiter: use comma or tab CSV file only.</p>`;
        currentFile = null;
        updateSubmitState();
        return;
      }

      parsedData = results.data;
      const hasFileIdField = results.meta.fields?.some((field) => field.toLowerCase() === 'fileid');
      if (!hasFileIdField) {
        feedback.innerHTML = `<p class="error">Missing required field: fileid.</p>`;
        currentFile = null;
        updateSubmitState();
        return;
      }

      feedback.innerHTML = `<p class="success">CSV validated successfully with ${parsedData.length} rows.</p>`;
      currentFile = file;
      updateSubmitState();
    }
  });
};

emailInput.addEventListener('input', validateEmail);
emailInput.addEventListener('blur', validateEmail);

// File input handler
csvFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) validateCSV(file);
});

// Drag & drop handlers
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) {
    csvFileInput.files = e.dataTransfer.files;
    validateCSV(file);
  }
});

// Submit button handler
submitBtn.addEventListener('click', async () => {
  if (!currentFile) return;

  // Show spinner and disable button
  spinner.hidden = false;
  btnText.textContent = 'Uploading...';
  submitBtn.disabled = true;

  const formData = new FormData();
  const email = emailInput.value.trim();
  const uploadFileName = buildUploadFileName(email, currentFile.name);
  formData.append('file', currentFile, uploadFileName);
  formData.append('email', email);

  try {
    const response = await fetch('https://ethos-listener.azurewebsites.net/api/file-upload?', {
      method: 'POST',
      body: formData
    });

    const resultText = await response.text();
    if (response.ok) {
      feedback.innerHTML += `<p class="success" style="margin-top: 12px;">Upload successful: ${resultText}</p>`;
    } else {
      feedback.innerHTML += `<p class="error" style="margin-top: 12px;">Upload failed: ${resultText}</p>`;
    }
  } catch (error) {
    feedback.innerHTML += `<p class="error" style="margin-top: 12px;">Upload error: ${error.message}</p>`;
  } finally {
    // Reset button state
    spinner.hidden = true;
    btnText.textContent = 'Upload';
    updateSubmitState();
  }
});
