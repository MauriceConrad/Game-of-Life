# Game of Life

A Node.js implementation of Conway's Game of Life. It's a part of a code competition ;-)
This algorithm does not focus on **performance only**.
That means that the module is more less designed to be a modular and clean solution.
Nevertheless that means not that this solution is not *performant*. It's much performant as possible.

But of course, if you want to calculate a **2048x2048** map with 1000 cycles (generations), you may should use a more native solution of *GameOfLife*.
For example, have a look at the `Rules.js` file which contains every rule as an object. You'll see that the concept behind this is not only speed but cleanliness and extensibility.

## Web

A online web application to use this framework graphically: [Game-of-Life.org](https://game-of-life.org).

## Install

### As Module

```bash
npm install life-game
```

### As CLI

```bash
npm install life-game -g
```

## Usage

### Initialization

```javascript
const GameOfLife = require('life-game');

// Map boundings
var width = 5;
var height = 5;

// Template is an array containing just boolean values
var template = [
  false, false, false, false, false,
  false, true, true, false, false,
  false, false, true, false, false,
  false, false, true, false, false
];

// Template is an array that contains the initial map
// E.g. [true, false, true, true, false, true, ...]
var myGame = new GameOfLife(width, height, template);

// Print current map (Same as template because no calculations be done)
console.log(myGame.map);
```

As you saw you are allowed to give three arguments. All three are optional, if `width` and `height` are not given, the default value is `8` for both of them.

If no initial map (template) is given, a random one will be generated.
Please note that the map template doesn't have to contain all cells. The missing cells will be filled with `false` (dead cells).

The 3rd argument when creating the instance is used for the template. You can use a array with boolean values here (As sou see in the example) or a **Buffer** that contains binary data for cells. (More about exporting into binary format you will find below).

#### Map

Now you're instance is ready. Maybe now you'll have a look at it.
As you already saw, a map on "client side" is just an array containing boolean values. E.g.
```javascript
[true, false, true, true, false, ...]
```

But intern a map is much more complex. A cell is not just a boolean value but an object containing `index`, `position`, `surroundings` and `state`.

The `map` property of your instance contains the actual map. It is an array containing each cell as an object literal.

That is how a cell within the intern `map` property looks like:
```javascript
{
  index: Number,
  state: Boolean,
  position: [Getter],
  surroundings: [Getter]
}
```


### setMap()

The method `setMap()` of your instance is very important.
As you already saw, a map on "client side" is just an array containing boolean values. E.g.
```javascript
[true, false, true, true, false, ...]
```
This method "converts" a map from "client side" (like you see above) to the intern `map` of your instance and makes it work.

If you want to set your instance's map, you just have to call:
```javascript
// Overwrites current map with a "template"
myGame.setMap([true, false, false, true, true, false, ...]);
```

### cycle()

The `cycle()` method of your instance is used to get the next *cycle* of the current `map`.

The method returns a result object that contains a lot of information.
E.g.

```javascript
// Returns a result object of the next cycle and the calculation
var currentCycle = myGame.cycle();

// Log the result
console.log(currentCycle);

```

Such a result looks like:

```javascript
{
  width: 8, // Width of current cycle
  height: 8, // Height of current cycle
  map: [ // The map of the current cycle
    false,
    true,
    true,
    false,
    false,
    false,
    true,
    false,
    [...]
  ],
  mapBinary: <Buffer ff ff ff ff ff ff ff ff>, // A binary buffer containing the map just in a binary way (More about this feature below!)
  changeset: [ // Changeset that explains in a detailed way which rules are applied on which cell
    { oldState: true, newState: true, rule: 'Rule2', index: 2 },
    { oldState: true, newState: true, rule: 'Rule2', index: 3 },
    { oldState: true, newState: true, rule: 'Rule2', index: 10 },
    [...]
  ],
  // Changeset that explains also all used rules but excludes rules that didn't changed anything (E.g. 'Rule2')
  realChanges: [
    { oldState: true, newState: false, rule: 'Rule1', index: 29 },
    { oldState: false, newState: true, rule: 'Rule4', index: 37 },
    { oldState: false, newState: true, rule: 'Rule4', index: 50 },
    { oldState: true, newState: false, rule: 'Rule3', index: 51 },
    [...]
  ]
}
```

Please keep in mind that `cycle()` doesn't change the `map` of your instance.
If you call `cycle()` a few times you will ever get the first cycle of your map.

To avoid this, you have to set your `map` manually after a `cycle()`. Therefore use `setMap()`.

```javascript
// Get the 1st cycle
var cycle1 = myGame.cycle();

// Now, set the returned 'map' to my instance's map
myGame.setMap(currCycle.map);

// Now you can cycle() again and you will get the 2nd level :)
// Get the 2nd cycle
var cycle2 = myGame.cycle();

// Your code ...
```

### live()

The `live()` method automates `cycle()` in a way that you don't have to worry about setting your instance's map or a loop.

The return of `live()` is *life* object that contains not too much information but your map's boundings and all cycles.

Just define how many cycles do want to generate.

```javascript
// Will generate the next 10 "generations" (or cycles) of your current map

// The 1st argument is required and defines the count of generations you'll calculate.

// The 2nd argument is optional. It is a progress handler that would be fired after every calculation of a cycle
// This is important because sometimes the calculations take a lot of time

// The 3rd argument ("default") is optional and defines if your cycles are in the "default" format (Object-arrays literal) or, if it is "binary", represented by a buffer and binary (More about that below)
var life = myGame.live(10, function(currCycle, progress) {
  // 'currCycle' is just a result object like you already know from 'cycle()'. It contains a lot of information like 'map', 'mapBinary', 'changeset' ...
  console.log(currCycle);

  // 'progress' is the current progress (0-1)
  console.log(progress);
}, "default");
// "default" be "binary" which means that the result life would be consist of buffers. (One buffer for every map)

// Let's have a look at the life! (Doesn't contains all informations like 'cycle()' natively.) To get this kind of information (like 'changeset'...),
console.log(life);
```


### Binary

As you may already saw, there exist the possibility to save a map in binary format directly. Maybe you'll ask for **Why?**.

The reason is very simple. By default, a cycle is represented by an array containing boolean values (each value for each cell).
But sometimes you will handle very huge cycles. The good aspect on the binary format is, that it saves a lot of space. That's because every cell is just one single bit. (0 or 1). In reality that means a large efficiency in space. For example, a cell within a cycle formatted as JSON needs the boolean keywords `true` or `false`. `true` contains *4* characters while `false` contains *5* characters. On average that makes *4.5* characters for the keyword + 1 character for the comma `,`. Therefore, a cell in JSON format consists of *5.5* characters whose bit length is almost *8*. A cell state needs `5.5 * 8` bits which equals to **44**. To save your cycle in *binary* format saves 44 times more space than in JSON literal.

#### binaryLife()

To use the "converter" who converts a normal cycle map (Array containing boolean values) into a buffer representing the whole cycle, just call the static method `binaryLife(myCycleMap)` of the `GameOfLife` class literal. (It's a static method, therefore you don't need an instance of the class).

## CLI

The module's entry point is `game.js`. But if you have a look at the `demo` folder, you'll see that there exist a CLI implementation.

To use the CLI implementation you can easily run the file `demo/cli/cli.js` with **node** or install it globally as described above:
```bash
npm install life-game -g
```

Just run:

```bash
life-game --template <template> --boundings 16x16 --count 100
```
### Local Usage

If you don't want to install it globally, you also can run `demo/cli/cli.js` (File within this repository) instead in the command line.

### Example

If you are a member of [IT-Talents](https://www.it-talents.de), maybe you know the given example in the header of the code competitions site. To run this example for 3 new generations just run the following:

```bash
life-game --boundings 5 --count 3 00000011000010000100
```

To understand the different arguments/parameters have a look the table below.

### Arguments

Keep always in mind that an argument's syntax is `--argument` or `-a` (alias).

The given example values are just examples to demonstrate the syntax and type of each argument.

|Argument |Alias|Value|Functionality|Default
|---
|template|t|`010101110` or *file path*|Template (start map)|Randomly generated
|boundings|b|`16x16` or `16`|Boundings of map (width & height)|`8x8`
|count|c|`100`|Count of calculations (cycles)   |`10`
|output|o|non-existing or *file path*|If it does not exist, the result will be printed pretty in console and a given *file path* saves the result as JSON. If **format** is `binary`, the result will be saved differently into a package containing one binary file for each cycle|`pretty`
|format|f|`boolean` or `binary`|Wether a cell is represented by a **boolean** value in an array literal (cycle) or as a bit in a buffer (cycle)|`boolean`

### Template

**If you are not using a start template, the template is generated randomly!**

The template argument is given generally with `--template` or `-t` but it is also the default argument, therefore you could use it without any prefix.

The value of the argument can be a template string like `00000011000010000100` or a file path that points to a binary or a JSON (Boolean array) file.

These files are the ones you get when exporting into a package (More about this below).

```bash
life-game -b 5 -c 3 --template path/to/your/package/folder/cycles/cycle-0
```

```bash
life-game -b 5 -c 3 --template path/to/your/package/folder/cycles/cycle-0.json
```

### Output & Format

Please keep in mind that it matters what a kind of `format` you're using when saving your results.

If you don't specify an output, the result will printed to stdout (console).

There exist two types of output:

#### A Single File

If you're using the file name extension `.json` for `output`, a single JSON file will be created.

```bash
life-game -b 5 -c 3 --output life.json
```
`-b` *&* `-c` *are just the aliases for* `--boundings` *&* `--count` *and the used format here is* `boolean` *because it is the default value.*

##### Boolean Format

If now your `format` is `boolean`, a *cycle* is just an array containing boolean values for each cell (exactly as you know it from the module itself).

```bash
life-game -b 5 -c 3 --output life-boolean.json --format boolean
```

##### Binary Format

But if your `format` is `binary`, the binary will be represented by a **base64** string within your *life* array. Therefore, each string is a cycle containing its cells as bits (**base64**).

```bash
life-game -b 5 -c 3 --output life-binary.json --format binary
```


#### A Directory (Package-like)

To export your results into a *package*, you should not use any file name extensions.
Such a package looks like the following:
```
your-package/
            life.json
            cycles/
                  cycle-1
                  cycle-2
                  cycle-3
                  <...>
```

The meta information (like **width** or **height**) is stored in `life.json`.

Every cycle is represented by a own file. It's file name extension depends on the `format` you're using.

```bash
life-game -b 5 -c 3 --output life-package
```

##### Boolean Format

If now your `format` is `boolean`, a *cycle* is a single JSON file within the `cycles` folder of your package directory.

```bash
life-game -b 5 -c 3 --output life-package-boolean --format boolean
```

##### Binary format


But if your `format` is `binary`, a *cycle* is a single binary file storing each cell as one bit.

```bash
life-game -b 5 -c 3 --output life-package-binary --format binary
```

### Example

How a CLI usage could look like. In this case we're creating a single file as result.

The **used** template is the given example from the header of the [CodeCompetition 09 2017](https://www.it-talents.de/foerderung/code-competition/code-competition-09-2017)

```bash
life-game -b 5x5 --count 4 --output life.json --format boolean --template 00000011000010000100
```

This example is a little bit different. Firstly, there is no template which means that it will be generated randomly.
This example also takes more time to calculate and the result is saved into a package folder containing each cycle as a JSON file.

```bash
life-game -b 64x64 --count 30 --output life --format boolean
```

Please always remember that you are allowed to combine **both** options (*package* or *file* & `format` argument) in any way you like :)

## How it works

### Calculating

The process of calculating is defined in the method `cycle()`.
The rules that are used are stored in the file `Rules.js`. This module returns an array that contains exactly *4* rules. A rule is just an object containing some properties.

Rules have a `name`, a `requiredState`, a `newState` and a `validate` method.
The `name` is mostly interesting for debugging. It identifies every rule significantly.

#### requiredState

`requiredState` is a *boolean* value that defines which cells are to be validated with the rule. If a rule's `requiredState` is `true`, all cells whose state is `true` will be checked for validation with this rule.

#### newState

`newState` is the state a cell has to be if the rule fits in.
If a cell's state is `true`, a rule fits in and the `newState` is `false`, cell#s new state shall be `false`.

#### validate()

`validate()` is the validation method of a rule. If this method returns `true`, the `newState` will be used. If not, nothing happens.

#### Example Rule

For example, you see the first rule of Conway's *"Game of Life"*
```javascript
{
  name: "Rule1",
  // State that is required by cell to validte it with this rule
  requiredState: true,
  // New state that is used for the cell if rule fits
  // In this case the cell would die
  newState: false,
  // Validate function that the meaning of the rule
  validate: function(cell) {
    // If the current cell has less than 2 surrounding cells that are alive

    /*

      1) Jede lebende Zelle, die weniger als 2 lebende Nachbarzellen hat, stirbt

    */

    // Return 'true' if they are less than 2. Otherwise 'false'
    return cell.surroundingsAlive.length < 2;
  }
}
```

As I already said, this implementation of validating rules is not absolutly speed optimized but programmatically more clean and extensible.


## Questions?

Ask me ;-)
[conr.maur@googlemail.com](mailto:conr.maur@googlemail.com)
