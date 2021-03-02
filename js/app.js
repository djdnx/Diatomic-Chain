document.addEventListener("DOMContentLoaded", function () {
  var divs = {
    opticalTwoContainer: document.getElementById('opticalTwoContainer'),
    acousticTwoContainer: document.getElementById('acousticTwoContainer'),
    dispersionPlot: document.getElementById('dispersionPlot')
  }
  lib.runApp(divs);
})
