// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'


angular.module('starter', [])
angular.module('starter', ['ionic', 'starter.controllers', 'ngCordova'])

  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })


IonicQR.controller("ScanController", function ($scope, $cordovaBarcodeScanner) {

  $scope.scanBarcode = function () {
    $cordovaBarcodeScanner.scan().then(function (imageData) {
      alert(imageData.text);
      console.log("Barcode Format -> " + imageData.format);
      console.log("Cancelled -> " + imageData.cancelled);
    }, function (error) {
      console.log("An error happened -> " + error);
    });
  };

});


function scan() {
  document.getElementById("txtHint").value = "";
  cordova.plugins.barcodeScanner.scan(
    function (result) {
      if (!result.cancelled) {
        if (result.format == "QR_CODE") {
          var name = "TX-test";
          var value = result.text;
          document.getElementById('txidin').value = result.text;
          check();
        }
      }
    },
    function (error) {
      alert("Scanning failed: " + error);
    });
  document.getElementById("txidin").disabled = true;
  document.getElementById("checker").disabled = false;

}



function check() {

  var stringy = "Events: \n";
  var stry;
  var tags = [];

  $ = document.getElementById;
  input = document.getElementById("txidin").value;
  document.getElementById("txtHint").disabled = true;

  var querw = "https://devnoob9.000webhostapp.com/json.php?id=" + input;

  jQuery.getJSON(querw, function (result) {
    console.log(result);
    lenobj = Object.keys(result).length;
    if (lenobj != 0) {
      for (i = 0; i < lenobj; i++) {
        if (result[i] != '"status"') {
          tags.push(result[i]);
        } else {}

      }
    } else {}
    console.log(tags);
    lentag = tags.length;

    if (lentag != 0) {
      for (i = 0; i < lentag; i++) {
        var ins = tags[i];
        stringy += ins + "\n";
        stry = stringy.replace(/_/g, ' ');
      }
    } else {
      stry = "NONE."
    }

    console.log(tags);
  });


  var quer = "https://devnoob9.000webhostapp.com/json2.php?id=" + input;

  jQuery.getJSON(quer, function (result) {
    console.log(result);

    //alert(JSON.stringify(result));
    var res = (JSON.stringify(result));

    //showAlert(result);
    //alert(res);
    //$("txtHint").value = res;
    console.log(result["status"]);
    var ch = (result["status"]);
    var eno = (result["eno"]);
    var fn = (result["first_name"]);
    var ln = (result["last_name"]);
    var col = (result["college"]);


    //var showup =  fn+" "+ln+"\n"+col+"\n"+eno+"\n"+stat;
    if (ch == 1) {
      document.getElementById("txtHint2").value = "Participant already entered!";
      document.getElementById("confirmer").disabled = true;
      document.getElementById("txtHint").disabled = true;
      var stat = "Confirmed";
      var showup = fn + " " + ln + "\n" + eno + "\n" + col + "\n" + stry;

    } else {
      document.getElementById("confirmer").disabled = false;
      //alert("OK");
      var stat = "Pending";
      document.getElementById("txtHint2").value = stat;
      var showup = fn + " " + ln + "\n" + eno + "\n" + col + "\n" + stry;

    }

    document.getElementById("txtHint").value = showup.toLowerCase();
    document.getElementById("txtHint").disabled = true;


    //$("txtHint2").value = res2;
    document.getElementById("txidin").disabled = true;
    return ("Values:" + result);
  });

}



function confirm() {

  var stringy = "Events: \n";
  var stry;
  var tags = [];

  $ = document.getElementById;
  document.getElementById("txtHint").disabled = true;

  input = document.getElementById("txidin").value;
  if (input == "" || input == undefined || input == null || input > 2969) {
    alert("Please enter a proper TXID");
  } else {
    var querw = "https://devnoob9.000webhostapp.com/json.php?id=" + input;

    jQuery.getJSON(querw, function (result) {
      console.log(result);
      lenobj = Object.keys(result).length;
      if (lenobj != 0) {
        for (i = 0; i < lenobj; i++) {
          if (result[i] != '"status"') {
            tags.push(result[i]);
          } else {}

        }
      } else {}
      console.log(tags);
      lentag = tags.length;

      if (lentag != 0) {
        for (i = 0; i < lentag; i++) {
          var ins = tags[i];
          stringy += ins + "\n";
          stry = stringy.replace(/_/g, ' ');
        }
      } else {
        stry = "NONE."
      }
      console.log(tags);
    });


    var quer = "https://devnoob9.000webhostapp.com/json3.php?id=" + input;
    jQuery.getJSON(quer, function (result) {
      console.log(result);
    });
    var quer2 = "https://devnoob9.000webhostapp.com/json2.php?id=" + input;
    jQuery.getJSON(quer2, function (result) {
      console.log(result);
      var res = (JSON.stringify(result));
      document.getElementById("txtHint").value = res;
      console.log(res);
      if ((result["status"]) == 1) {
        var stat = "Confirmed";
        var eno = (result["eno"]);
        var fn = (result["first_name"]);
        var ln = (result["last_name"]);
        var col = (result["college"]);
        var showup = fn + " " + ln + "\n" + eno + "\n" + col + "\n" + stry;
        document.getElementById("txtHint").value = showup.toLowerCase();

      } else {
        var stat = "Pending";
        var eno = (result["eno"]);
        var fn = (result["first_name"]);
        var ln = (result["last_name"]);
        var col = (result["college"]);
        var showup = fn + " " + ln + "\n" + eno + "\n" + col + "\n" + stry;
        document.getElementById("txtHint").value = showup.toLowerCase();
        document.getElementById("confirmer").disabled = true;
      }

      //alert(res);
    });
    document.getElementById("confirmer").disabled = true;
    document.getElementById("txtHint2").value = "Confirmed";
    document.getElementById("txtHint").disabled = true;
    alert("Confirmed");
  }
}