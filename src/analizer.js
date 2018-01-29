//
// pdf.js example
// Gets a pdf file and extracts color data from first page
//
const COLORSCAP = 25;

var analizer = {
  start: function() {
    if (file = document.getElementById('pdf').files[0]) {
      fileReader = new FileReader();
      fileReader.onload = function() {
        PDFJS.getDocument(fileReader.result).then(function getPdfHelloWorld(pdf) {
          // Fetch the first page, and process
          pdf.getPage(1).then(function getPageHelloWorld(page) {
            analizer.processPage(page);
          });
        }, function(error){
          console.log(error);
        });
      };
      fileReader.readAsArrayBuffer(file);
    }
  },
  
  processPage: function (page) {
    var viewport = page.getViewport(1); // takes desired scale
    
    // Prepare canvas using PDF page dimensions
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Renders PDF page into canvas context
    var render = page.render({canvasContext: context, viewport: viewport})
    render.promise.then(function() {
      var data = context.getImageData(0, 0, viewport.width, viewport.height).data;
      var results = {
        pixels: data.length / 4,
        colours: {},
        sortedcolours: [],
        alpha: 0,
        white: 0,
        grays: 0,
        colored: 0
      };
      
      // iterate over data in steps of 4
      // each 4-tuple is meant to abtract a pixel on the format (Red, Green, Blue, Alpha)
      for (var i = 0; i < data.length; i += 4) {
        // first lets save this particular color combination
        var key = data[i] + '-' + data[i+1] + '-' + data[i+2] + '-' + data[i+3];
        results.colours[key] = results.colours[key] ? results.colours[key] + 1 : 1;
        
        // now lets make some counting
        if (data[i+3] == '0') {
          // if Alpha is 0, then this is a transparent pixel
          results.alpha++;
        } else if (data[i] == '255' && data[i+1] == '255' && data[i+2] == '255') {
          // white pixel
          results.white++;
        } else if (data[i] == data[i+1] && data[i+1] == data[i+2]) {
          // grayscale pixel (same values for R, G, and B)
          results.grays++;
        } else {
          results.colored++;
        }
      }
      // sort by most occurences
      results.sortedcolours = Object.keys(results.colours).sort(
        function(a, b) {
          return -(results.colours[a] - results.colours[b]);
        }
      );
      analizer.renderResults(results);
    });
  },
  
  renderResults: function(res) {
    var title = document.querySelector('#text');
    var colourlist = document.querySelector('#colours');
    var resultslist = document.querySelector('#results');
    var liElements = '';
    
    res.sortedcolours.forEach(function(key, index) {
      if (index < COLORSCAP) {
        var rgba = key.split('-');
        var label = rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3];
        liElements += '<li><span style="background: rgba(' + label +');">&nbsp;&nbsp;&nbsp;&nbsp;</span> ' + res.colours[key] + '</li>';
      }
    });
    colourlist.innerHTML = liElements;
    liElements = '';
    
    liElements = '<li> Number of pixels: ' + res.pixels + '</li>';
    liElements += '<li> Alpha channel pixels: ' + res.alpha * 100 / res.pixels + '%</li>';
    liElements += '<li> White pixels: ' + (res.white * 100 / res.pixels).toFixed(2) + '%</li>';
    liElements += '<li> Grayscale pixels: ' + (res.grays * 100 / res.pixels).toFixed(2) + '%</li>';
    liElements += '<li> Color pixels: ' + (res.colored * 100 / res.pixels).toFixed(2) + '%</li>';
    resultslist.innerHTML = liElements;
    title.innerHTML = COLORSCAP + " Most used colours:";
  }
};

// set things up for when a file is loaded
PDFJS.disableWorker = true;
document.getElementById('pdf').onchange = analizer.start;

