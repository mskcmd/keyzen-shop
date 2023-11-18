$(document).ready(function() {
    console.log('Document ready!');

    $(".imageInput").change(function() {
      var input = this;
      var imagePreview = $(input).siblings('.rounded-image-preview').children('img')[0];
  
      if (input.files && input.files[0]) {
        var reader = new FileReader();
  
        reader.onload = function(e) {
          imagePreview.src = e.target.result;
          $(input).siblings('.rounded-image-preview').show(); // Show the parent div
        };
  
        reader.readAsDataURL(input.files[0]);
      }
    });
  });
  
  function updateImagePreview(inputElement, imagePreviewId, alreadyImg, removeButtonId) {
    var imagePreview = document.getElementById(imagePreviewId);
    var file = inputElement.files[0];
    var removeButton = document.getElementById(removeButtonId);
  
    if (file) {
      var reader = new FileReader();
  
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        removeButton.style.display = 'block'; // Show the remove button when a file is selected
      };
  
      reader.onerror = function(e) {
        console.error('Error reading the file:', e);
      };
  
      reader.readAsDataURL(file);
    } else {
      // Restore the original image source when no file is selected
      imagePreview.src = alreadyImg;
      removeButton.style.display = 'none'; // Hide the remove button when no file is selected
    }
  }
  
  function removeImagePreview(imagePreviewId, alreadyImg, removeButtonId, inputElementId) {
    var imagePreview = document.getElementById(imagePreviewId);
    var removeButton = document.getElementById(removeButtonId);
    var inputElement = document.getElementById(inputElementId);
  
    // Restore the original image source when the image is removed
    imagePreview.src = alreadyImg;
    removeButton.style.display = 'none'; // Hide the remove button
    inputElement.value = ""; // Clear the file input value
  }
  