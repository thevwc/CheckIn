$(document).ready(function() {
  var curNumber="";
  var entry = "";
  var typeOfWork="General"
  var delayInMilliseconds = 5000
  //var x = document.getElementById("setPause");
  //x.addEventListener("change", setPause);
  

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
        var data = JSON.stringify({"memberID":curNumber, "typeOfWork":typeOfWork});
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
          msg = "The village ID '" + curNumber + "' was not found."
          modalAlert("CHECK IN STATUS",msg)
          clearScreen()
          return
        }  

        // Not certified
        if (result.status == 'Not Certified') {
          document.getElementById("memberName").value = result.memberName;
          modalAlert("CHECK IN STATUS",result.msg)
          //alert(result.msg)
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
          setTimeout(clearScreen,delayInMilliseconds)
          return
        }

        // New check in
        if (result.status == 'Check In') {
          document.getElementById("memberName").value = result.memberName;
          document.getElementById("typeOfWork").value = result.typeOfWork;
          document.getElementById("checkInTime").value = result.checkInTime;
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
    // ... may have to check with ... if this.id == "typeOfWorkKey"{ 
    if (isNaN(entry)) {
      document.getElementById("typeOfWork").value = entry;
      typeOfWork = entry;
    }
    else {
      curNumber = curNumber + entry;
      document.getElementById("memberInput").value = curNumber;
    }
  })
  function clearScreen() {
    entry='';
    curNumber="";
    document.getElementById("memberName").value = "";
    document.getElementById("typeOfWork").value = "General";
    document.getElementById("memberInput").value = "";
    document.getElementById("checkInTime").value = "";
    document.getElementById("checkOutTime").value = "";
  }

  function modalAlert(title,msg) {
    document.getElementById("modalTitle").innerHTML = title
    document.getElementById("modalBody").innerHTML= msg
    $('#myModalMsg').modal()
  }
  //function setPause(){
  //  delayInSeconds = document.getElementById("setPause").value
  //  delayInMilliseconds = delayInSeconds * 1000
  //  msg = "New delay of " + delayInSeconds + " seconds."
  //  alert(msg)
  //}
})
