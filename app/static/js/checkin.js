$(document).ready(function() {
  var curNumber="";
  var entry = "";
  var typeOfWork="General"
  var delayInMilliseconds = 5000

  memberInput = document.getElementById('memberInput')
  // SET UP LISTENER FOR BARCODE SCANNER INPUT
  memberInput.addEventListener('input',checkForScannerInput)
  
  // IF clientLocation IS NOT FOUND IN LOCAL STORAGE
  // THEN PROMPT WITH MODAL FORM FOR LOCATION
  currentLocation = localStorage.getItem('clientLocation')
  switch(currentLocation){
    case 'RA':
      document.getElementById("shopDefault").selectedIndex = 1; //Option Rolling Acres
      break;
    case 'BW':
      document.getElementById("shopDefault").selectedIndex = 2; //Option Rolling Acres
      break;
    default:
      document.getElementById("shopDefault").selectedIndex = 0;
      document.getElementById('typeOfWorkID').style.display='none';
      document.getElementById('keypadID').style.display='none';
      alert('Please select a location.')
  }

  document.getElementById('shopDefault').addEventListener('change',setClientLocation)
  //document.getElementById('shopDefault').addEventListener('click',setClientLocation)

  function setClientLocation() {
    shopSelected = document.getElementById('shopDefault').value
    switch(shopSelected){
      case 'RA':
        localStorage.setItem('clientLocation','RA');
        currentLocation = 'RA'
        break;
      case 'BW':
        localStorage.setItem('clientLocation','BW');
        currentLocation = 'BW'
        break;
    }
    document.getElementById('typeOfWorkID').style.display='block';
    document.getElementById('keypadID').style.display='block';
    document.getElementById('memberInput').focus();
  }

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
    if (entry === "all-clear") {
      clearScreen();
      return;
    }

    if (entry === "enter") {
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
      document.getElementById("typeOfWork").value = entry;
      typeOfWork = entry;
      //document.getElementById('memberInput').focus()
    }
    else {
      curNumber = curNumber + entry;
      document.getElementById("memberInput").value = curNumber;
    }
    document.getElementById('memberInput').focus()
  })
  function clearScreen() {
    entry='';
    curNumber="";
    document.getElementById("memberName").value = "";
    document.getElementById("typeOfWork").value = "General";
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
 
})
function closeModal() {
  $('#myModalMsg').modal('hide')
  document.getElementById('memberInput').focus()

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