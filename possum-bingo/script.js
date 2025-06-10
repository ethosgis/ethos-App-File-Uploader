const csvFileInput = document.getElementById('csvFile');
const dropZone = document.getElementById('dropZone');
const feedback = document.getElementById('feedback');
const submitBtn = document.getElementById('submitBtn');
const spinner = document.getElementById('spinner');
const btnText = document.getElementById('btnText');

let parsedData = [];
let currentFile = null;
const MAX_FILE_SIZE_MB = 10;

const validateCSV = (file) => {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    feedback.innerHTML = `<p class="error">File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.</p>`;
    submitBtn.disabled = true;
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const delimiter = results.meta.delimiter;
      if (delimiter !== ',' && delimiter !== '\t') {
        feedback.innerHTML = `<p class="error">Invalid delimiter: use comma or tab CSV file only.</p>`;
        submitBtn.disabled = true;
        return;
      }

      parsedData = results.data;
      const errors = [];

      parsedData.forEach((row, i) => {
        const timestamp = row.timestamp;
        const isValidTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(timestamp);
        if (!timestamp) {
          errors.push(`Row ${i + 1}: Missing 'timestamp' field.`);
        } else if (!isValidTimestamp) {
          errors.push(`Row ${i + 1}: Invalid timestamp format: "${timestamp}"`);
        }
      });

      if (errors.length > 0) {
        feedback.innerHTML = `<ul class="error">${errors.map(e => `<li>${e}</li>`).join('')}</ul>`;
        submitBtn.disabled = true;
      } else {
        feedback.innerHTML = `<p class="success">CSV validated successfully with ${parsedData.length} rows.</p>`;
        submitBtn.disabled = false;
        currentFile = file;
      }
    }
  });
};

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
  formData.append('file', currentFile);

  try {
    const response = await fetch('https://ethos-listener.azurewebsites.net/api/possum-bingo-upload', {
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
    submitBtn.disabled = false;
  }
});
