
// --------------------------- CORS begin
// Create the XHR object.
function createCORSRequest(method, url) {
 var xhr = new XMLHttpRequest();
 if ("withCredentials" in xhr) {
// XHR for Chrome/Firefox/Opera/Safari.
 xhr.open(method, url, true);
 console.log('withCredentials');
 } else if (typeof XDomainRequest != "undefined") {
// XDomainRequest for IE.
 xhr = new XDomainRequest();
 xhr.open(method, url);
 } else {
// CORS not supported.
 xhr = null;
 }
 return xhr;
}
function makeCorsRequest() {
 var xhr = createCORSRequest('GET', url);
 if (!xhr) {
 alert('CORS not supported');
 return;
 }
 xhr.onload = function() {
 console.log("onload begin");
 }
xhr.onerror = function() {
 alert('Error accessing database.');
 };
 xhr.send();
}
// --------------------------- CORS end

function showUser(str) {
 if (str=="") {
 document.getElementById("txtHint").innerHTML = "Please make a selection.";
 return;
 } 
 document.getElementById("txtHint").innerHTML = "Getting data ...";
 
 xmlhttp.onreadystatechange=function() {
 if (xmlhttp.readyState==4 && xmlhttp.status==200) {
 var txt = xmlhttp.responseText;
 document.getElementById("txtHint").innerHTML = xmlhttp.responseText;
 }
 }
// Need full URL to page, since this HTML page is not on a server
 xmlhttp.open("GET","http://192.168.0.100/app/getdetails.php?q="+str,true);
 xmlhttp.send();
 }
// Start the CORS on startup
var url = "http://192.168.0.100/app/";
var method = "GET";
createCORSRequest(method, url);