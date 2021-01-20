// $(document).ready(function() {
  var curNumber="";
  var entry = "";
  var typeOfWork="General"

  // isDBA = false
  // isMgr = false
  // if (!localStorage.getItem('isDBA'))

  // isDBA = localStorage.getItem('isDBA')
  // isMgr = localStorage.getItem('isMgr')


  if (!localStorage.getItem('delaySec')) {
    localStorage.setItem('delaySec',5)
    delayInSeconds = 5
  }
  else {
    delayInSeconds = localStorage.getItem('delaySec')
  }
  delayInMilliseconds = delayInSeconds * 1000
  console.log('delayInMilliseconds - '+delayInMilliseconds)
  document.getElementById('delaySec').innerHTML = delayInSeconds + ' sec'
  document.getElementById('delayTimeID').value = delayInSeconds

  
  // SET UP LISTENER FOR BARCODE SCANNER INPUT
  memberInput = document.getElementById('memberInput')
  memberInput.addEventListener('input',checkForScannerInput)
  
  // SET UP LISTENERS FOR SETTINGS BUTTONS
  $(".cancelBtn").click(function() {
    $('#settingsModalID').modal('hide')
  })

  // $("#settingsForm").submit(function(event){
  //   console.log('jquery from submit')
	// 	  updateSettings(event);
	// 	return false;
  // });
  
  function updateSettings(settingsForm) {
    console.log('delayTimeID - ' + $("#delayTimeID").val())
    console.log('updateSettings')
    delayInSeconds = settingsForm.delayTime.value
    localStorage.setItem('delaySec',delayInSeconds)
    delayInMilliseconds = delayInSeconds * 1000
    console.log('delayInSeconds - ',delayInSeconds)

    currentLocation = settingsForm.locationOption.value
    localStorage.setItem('clientLocation',currentLocation)
    if (currentLocation == 'RA') {
      document.getElementById("locationID").innerHTML = 'Rolling Acres'
    }
    if (currentLocation == 'BW') {
      document.getElementById("locationID").innerHTML = 'Brownwood'
    } 
    console.log('currentLocation - ',currentLocation)    
  }

  
  // IF clientLocation IS NOT FOUND IN LOCAL STORAGE
  // THEN ASSUME ROLLING ACRES
  currentLocation = localStorage.getItem('clientLocation')
  switch(currentLocation){
    case 'RA':
      document.getElementById("locationID").innerHTML = 'Rolling Acres'
      document.getElementById("locationOptionRA").setAttribute('checked',true)
      document.getElementById("locationOptionBW").removeAttribute('checked')
      break;
    case 'BW':
      document.getElementById("locationID").innerHTML = 'Brownwood'
      document.getElementById("locationOptionBW").setAttribute('checked',true)
      document.getElementById("locationOptionRA").removeAttribute('checked')
      break;
    default:
      document.getElementById("locationID").innerHTML = 'Rolling Acres'
      localStorage.setItem('clientLocation','RA')
      document.getElementById("locationID").innerHTML = 'Rolling Acres'
      document.getElementById("locationOptionRA").setAttribute('checked',true)
      document.getElementById("locationOptionBW").removeAttribute('checked')
      currentLocation = 'RA'
      
  }
  // change the following to a modal dialog with Yes and No
  if (!confirm("Is the location at the top of the screen ok?")){
    alert('Enter the code to change the location.')
  }

  // SHOW TYPE OF WORK AND KEYPAD AREAS OF SCREEN
  document.getElementById('typeOfWorkID').style.display='block';
  document.getElementById('keypadID').style.display='block';
  document.getElementById('memberInput').focus();


  // CHECK FOR SCANNED DATA IN memberInput ELEMENT
  function checkForScannerInput() {
    inputValue = memberInput.value
    if (inputValue.length == 6) {
      curNumber = inputValue
      document.getElementById('enterKey').click()
    }
  }

  $("button").click(function() {    
    entry = $(this).attr("value");
    
    console.log('typeOfWork at button click - '+typeOfWork)
    
    // WAS CLR KEY PRESSED?
    if (entry === "all-clear") {
      clearScreen();
      return;
    }

    if (entry === "enter") {
      // TEST FOR 999999 INTERRUPT FOR CHANGE OF LOCATION OR TIME DELAY
      if (curNumber == '999999') {
        
        $('#settingsModalID').modal('show')
        clearScreen()
        return
      }
      // Create an XHR object; set url
      let xhr = new XMLHttpRequest();
      let url = "/checkIn";
    
      // Open a connection
      try {
        xhr.open("POST", url, true);
      }
      catch {
        alert("Open failed")
        return;
      }
       // Set the request header, i.e., which type of content you are sending
       xhr.setRequestHeader("Content-Type", "application/json");
      
      // Send data to server
      try { 
        if (typeOfWork == null | typeOfWork == ''){
          typeOfWork = 'General'
        }    
        var data = JSON.stringify({"memberID":curNumber, "typeOfWork":typeOfWork,'location':currentLocation});
        xhr.send(data);
      }
      catch(err) {
        alert("Send failed " + err);
      }
      // Create a state change callback
      xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // Get response from server
        result = JSON.parse(this.responseText);


        // ID not found
        if (result.status == 'Not Found') {
          msg = "The Villages ID '" + curNumber + "' was not found."
          modalAlert("CHECK IN STATUS",msg)
          clearScreen()
          return
        }  

        // Not certified
        if (result.status == 'Not Certified') {
          document.getElementById("memberName").value = result.memberName;
          modalAlert("CHECK IN STATUS",result.msg)
          clearScreen()
          return
        }

        // Restricted
        if (result.status == 'Restricted') {
          document.getElementById("memberName").value = result.memberName;
          document.getElementById("typeOfWork").value = "General";
          document.getElementById("checkInTime").value = "";
          document.getElementById("checkOutTime").value = "";

          // NAME IS NOT BEING DISPLAYED BEFORE ALERT MESSAGE 
          
          title = "CHECK IN STATUS FOR " + result.memberName       
          msg = "You are currently restricted from the shop for the following reason:<br><br>" + result.reason
          modalAlert(title,msg)
          clearScreen()
          return
        }
        // Check out
        if (result.status == 'Check Out') {
          document.getElementById("memberName").value = result.memberName;
          document.getElementById("typeOfWork").value = result.typeOfWork;
          document.getElementById("checkInTime").value = result.checkInTime;
          document.getElementById("checkOutTime").value = result.checkOutTime;
          
          // DISPLAY NOTE IF ONE EXISTS
          if (result.note != 'None') {
            document.getElementById("modalNoteTitle").innerHTML = 'Note to ' + result.memberName
            document.getElementById("noteID").value = result.note
            document.getElementById("memberID").value = curNumber
            $('#myModalNote').modal('show')
        }
          setTimeout(clearScreen,delayInMilliseconds)
          return
        }

        // New check in
        if (result.status == 'Check In') {
          document.getElementById("memberName").value = result.memberName;
          
          console.log('result.typeOfWork - '+result.typeOfWork)

          document.getElementById("typeOfWork").value = result.typeOfWork;
          document.getElementById("checkInTime").value = result.checkInTime;
          // DISPLAY NOTE IF ONE EXISTS
          if (result.note != 'None') {
            document.getElementById("modalNoteTitle").innerHTML = 'Note to ' + result.memberName
            document.getElementById("noteID").value = result.note
            document.getElementById("memberID").value = curNumber
            $('#myModalNote').modal('show')
        }
          setTimeout(clearScreen,delayInMilliseconds)
          return
        }

        // Error
        if (result.status == 'Error') {
          document.getElementById("memberName").value = "Error";
          document.getElementById("typeOfWork").value = "Error";
          modalAlert("APPLICATION ERROR","Please contact the IT group.")
          clearScreen()
          return
        }

      }
    }
    return  
    }
    
    
    // Is the data entered a member ID or a type of work label
    if (isNaN(entry)) {
      if (typeof(entry) != "undefined" & entry != "all-clear" & entry != "enter") {
        document.getElementById("typeOfWork").value = entry;
        typeOfWork = entry;
      }
      else {
        typeOfWork = 'General'
        document.getElementById("typeOfWork").value = 'General'
      }
    }
    else {
      curNumber = curNumber + entry;
      document.getElementById("memberInput").value = curNumber;
      console.log(curNumber)

      // IF 6 DIGITS HAVE BEEN ENTERED, CLICK THE ENTER KEY
      if (curNumber.length == 6) {
        document.getElementById('enterKey').click()
      }
    }
    document.getElementById('memberInput').focus()
  })


  function clearScreen() {
    entry='';
    curNumber="";
    document.getElementById("memberName").value = "";
    document.getElementById("typeOfWork").value = "General";
    typeOfWork = 'General'
    document.getElementById("memberInput").value = "";
    document.getElementById("checkInTime").value = "";
    document.getElementById("checkOutTime").value = "";
    document.getElementById("memberInput").focus();
  }

  function modalAlert(title,msg) {
    //alert("Title - " + title + '\n Message - '+msg)
    document.getElementById("modalTitle").innerHTML = title
    document.getElementById("modalBody").innerHTML= msg
    $('#myModalMsg').modal('show')
  }
 

function closeModal() {
  $('#myModalMsg').modal('hide')
  console.log('before call to clearScreen')
  console.log('typeOfWork - '+typeOfWork)
  //clearScreen()
  
  console.log('after call to clearScreen')
  //document.getElementById('memberInput').focus()

}

function closeNote() {
  //$('#myModalNote').modal('hide')
  document.getElementById('memberInput').focus()
}

function deleteNote() {
  villageID = document.getElementById('memberID').value
  // Create an XHR object; set url
  let xhr = new XMLHttpRequest();
  let url = "/deleteNote";

  // Open a connection
  try {
    xhr.open("POST", url, true);
  }
  catch {
    alert("Open failed")
    return;
  }
  // Set the request header, i.e., which type of content you are sending
  xhr.setRequestHeader("Content-Type", "application/json");

  // Send data to server
  try {     
    var data = JSON.stringify({"memberID":villageID});
    xhr.send(data);

  }
  catch(err) {
    alert("Send failed " + err);
  }
  // Create a state change callback
  xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    // Get response from server
    result = JSON.parse(this.responseText);
    if (result.status != 'Success') {
      alert("Note could not be deleted.")
    }
    document.getElementById('memberInput').focus()
    return
    }  
  }
}