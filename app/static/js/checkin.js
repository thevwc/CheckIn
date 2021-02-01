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
  document.getElementById('delaySec').innerHTML = delayInSeconds + ' sec'
  document.getElementById('delayTimeID').value = delayInSeconds

  
  // SET UP LISTENER FOR BARCODE SCANNER INPUT
  memberInput = document.getElementById('memberInput')
  memberInput.addEventListener('input',checkForScannerInput)
  //memberInput.addEventListener('change',memberInputChanged)
  
  // SET UP LISTENERS FOR SETTINGS BUTTONS
  $(".cancelBtn").click(function() {
    console.log('cancelBtn clicked ...')
    $('#settingsModalID').modal('hide')
  })

  function cancelSettings() {
    $('#settingsModalID').modal('hide')
  }

  function updateSettings(settingsForm) {
    delayInSeconds = settingsForm.delayTime.value
    localStorage.setItem('delaySec',delayInSeconds)
    delayInMilliseconds = delayInSeconds * 1000
    
    currentLocation = settingsForm.locationOption.value
    localStorage.setItem('clientLocation',currentLocation)
    if (currentLocation == 'RA') {
      document.getElementById("locationID").innerHTML = 'Rolling Acres'
    }
    if (currentLocation == 'BW') {
      document.getElementById("locationID").innerHTML = 'Brownwood'
    } 
    
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
  // PROMPT USER TO CHECK THE LOCATION
  msg='Please check the location at the top of the screen.'
  modalConfirm("LOCATION",msg,'Ok','Change')
  

  // SHOW TYPE OF WORK AND KEYPAD AREAS OF SCREEN
  document.getElementById('typeOfWorkID').style.display='block';
  document.getElementById('keypadID').style.display='block';
  document.getElementById('memberInput').focus();


  // CHECK FOR SCANNED DATA OR KEYPAD INPUT; DATA WILL BE IN memberInput ELEMENT
  function checkForScannerInput() {
    inputValue = memberInput.value
    if (inputValue.length == 6) {
      curNumber = inputValue
      if (curNumber == '999999') {
        $('#settingsModalID').modal('show')
        clearScreen()
        return
      }
      else {
        processCheckIn()
      }
    
    }
  }

  $("button").click(function() {    
    entry = $(this).attr("value");
    
    // WAS CLR KEY PRESSED?
    if (entry === "all-clear") {
      clearScreen();
      return;
    }

    // if (entry === "enter") {
      

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

      // IF 6 DIGITS HAVE BEEN ENTERED, CHECK FOR 'SETTINGS' CODE
      if (curNumber.length == 6) {
        // TEST FOR 999999 INTERRUPT FOR CHANGE OF LOCATION OR TIME DELAY
        if (curNumber == '999999') {
          $('#settingsModalID').modal('show')
          clearScreen()
          return
        }
        else {
          // CALL PROCESS ROUTINE
          processCheckIn()
        }
        
      }
    }
    document.getElementById('memberInput').focus()
})

function processCheckIn() {
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
    document.getElementById('memberInput').focus()
}

function modalConfirm(title,msg,Btn1,Btn2) {
  console.log('title - '+title)
  console.log('msg - '+msg)
  console.log('Btn1 - '+Btn1)
  console.log('Btn2 - '+Btn2)
  document.getElementById("modalConfirmTitle").innerHTML = title
  document.getElementById("modalConfirmBody").innerHTML= msg
  document.getElementById("modalConfirmBtn1").innerHTML= Btn1
  document.getElementById("modalConfirmBtn2").innerHTML= Btn2
  $('#myModalConfirm').modal('show')
}
function closeConfirmModalBtn1() {
  $('#myModalConfirm').modal('hide')
}
function closeConfirmModalBtn2() {
  $('#myModalConfirm').modal('hide')
  $('#settingsModalID').modal('show')
}

function closeNote() {
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
  document.getElementById('memberInput').focus()
}