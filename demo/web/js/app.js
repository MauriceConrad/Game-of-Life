
/*

  NOTE
  (Important)
  This a completly elf-driven JavaScript Vanilla solution that contains GUI handling for the interface itself but also a completly self-made rendering process with zoom and drag functionality for the canvas

  The reason why I just wrote a full self-made solution for controlling, zooming and interact with the rendering canvas is at first level speed.
  The framworks that exist are very modular which is nice but also costs performance
  The second reason is just that it is not a big deal to implement a high level canvas library
  The solution here is implemnted directly and hanldes click's direct without big background calculations. That speeds the application up because we just have to calculate a click area for an rect (Which is nor hard to calculate)




*/

var context;


var cycleLevel = 0;
var life = [
  []
];


var binaryLife = [];

var renderRatio = window.devicePixelRatio;

(function() {
  // Initialize HTML UI elements

  var randomBtn = document.querySelector(".btn-randomize");
  var loadBtn = document.querySelector(".btn-open-file");
  var btnCreate = document.querySelector(".btn-create-cycles");
  var btnExport = document.querySelector(".btn-export");
  var btnInfo = document.querySelector(".btn-info");

  var btnExportJSON = document.querySelector(".btn-export-default");
  var btnExportBinary = document.querySelector(".btn-export-binary");

  var inputWidth = document.querySelector(".input-bounding-width");
  var inputHeight = document.querySelector(".input-bounding-height");
  var inputCount = document.querySelector(".input-cycles-count");

  var inputCycleExport = document.querySelector(".input-export-cycle");

  var timeSlider = document.querySelector(".time-slider");
  var btnPlay = document.querySelector(".btn-play-pause");

  var stateText = document.querySelector(".state-text");

  var progressIndicator = document.querySelector(".progress-indicator");

  var appMain = document.querySelector(".main");

  var gameMain = document.querySelector(".game");
  var canvas = gameMain.getElementsByTagName("canvas")[0];
  context = canvas.getContext("2d");

  var mapBoundings;

  // Map rendering properties
  var render = {
    minScale: 1,
    maxScale: 5,
    scale: 1,
    translate: {
      x: 0,
      y: 0
    },
    translateTolerance: {
      x: 0,
      y: 0
    }
  };



  // Listen on inputs for field boundings
  inputWidth.addEventListener("change", changeBoundings);
  inputHeight.addEventListener("change", changeBoundings);
  // Handler for changed boundings
  function changeBoundings() {
    // Set map boundings
    mapBoundings = {
      width: parseInt(inputWidth.value),
      height: parseInt(inputHeight.value)
    }
    render.maxScale = mapBoundings.width * mapBoundings.height / 20;
    // Fill up first cycle (!) with empty cells if needed (First cycle is almost the start cycle)
    life[0] = fillMap(life[0], mapBoundings);
    // Render the new game
    renderSVG(life[cycleLevel], mapBoundings, canvas, render);
    // reset time sliders value because we changed the resolution and used the first cycle
    timeSlider.value = 0;
  }
  // Initialize it
  changeBoundings();

  // Listening for click on button "Random"
  randomBtn.addEventListener("click", function() {
    // Reset first cycle
    life = [
      []
    ];


    // Set cellCount
    var cellCount = mapBoundings.width * mapBoundings.height;
    // Loop trough all cells and set their state randomly
    for (var i = 0; i < cellCount; i++) {
      // Push a random true or false to first cycle (Others are just "spam" now)
      life[0].push(Math.round(Math.random()) ? true : false);
    };
    setLevel(0);
  });

  // Listen for calculate button
  btnCreate.addEventListener("click", function() {
    calculateLife();
  });

  timeSlider.addEventListener("input", function() {
    setLevel(this.value);
  });

  // Delay for every step in millisecons
  var playDelay = 75;
  var playInterval;

  btnPlay.addEventListener("click", function() {
    /*
      Wether the current state is "playing" or "paused" is stored in the class list instead
    */
    // If current state is "playing"
    if (this.classList.contains("play")) {
      stopPlaying();
    }
    // State seems to be "paused"
    else {
      startPlaying();
    }
  });
  function startPlaying() {
    // Set playing as property and change the appearance
    btnPlay.classList.remove("pause");
    btnPlay.classList.add("play");
    // Init playing interval
    // Start playing
    playInterval = playCycles(parseInt(timeSlider.value) - 1, parseInt(timeSlider.max) - 1, playDelay);
  }

  function stopPlaying() {
    // Set pause as property and change the appearance
    btnPlay.classList.remove("play");
    btnPlay.classList.add("pause");
    // Stop playing
    clearInterval(playInterval);
  }

  // Listener to handle keyboard arrow keys (next and previous cycle)
  window.addEventListener("keydown", function(event) {
    // Init new level variable as current level
    var newLevel = parseInt(timeSlider.value);
    // If the left arrwo key is pressed
    if (event.key === "ArrowLeft") {
      newLevel--;
    }
    // If the right arrwo key is pressed
    if (event.key === "ArrowRight") {
      newLevel++;
    }
    // Validate wether new level is out of allowed range (min -> max)
    if (newLevel >= 0 && newLevel <= parseInt(timeSlider.max)) {
      // New level is okay, set it
      setLevel(newLevel);
    }
  });

  // Concrete playing function that retuns the interval that is used for playing
  function playCycles(start, limit, delay) {
    var currLevel = start;
    var timer = setInterval(function() {
      // Go one step to next cycle level
      currLevel++;

      setLevel(currLevel);
      // Check wether the maximum cycle level is reached
      if (currLevel >= limit) {
        // Kill the interval because the last cycle was reached
        stopPlaying();
        // Reset current level to zero (Timeline should start at first level now)
        setLevel(0);
      }

    }, delay);
    // Return interval to handle it outside (E.g. Pressing pause button)
    return timer;
  }

  // General method to set the level and its graphical depencies (Like timeline, rendering etc.)
  function setLevel(level) {
    cycleLevel = parseInt(level);
    timeSlider.value = cycleLevel;
    timeSlider.max = life.length - 1;

    stateText.clearContents();
    stateText.appendChild(document.createTextNode("Level " + level));

    // Render new random cycle
    renderSVG(life[cycleLevel], mapBoundings, canvas, render);
  }

  var wheel = 0;

  canvas.addEventListener("wheel", function(event) {
    // Add wheel scroll to scale property
    render.scale += (event.deltaY / 100) * render.scale;
    zoomInCanvas();

  });

  // Prevent wheel event to be handled with default browsers handler
  canvas.addEventListener("wheel", function(event) {
    event.preventDefault();
  });

  /*

    Implementation of gesture events (Webkit only)
    On Safari >= 9.1 you can use your trackpad to scale the cycle

  */

  canvas.addEventListener("gesturestart", function(event) {
    // Set start scale
    this.scaleStart = render.scale + 0;
  });
  canvas.addEventListener("gesturechange", function(event) {
    // Set scale
    render.scale = this.scaleStart * event.scale;
    // Render cycle
    zoomInCanvas();
  });
  // Prevent gesture events from being handled by browser
  canvas.addEventListener("gesturestart", function(event) {
    event.preventDefault();
  });
  canvas.addEventListener("gesturechange", function(event) {
    event.preventDefault();
  });

  function zoomInCanvas() {
    // Check wether the scale is smaller than minimum scale
    if (render.scale < render.minScale) {
      render.scale = render.minScale;
    }
    // Check wether the scale is bigger than maximum scale
    if (render.scale > render.maxScale) {
      render.scale = render.maxScale;
    }

    var canvasBoundings = canvas.getBoundingClientRect();

    var zoomTranslateCenter = {
      x: event.clientX - canvasBoundings.left
    };
    //console.log(zoomTranslateCenter);
    render.target = zoomTranslateCenter;

    // Render current cycle
    var newRender = renderSVG(life[cycleLevel], mapBoundings, canvas, render);

    render.translate = newRender.translate;
  }
  // Set mousedown to true
  canvas.addEventListener("mousedown", function(event) {
    this.classList.add("dragging");
    this.dragStart = {
      x: event.clientX,
      y: event.clientY
    };
    this.translateStart = Object.assign({}, render.translate);

    this.dragged = false;
  });

  // Handle mosuemove for dragging current cycle
  window.addEventListener("mousemove", function() {
    // If mouse is pressed
    if (canvas.classList.contains("dragging")) {
      // set x translate
      render.translate.x = (canvas.translateStart.x + event.clientX - canvas.dragStart.x) * renderRatio;
      // Set y translate
      render.translate.y = (canvas.translateStart.y + event.clientY - canvas.dragStart.y) * renderRatio;

      // Render current cycle
      var newRender = renderSVG(life[cycleLevel], mapBoundings, canvas, render);

      render.translate = newRender.translate;

      canvas.dragged = true;
    }
  });
  // Reset mousedown property (Global window listening to cancle it also when mouse is out of screen or window)
  window.addEventListener("mouseup", function() {
    if (canvas.classList.contains("dragging")) {
      canvas.classList.remove("dragging");
    }
  });

  canvas.addEventListener("click", function(event) {
    if (!this.dragged) {
      /*

        This method get the clicked cell within the canvas by calculating the zoom factor, translate
        That is importnat because we're just drawing on a canvas (No <element>s used like in HTML or SVG). Therefore we're also not allowed to listen for events directly on the cells
        Therefore we have to calculate the target cell :)

      */
      // Get cavas boundings
      var canvasBounds = this.getBoundingClientRect();
      // Calculate relative mouse position (Mouse position within the canvas)
      var relPos = {
        x: event.clientX - canvasBounds.left,
        y: event.clientY - canvasBounds.top
      };
      // Calculate boundings of a cell
      var cellBoundings = {
        width: canvasBounds.width / mapBoundings.width * render.scale,
        height: canvasBounds.height / mapBoundings.height * render.scale,
      };
      // Add "users translate" to 'maxDiff' to get the real offset from left or top
      // The offset is the offset that appears because of the zoom (scale) factor and user's translate
      var offset = {
        x: (canvasBounds.width - canvasBounds.width * render.scale) / 2 + render.translate.x / renderRatio,
        y: (canvasBounds.height - canvasBounds.height * render.scale) / 2 + render.translate.y / renderRatio
      };

      // Calculate x & y coordinates of cell by using relative positon and the offset. trunc() uses just the natural part of the number
      var x = Math.trunc((relPos.x - offset.x) / cellBoundings.width);
      var y = Math.trunc((relPos.y - offset.y) / cellBoundings.height);

      // Calculate index with x and y coordinates
      var index = x + y * mapBoundings.width;

      // Reservse current cell's state in current life
      life[cycleLevel][index] = life[cycleLevel][index] ? false : true;

      // Render current cycle
      renderSVG(life[cycleLevel], mapBoundings, canvas, render);
    }

  });


  // Calculates an amount of cycles using the first cycle of 'life' as reference
  function calculateLife() {
    // Initialize web worker for calculate
    var worker = new Worker('js/calc-life.js');

    // Init data for web worker
    var workerInitData = {
      count: parseInt(inputCount.value),
      boundings: mapBoundings,
      map: life[cycleLevel]
    };


    // Reset life to an array just containing the init cycle (Mostly the first cycle of 'life' as defined above)
    life = [workerInitData.map];

    binaryLife = [ExportBinary.binary(workerInitData.map)];

    // Send init data to worker
    worker.postMessage(workerInitData);
    // Listen for messages (Fired when calculate of one cycle is finished)
    worker.addEventListener('message', function(e) {
      // Push 'map' (current cycle) to the 'life' array
      life.push(e.data.cycle.map);
      // Push binary map (current cycle) to the 'binaryLife' array
      binaryLife.push(e.data.cycle.mapBinary);
      // Set progress bar's value to current progess
      progressIndicator.value = e.data.progress;
      // Set also time slider's max property to current length of life
      timeSlider.max = life.length - 1;

      // If this is the last cycle (Calculation finished)
      if (e.data.progress === 1) {
        // Delete first item of life array because the first item is the remaining template and exist two times
        life = life.slice(1);
      }
    }, false);

    // Set time slider's value to 0 because we calculate from first cycle
    timeSlider.value = 0;



    // Render first cycle
    cycleLevel = parseInt(timeSlider.value);
    renderSVG(life[cycleLevel], mapBoundings, canvas, render);
  }


  var exportDialog = new Dialog(document.querySelector(".dialog-export"));

  btnExport.addEventListener("click", function() {
    //console.log("Export");
    //console.log(binaryLife);

    inputCycleExport.value = cycleLevel + 1;
    inputCycleExport.max = life.length;



    exportDialog.open();


  });

  btnExportJSON.addEventListener("click", function() {

    var exportType = document.querySelector(".select-export-type button.active").getAttribute("data-export-type");


    var exportResult = {
      width: parseInt(inputWidth.value),
      height: parseInt(inputHeight.value),
      cycles: exportType === "all" ? life : life[parseInt(inputCycleExport.value) - 1]
    };


    exportLife(exportResult);

  });
  btnExportBinary.addEventListener("click", function() {
    var exportType = document.querySelector(".select-export-type button.active").getAttribute("data-export-type");

    if (binaryLife.length == 0 && 0 in life) {
      binaryLife[0] = ExportBinary.binary(life[0]);
    }

    var exportResult = {
      width: parseInt(inputWidth.value),
      height: parseInt(inputHeight.value),
      cycles: binaryLife.map(binaryCycle => Unit8ToBase64(binaryCycle))
    };

    if (exportType === "all") {
      exportLife(exportResult);
    }
    else {
      var currCycleToExport = ExportBinary.binary(life[parseInt(inputCycleExport.value) - 1]);

      window.open('data:binary;base64,' + Unit8ToBase64(currCycleToExport));
    }


  });

  var fileInput = document.querySelector(".files-input");


  loadBtn.addEventListener("click", function() {
    // Using html5 file reading api
    fileInput.click();
  });

  fileInput.addEventListener("change", function(event) {
    // Get first item of file list (You're always allowed to select one single file) and use it as file to load
    loadFile(event.target.files[0]);
  });

  appMain.addEventListener("drag", function(event) {
    event.stopPropagation();
    event.preventDefault();
  });
  appMain.addEventListener("drag", function(event) {
    //console.log(event);
  });


  function loadFile(file) {
    var reader = new FileReader();

    reader.addEventListener("load", function(event) {
      var templateMap;

      if (typeof this.result === "string") {
        // Just parse it as JSON
        var fileData = JSON.parse(this.result);
        if (fileData instanceof Array) {

          templateMap = fileData;
        }
        else {
          templateMap = fileData.cycles[0] instanceof Array ? fileData.cycles[0] : fileData.cycles;
        }

      }
      else {
        var data = new Uint8Array(this.result);

        const byteLength = 8;

        // Very simple algorithm to seperate bits of the bytes (Containes in the Unit8Array)

        // Array that will be filled with boolean values to be used as template
        // Every bit represent a boolean value (cell on map)
        var templateMap = [];
        // Define byte variable for loop
        var byte;
        // Loop trough all bytes
        for (byte of data) {
          // Loop back from byte highest bit (Reversed because arabic number system is right-to-left and we think left-to-right (latin))
          // - 1 because indexing starts at 0 but constant 'byteLength' has the value 8 but because indexing starts at 0, 7 is the max index
          for (var i = byteLength - 1; i >= 0; i--) {
            // 'i' is the current index of the bit within the byte
            // Wether the result of shifting bits with a bitwise ABD returns an "true" or "false" (1 || 0)
            templateMap.push(byte >> i & 1 ? true : false);
          }
        }

      }

      cycleLevel = 0;
      timeSlider.value = cycleLevel;
      timeSlider.max = 0;
      life[cycleLevel] = templateMap;

      renderSVG(life[cycleLevel], mapBoundings, canvas, render);
    });

    if (file.type === "application/json") {
      // Target file is of type JSON
      // That means that our cycles are stored as JSON arrays with boolean values
      reader.readAsText(file);
    }
    else {
      // File is a binary one
      // That means that our cells are stored as bits within the cycle
      reader.readAsArrayBuffer(file);
    }
  }

  window.addEventListener("resize", function() {
    renderSVG(life[cycleLevel], mapBoundings, canvas, render);
  });


  var infoDialog = new Dialog(document.querySelector(".dialog-info"));

  btnInfo.addEventListener("click", function() {
    infoDialog.open();
  });


})();





