    // JavaScript to update the ID card preview as the user interacts with the form
    const cardName = document.getElementById("id-card-name");
    const cardLrn = document.getElementById("id-card-lrn");
    const cardBirth = document.getElementById("id-card-date-of-birth");
    const cardGender = document.getElementById("id-card-gender");
    const idGradeSection = document.getElementById("id-grade-section");
    
    const nameInput = document.getElementById("name");
    const lrnInput = document.getElementById("lrn");
    const birthInput = document.getElementById("date-of-birth");
    const genderSelect = document.getElementById("gender");
    const idGradeSectionInput = document.getElementById("grade-section");
    
    nameInput.addEventListener("input", updateCardBearerInfo);
    lrnInput.addEventListener("input", updateCardBearerInfo);
    birthInput.addEventListener("input", updateCardBearerInfo);
    genderSelect.addEventListener("change", updateCardBearerInfo);
    idGradeSectionInput.addEventListener("input", updateCardBearerInfo);

    function updateCardBearerInfo() {
        // Get values from the form inputs
        const name = nameInput.value;
        const lrn = lrnInput.value;
        const birth = birthInput.value;
        const gender = genderSelect.value;
        const gradeSection = idGradeSectionInput.value;

        // Update the card preview with the entered details
        
        cardName.textContent = name;
        cardLrn.textContent = lrn;
        cardBirth.textContent = birth;
        cardGender.textContent = gender;
        idGradeSection.textContent = gradeSection;

        new QRious({
          element: document.getElementById("qrcode"),
          value: lrn, // Replace with your QR code data
          size: 128, // Adjust the size as needed
        });
    }

    //update SY info.
    const cardSy = document.getElementById("id-card-sy");
    const sySelect = document.getElementById("sy");
    sySelect.addEventListener("change", updatesyInfo);
    function updatesyInfo(){
      const sy = sySelect.value;
      cardSy.textContent = sy;

    }
    //School Head Info
    const schoolHeadName = document.getElementById("id-card-schoolhead");
    const schoolHeadNameInput = document.getElementById("school-head-name");
    schoolHeadNameInput.addEventListener("click", updateSchoolHeadInfo);

    const schoolHeadPosition = document.getElementById("id-card-position");
    const schoolHeadPositionInput = document.getElementById("school-head-position");
    schoolHeadPositionInput.addEventListener("click", updateSchoolHeadInfo);


    function updateSchoolHeadInfo(){
      const sh = schoolHeadNameInput.value;
      const shpos =schoolHeadPositionInput.value;

      schoolHeadName.textContent = sh;
      schoolHeadPosition.textContent = shpos;

    }

    //School Info
    const schoolName = document.getElementById("id-school-name");
    const schoolNameInput = document.getElementById("school-name-input");
    schoolNameInput.addEventListener("click", updateSchoolInfo);

    const schoolAdd = document.getElementById("id-school-add");
    const schoolAddInput = document.getElementById("school-add-input");
    schoolAddInput.addEventListener("click", updateSchoolInfo);


    function updateSchoolInfo(){
      const sName = schoolNameInput.value;
      const sAdd =schoolAddInput.value;

      schoolName.textContent = sName;
      schoolAdd.textContent = sAdd;

    }

    //contact info incase of emergency
        const contactName = document.getElementById("parent");
        const contactNameInput = document.getElementById("parent-input");
        contactNameInput.addEventListener("click", updateContactInfo);
    
        const contactAdd = document.getElementById("address-bs");
        const contactAddInput = document.getElementById("residence");
        contactAddInput.addEventListener("click", updateContactInfo);
    
        const contactNum = document.getElementById("mobile");
        const contactNumInput = document.getElementById("mobile-no");
        contactNumInput.addEventListener("click", updateContactInfo);

    
        function updateContactInfo(){
          const contactNameParent = contactNameInput.value;
          const contactResidence=contactAddInput.value;
          const contactNum=contactNumInput.value;
    
          contactName.textContent = contactNameParent;
          contactAdd.textContent = contactResidence;
          contactNum.textContent = contactNum;
    
        }
    
    //update mugshot photo
    const idCardPhoto = document.getElementById("id-card-photo");
    const cardPhotoInput = document.getElementById("photo");
    cardPhotoInput.addEventListener("change", handleCardPhotoUpload);
    function handleCardPhotoUpload() {
        // Handle the photo upload
        const file = cardPhotoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                idCardPhoto.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            idCardPhoto.src = ""; // Clear the photo if no file selected
        }
    }
    //update school logo
    const idSchoolLogo = document.getElementById("id-logo");
    const schoolLogoInput = document.getElementById("id-logo-input");
    const backgroundLogo = document.getElementById("background-logo");
    schoolLogoInput.addEventListener("change", updateSchoolLogo);
    function updateSchoolLogo() {
        // Handle the photo upload
        const file = schoolLogoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
              idSchoolLogo.src = e.target.result;
                // Set the background image of the background logo element
                backgroundLogo.style.backgroundImage = `url('${e.target.result}')`;
            };
            reader.readAsDataURL(file);
        } else {
          idSchoolLogo.src = "img/schoollogo.png"; // Clear the photo if no file selected
        }
    }

  
    function saveCardAsImage() {
      // Select the ID card element
      const idCardContainer = document.getElementById("id-card");
  
      // Use html2canvas to capture the element as an image
      html2canvas(idCardContainer, {
          scale: 3, // You can adjust the scale factor to increase resolution (e.g., 2 for double resolution)
      }).then(function (canvas) {
          // Convert the canvas to a data URL
          const dataUrl = canvas.toDataURL("image/jpeg");
  
          // Create a file name for the downloaded image
          const fileName = "id-card.jpg";
  
          // Create a link element to trigger the download
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = fileName;
  
          // Trigger a click event on the link to start the download
          link.click();
      });
  }
  
  function saveCardAsImageBS() {
    // Select the ID card element
    const idCardContainer = document.getElementById("id-card-bs");

    // Use html2canvas to capture the element as an image
    html2canvas(idCardContainer, {
        scale: 3, // You can adjust the scale factor to increase resolution (e.g., 2 for double resolution)
    }).then(function (canvas) {
        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL("image/jpeg");

        // Create a file name for the downloaded image
        const fileName = "id-card-bs.jpg";

        // Create a link element to trigger the download
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;

        // Trigger a click event on the link to start the download
        link.click();
    });
}

