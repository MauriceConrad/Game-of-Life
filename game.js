const binaryLife = require("./binary-life");

class GameOfLife {
  constructor(width = 8, height = 8, initialMap = null) {
    var self = this;



    // Initialize width and height of game
    this.width = width;
    this.height = height;

    /*

      Any cell is just an object that contains the properties 'state' and some other functionalities like 'position' etc.
      A cell that is "alive" has the state 'true'
      Therefore a cell that's state is "not alive / dead" has the state 'false'

    */

    // Create initial map
    this.map = this.initMap();

    /*

      The initial map ('initialMap') is NOT a valid map object per se. It's just an array that contains states like false ("not alive / dead") or true ("alive")
      These 'initialMap' is just used to fill the real valid map of your instance as a prototype.

    */

    // If initialMap is invalid, randomize it
    // 1st argument is the total amount of cell's that should be generated
    if (!initialMap) {
      initialMap = this.getRandomInitialMap(this.width * this.height);
    }

    // Wether the given argument 'initialMap' (3rd one) is of type buffer, parse it to a boolean array map
    if (initialMap instanceof Buffer) {
      // `binaryLife` is a method that converts buffers to boolean array and boolean arrays to buffers
      initialMap = GameOfLife.binaryLife(initialMap);
    }

    // Fill map with initial map (used from arguments or generated randomly before)
    this.setMap(initialMap);

    // Load rules from file
    this.rules = require("./Rules");


  }
  setMap(initialMap) {
    // Loop trough initial map
    initialMap.map((cell, i) => {
      // If the current map contains this cell, use it as reference
      if (i in this.map) {
        this.map[i].state = cell;
      }
    });
  }
  initMap() {
    var self = this;

    // Create map filling array
    var map = [];

    // Loop trough width & height (rows & lines)
    var totalCells = this.width * this.height;

    for (var index = 0; index < totalCells; index++) {
      // Define new cell

      // Default state is 'false' which stands for "not alive / dead"
      var cell = {
        // Default state is always 'false'
        state: false,
        // [Getter] for returning position of cell
        get position() {
          return self.getPosition(this);
        },
        // [Getter] for returning surroundings cells
        get surroundings() {
          return self.getSurroundings(this);
        },
        get surroundingsAlive() {
          return self.getSurroundingsAlive(this);
        },
        index: index
      };
      // Add cell to whole map
      map.push(cell);
    }

    return map;
  }
  // Calculate position of a cell by its index and instance's width & height
  getPosition(cell) {
    return {
      // Rest of division of current cell's index by the total amount of cells in width (x direction)
      x: cell.index % this.width,
      // Natural result of division of current cell's index by the total amount of cells in width (x direction)
      y: Math.trunc(cell.index / this.width)
    }
  }
  // Get all surrounding fields of a cell
  getSurroundings(cell) {
    return [
      {
        direction: "top",
        cell: this.getCellByPos(cell.position.x, cell.position.y - 1)
      },
      {
        direction: "top-right",
        cell: this.getCellByPos(cell.position.x + 1, cell.position.y - 1)
      },
      {
        direction: "right",
        cell: this.getCellByPos(cell.position.x + 1, cell.position.y)
      },
      {
        direction: "bottom-right",
        cell: this.getCellByPos(cell.position.x + 1, cell.position.y + 1)
      },
      {
        direction: "bottom",
        cell: this.getCellByPos(cell.position.x, cell.position.y + 1)
      },
      {
        direction: "bottom-left",
        cell: this.getCellByPos(cell.position.x - 1, cell.position.y + 1)
      },
      {
        direction: "left",
        cell: this.getCellByPos(cell.position.x - 1, cell.position.y)
      },
      {
        direction: "top-left",
        cell: this.getCellByPos(cell.position.x - 1, cell.position.y - 1)
      }
    ]
  }
  // Method to return all surroundings of a cell that are still alive
  getSurroundingsAlive(cell) {
    // Get surroundings that are alive at the moment
    return cell.surroundings.filter(function(surrounding) {
      return (surrounding.cell && surrounding.cell.state);
    });
  }
  getCellByPos(x, y) {
    // If position is invalid because its outer the bounding
    if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) {
      // Return 'null' as a non existing cell
      return null;
    }
    // Otherwise calculate the searched cell's index
    var index = Math.trunc(x + y * this.width);
    // Check wether the index exists in 'map'
    if (index in this.map) {
      // Return this cell
      return this.map[index];
    }
    // Otherwise return null because the cell seems so be non existing
    return null;
  }
  getRandomInitialMap(count) {
    // 'initalMap' array
    var initalMap = [];
    // Repeat the count
    for (var i = 0; i < count; i++) {
      // Push a value that is booliefied by a random number (0 or 1) to the 'initalMap' array
      // 'Math.random()' returns a random number between 0 and 1. Rounding is used to have a euqal chance that the returned number is 0 or 1. Because 0 is a 'falsified' value and 1 is 'truely', the chance that the result is 'false' or 'true' is exactly 50%
      initalMap.push(Math.round(Math.random()) ? true : false);
    }
    // Return the 'initalMap' as prototype map
    return initalMap;
  }

  cycle() {
    // Method that returns the next cycle from of current map

    var rule;

    /*

      The changes of the state of a cell are made firstly within a prototype array to avoid that changes manipulate the rules
      This prototype is used to fill the map when everything is finished

    */

    var changeset = [];

    var newPrototypeMap = [];

    // Loop trough map
    this.map.forEach((cell, i) => {
      // Fill prototype with cell's default state
      newPrototypeMap[i] = cell.state;
      // Now, loop trough all rules
      for (rule of this.rules) {
        // Check wether the rule is used for this kind of cell ('requiredState' euqals to 'state')
        if (rule.requiredState === cell.state) {

          // Validate rule for the cell
          var ruleValidation = rule.validate(cell);
          // If the rule fits
          if (ruleValidation) {
            // Set a changeset object at cell's index within the changest array
            changeset.push({
              oldState: cell.state,
              newState: rule.newState,
              rule: rule.name,
              index: i
            });
            // Set new state of cell to rule's 'newState'
            newPrototypeMap[i] = rule.newState;
            // Return map loop function to avoid a following rule to fit in with the new cell
            return;
          }
        }
      }
    });

    return {
      width: this.width,
      height: this.height,
      map: newPrototypeMap,
      mapBinary: GameOfLife.binaryLife(newPrototypeMap),
      // Complete changeset which describes all rules that have been applied
      changeset: changeset,
      // "Real changeset" that excludes all applied rules who didn't changed the states (E.g. "Rule2")
      realChanges: changeset.filter(change => (!change || change.oldState != change.newState))
    };
  }
  live(count, progressHandler, type = "json") {
    // Method that automatically creates a life with multiple cycles
    // Please note that this method also changes your instances 'map' while 'cycle' isn't doing this

    // Also returns a nice, ready-to-save output in JSON

    /*

      Binary:
        As you may already saw in the return of 'cycle()' (which is also used wehen listening for progress handler in this 'live()' method), there exist a binary version of a cycle
        I added this possibility because every cell can have the state 0 or 1 which is exactly represented by a bit. This output is an alternative to a classical array which saves a lot of space ;-)
        And maybe it can be useful if you want to render a cycle directly on something without using much resources
        Otherwise if you don't need it as binary, just use the "normal" export ;-)

    */

    var life = {
      // Just width of instance
      width: this.width,
      // Just height of instance
      height: this.height,
      // Array containing all cycles of life
      cycles: []
    };

    var startMap = this.map.map(cell => cell.state);

    // Define start cycle for handling progress
    var startCycle = {
      width: this.width,
      height: this.height,
      map: startMap,
      mapBinary: GameOfLife.binaryLife(startMap),
      changeset: [],
      realChanges: []
    };
    // Initialize first cycle for progress handler
    progressHandler(startCycle, 0);

    // Initial cycle is the init map (Normally array but can also be a buffer)
    life.cycles[0] = type === "binary" ? startCycle.mapBinary : startCycle.map;

    for (var i = 0; i < count; i++) {
      // 'cycle()' the current map
      var currCycle = this.cycle();
      // Push new map to life
      if (type === "binary") {
        // Type is binary which means that we use buffer to represent the binary data in the object. To get the binary data directly use it from the 'cycle' object you get from a progress in 'live()' or directly from 'cycle()'
        life.cycles.push(currCycle.mapBinary);
      }
      else {
        // Type is not "binary", therefore just use a normal json array
        life.cycles.push(currCycle.map);
      }
      // Set 'map' of instance to new map
      this.setMap(currCycle.map);
      // Handle progress with index and total count of cycles
      progressHandler(currCycle, (i + 1) / count);
    }
    return life;

  }
  static binaryLife(map) {

    if (map instanceof Buffer) {
      return binaryLife.boolean(map);
    }
    else {
      return binaryLife.binary(map);
    }
  }
}

// Export class as module
module.exports = GameOfLife;