function exportLife(data) {
  window.open('data:text/json;utf8,' + JSON.stringify(data));
}





function fillMap(map, boundings) {
  // Loop trough map starting by it's length to start at the end of array
  // Fills up the map with empty cells if they don't exist
  for (var i = map.length; i < boundings.width * boundings.height; i++) {
    map.push(false);
  }
  return map;
}

function renderSVG(map, boundings, canvas, render) {

  // Please keep in mind that scaling, rendering and everything else is completly self-made in this case and works without frameworks ;-)

  // Sclae canvas to it's parent
  scaleCanvas(canvas, boundings);

  // Boundings of cell
  var cellBoundings = {
    width: canvas.width / boundings.width * render.scale,
    height: canvas.height / boundings.height * render.scale,
  };

  // Translate to fit zoom to center
  var zoomTranslate = {
    x: (boundings.width - boundings.width / render.scale) / 2,
    y: (boundings.height - boundings.height / render.scale) / 2
  };
  // Differnet translate that depents to user's drag
  var dragTranslate = {
    x: render.translate.x / cellBoundings.width,
    y: render.translate.y / cellBoundings.height
  };

  /*

    This snippet is used to prevent the user from dragging the cycle out of view

  */

  // If translate x is more than the allowed value (left or right offset + tolerance)
  if (Math.abs(dragTranslate.x) > zoomTranslate.x + render.translateTolerance.x) {
    dragTranslate.x = dragTranslate.x > 0 ? (zoomTranslate.x + render.translateTolerance.x) : -(zoomTranslate.x + render.translateTolerance.x);
  }
  // If translate y is more than the allowed value (top or right offset + tolerance)
  if (Math.abs(dragTranslate.y) > zoomTranslate.y + render.translateTolerance.y) {
    dragTranslate.y = dragTranslate.y > 0 ? (zoomTranslate.y + render.translateTolerance.y) : -(zoomTranslate.y + render.translateTolerance.y);
  }

  // Loop trough all cells
  map.forEach(function(cell, i) {
    // Calculate cell position
    var pos = {
      x: (i % boundings.width),
      y: Math.trunc(i / boundings.width)
    };
    // Get real position within rendering canvas

    var relPos = {
      x: (pos.x - zoomTranslate.x + dragTranslate.x) * cellBoundings.width,// - canvas.width / render.scale / 2,
      y: (pos.y - zoomTranslate.y + dragTranslate.y) * cellBoundings.height// - canvas.height / render.scale / 2
    };

    // fillStyle default = white
    // If cell's satate is true (alive), set fillStyle to a orange with some alpha
    // If cell's width and height are bigger than 10, use borders
    // Draw cell

    var borderTolerance = 20;
    drawCell(relPos.x, relPos.y, cell ? "rgba(255, 180, 80, 0.78)" : "#ffffff", (cellBoundings.width > borderTolerance && cellBoundings.height > borderTolerance) ? true : false);


  });

  function drawCell(x, y, style, border) {
    // Set fillStyle
    context.fillStyle = style;

    // Draw a rect at current position
    context.fillRect(x, y, cellBoundings.width, cellBoundings.height);

    context.strokeStyle = "#000000";
    context.lineWidth = 1;
    if (border) {
      context.strokeRect(x, y, cellBoundings.width, cellBoundings.height);
    }

  }


  return {
    translate: {
      x: dragTranslate.x * cellBoundings.width,
      y: dragTranslate.y * cellBoundings.height
    }
  }



}
function scaleCanvas(canvas, boundings) {
  // Set refernece to .game main div
  var main = canvas.parentNode;

  // Get boundings of main game div
  var mainBounds = main.getBoundingClientRect();
  // Format that should be used to render
  var renderFormat = boundings.height / boundings.width;
  // Format of the viewport
  var viewportFormat = mainBounds.height / mainBounds.width;

  var canvasRenderSize;

  if (viewportFormat > renderFormat) {
    canvasRenderSize = {
      width: mainBounds.width,
      height: mainBounds.width * renderFormat
    }
  }
  else {
    canvasRenderSize = {
      width: mainBounds.height / renderFormat,
      height: mainBounds.height
    }
  }

  canvas.width = canvasRenderSize.width * renderRatio;
  canvas.height = canvasRenderSize.height * renderRatio;

  canvas.style.width = canvasRenderSize.width + "px";
  canvas.style.height = canvasRenderSize.height + "px";

}



// General global event ahndling for button groups
// "Drive-by Events"

window.addEventListener("click", function(event) {
  if (event.target.parentNode.classList.contains("btn-group")) {
    var activeBtn = event.target.parentNode.getElementsByClassName("active")[0];
    activeBtn.classList.remove("active");

    event.target.classList.add("active");


    document.querySelector(activeBtn.getAttribute("data-view")).classList.remove("show");

    document.querySelector(event.target.getAttribute("data-view")).classList.add("show");
  }
});




Element.prototype.clearContents = function() {
  clearContents(this);
}
function clearContents(e) {
  while (0 in e.childNodes) {
    e.removeChild(e.childNodes[0]);
  }
}


function Unit8ToBase64(u8Arr){
  var CHUNK_SIZE = 0x8000;
  var index = 0;
  var length = u8Arr.length;
  var result = '';
  var slice;
  while (index < length) {
    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
    result += String.fromCharCode.apply(null, slice);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}






Math.logBase = function(n, base) {
    return Math.log(n) / Math.log(base);
};
Math.logBase = (n, base) => Math.log(n) / Math.log(base);
