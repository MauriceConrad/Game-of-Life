#! /usr/bin/env node

const GameOfLife = require('../../');
const render = require('./render-text');

const fs = require('fs-extra');

const commandLineArgs = require('command-line-args');




// Set command line arguments logic for module "command-line-args"
const options = commandLineArgs([
  {
    name: 'template',
    alias: 't',
    type: String,
    multiple: false,
    defaultOption: true
  },
  {
    name: 'boundings',
    alias: 'b',
    type: String,
    multiple: false
  },
  {
    name: 'count',
    alias: 'c',
    type: Number,
    multiple: false
  },
  {
    name: 'output',
    alias: 'o',
    type: String,
    multiple: false
  },
  {
    name: 'format',
    alias: 'f',
    type: String,
    multiple: false
  }
]);


// Default properties for GameOfLife
var initCycle = null;
var width;
var height;
var count = "count" in options ? options.count : 10;
var output = options.output;

// If template argument is given, use it to define a initCycle
if (options.template) {
  try {
    // Try to read template argument as file
    var contents = fs.readFileSync(options.template);
    try {
      // Try to parse read file as JSON
      initCycle = JSON.parse(contents);
    } catch (e) {
      // File seems to exist but parsing as JSON is obviously not possible
      // Using the binary buffer of the file instead as template (Will be interpreted as binary template)
      initCycle = contents;
      console.log(initCycle);
    } finally {}
  } catch (e) {
    // Reading as file throws an error
    // Use template argument as direct string template with a syntax like 01010101111001110
    initCycle = options.template.split("").map(character => parseInt(character) ? true : false);
  } finally {}
}



// If boundings argument is given, use it to define boundings
if (options.boundings) {
  var boundingParts = options.boundings.split("x");
  width = parseInt(boundingParts[0]);
  height = parseInt(boundingParts[1] || boundingParts[0]);
}

var exportType;


// Get exportType by the existing of a file name extension like "json"
if (output) {
  // A small minimalistic anonymous function that parses the output file path to gte info about it's file extension
  // That's because the used file extension is important for output process
  var extension = (function(path) {
    // Just splitting the string into an array with all parts of file path
    var pathParts = path.split("/");
    // File is normally represented with the last part of a file path
    var filename = pathParts[pathParts.length - 1];
    // All file extensions the file have
    var fileExtParts = filename.split(".");
    // Wether there exist at least one file extension, return the last or, if there exist no file file extension, return null
    return fileExtParts.length > 1 ? fileExtParts[fileExtParts.length - 1] : null;
  })(output);
  // Set export type as string to use later
  if (extension) {
    // The extension is not null but more less 'json'
    // That means that we want a file to be exported
    exportType = "file";
  }
  else {
    // If the extension is null, the export type is obviously a package folder
    exportType = "package";
  }
}




// Intialize cli game instance
var game = new GameOfLife(width, height, initCycle);

// If the export type is "package", prepare the package folder
if (exportType === "package") {
  // Clear output package directory
  fs.emptyDirSync(options.output);
  // Create "cycles" directory
  fs.ensureDirSync(options.output + "/cycles");
  // Initialize life meta data
  var lifeMeta = {
    width: width,
    height: height,
    cycles: []
  };
}

// Just a start time to measure the time, the calculation needs
var startTime = new Date().getTime();

// Progress handler because sometimes the calcukation can take a lot of time
var myLife = game.live(count, function(cycle, progress) {
  // Handler for 'live()' method of game of life module (More about this in README.md)

  // If an export is required
  if (exportType) {
    // If the type of export is a package
    if (exportType == "package") {
      // Handler for package output/export

      // Every single cycle file's name is based on the syntax 'cycle-n'
      // If the format type itself is declared as "binary", don't use any fiel extension
      var cycleFile = "cycle-" + Math.round(progress * count) + (options.format === "binary" ? "" : ".json");
      // Relative path to the file within the package
      var cycleFileName = options.output + "/cycles/" + cycleFile;
      // Define the data to be written into the file
      // If format type is "binary", use the buffer of the 'cycle' object coming from the callback heandler instead
      // If not, stringifiy the 'map' of the 'cycle' object coming from the callback handler instead
      var cycleData = options.format === "binary" ? cycle.mapBinary : JSON.stringify(cycle.map);
      fs.writeFile(cycleFileName, cycleData, function(err) {
        if (err) {
          throw err;
        }
      });

      lifeMeta.cycles.push(cycleFile);
    }
    // If the type of export is a single file
    else {
      // Nothing happens. Whole file as output is handled not in the progress handler ;-)
    }
  }
  // Or just no one defined and the console pretty print output will be used
  else {
    var renderStr = render(cycle.map, game.width, game.height);
    console.log("Cycle " + Math.round(progress * count));
    console.log(cycle.mapBinary);
    console.log(renderStr);


  }
});

// Just a timestamp to get the time needed for calculation in ms
var endTime = new Date().getTime();

// If the export type is "package", write a "life.json" file to the package
if (exportType === "package") {
  fs.writeFile(options.output + "/life.json", JSON.stringify(lifeMeta, null, 2), function(err) {
    if (err) {
      throw err;
    }
  });
}


if (exportType === "file") {
  if (options.format === "binary") {
    myLife.cycles = myLife.cycles.map(cycle => GameOfLife.binaryLife(cycle).toString("base64"));
  }


  fs.writeFile(options.output, JSON.stringify(myLife), function(err) {
    if (err) {
      throw err;
    }
  });
}


console.log(endTime - startTime + " ms");
