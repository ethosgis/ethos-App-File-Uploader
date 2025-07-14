// Get query parameters from the URL
const params = new URLSearchParams(window.location.search);
const boatID = params.get('boatid');

// Populate the form and image preview if boatID exists
if (boatID) {
  const boatIdInput = document.getElementById('boatid');
  const boatIdDisplay = document.getElementById('boatid-display');
  const boatIdLabel = document.getElementById('boatid-label');

  if (boatIdInput && boatIdDisplay && boatIdLabel) {
    boatIdInput.style.display = 'none';              // hide input field
    boatIdLabel.style.display = 'none';              // hide label
    boatIdDisplay.textContent = `Boat ID: ${boatID}`;
    boatIdDisplay.style.display = 'block';           // show text
  }

  const photoText = document.getElementById('photo-text');
  if (photoText) {
    photoText.textContent = `Here is the existing boat photo for ${boatID}.`;
  }

  const boatImage = document.getElementById('boat-image');
  if (boatImage) {
    const timestamp = new Date().getTime();
    boatImage.src = `https://mvpstorage.blob.core.windows.net/boatphotos/master-${boatID}.jpg?cb=${timestamp}`;
    boatImage.alt = `Boat photo for ${boatID}`;
  }
}

// Form submit handler
document.getElementById('photo-form').addEventListener('submit', async function (e) {
  e.preventDefault(); // Stop default form submission

  const fileInput = document.getElementById('photo');
  const errorMsg = document.getElementById('error-msg');
  const file = fileInput.files[0];

  errorMsg.textContent = ''; // Clear previous errors

  // Validate
  if (!file) {
    errorMsg.textContent = 'Please select a photo file to upload.';
    return;
  }

  const isJpg = /\.(jpg|jpeg)$/i.test(file.name);
  const isTooLarge = file.size > 4 * 1024 * 1024; // 4MB

  if (!isJpg) {
    errorMsg.textContent = 'Only .jpg or .jpeg files are allowed.';
    return;
  }

  if (isTooLarge) {
    errorMsg.textContent = 'File size must not exceed 4MB.';
    return;
  }

  // Build the FormData for POST
  const formData = new FormData();
  formData.append('FileName', boatID || document.getElementById('boatid').value); // fallback if boatID not in URL
  formData.append('file', file);

  try {
    const response = await fetch(
      'https://mvp-listener-adgmc5d7f7hxaqbp.australiaeast-01.azurewebsites.net/api/master-photo-upload',
      {
        method: 'POST',
        body: formData
      }
    );

    if (response.ok) {
      fileInput.value = ''; // reset file input

      // Refresh the boat image with cache buster
      const boatImage = document.getElementById('boat-image');
      if (boatImage) {
        const timestamp = new Date().getTime();
        boatImage.src = `https://mvpstorage.blob.core.windows.net/boatphotos/master-${boatID}.jpg?cb=${timestamp}`;
      }
    } else {
      const errText = await response.text();
      errorMsg.textContent = `Upload failed: ${errText}`;
    }
  } catch (err) {
    console.error(err);
    errorMsg.textContent = 'An error occurred during upload. Please try again.';
  }
});
