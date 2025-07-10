// Get query parameters from the URL
const params = new URLSearchParams(window.location.search);
const boatID = params.get('boatid');

// If boatID exists, populate form and image/text
if (boatID) {
  // Fill input
  const boatIdInput = document.getElementById('boatid');
  if (boatIdInput) {
    boatIdInput.value = boatID;
  }

  // Update photo text
  const photoText = document.getElementById('photo-text');
  if (photoText) {
    photoText.textContent = `Here is the existing boat photo for ${boatID}`;
  }

  // Update image source
  const boatImage = document.getElementById('boat-image');
  if (boatImage) {
    boatImage.src = `https://mvpstorage.blob.core.windows.net/boatphotos/master-${boatID}.jpg`;
    boatImage.alt = `Boat photo for ${boatID}`;
  }
}
