
self.importScripts("gameOfLife/bundle.js");


self.addEventListener('message', function(e) {
  var data = e.data;

  var game = new GameOfLife(data.boundings.width, data.boundings.height, data.map);


  game.live(data.count, function(cycle, progress, total) {
    self.postMessage({
      cycle: cycle,
      progress: progress
    });
  });


}, false);
