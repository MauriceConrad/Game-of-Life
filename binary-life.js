const byteLength = 8;
const numbericSystem = 2;

module.exports = {
  binary(map) {
    // Count of bits
    var bits = map.length;
    // Count of bytes (Divided by byteLength)
    var bytes = Math.ceil(bits / byteLength);

    // Create buffer
    var buffer = new Buffer(bytes);

    // Loop trough cells
    map.forEach(function(cell, index) {
      // Index of byte that should be edited
      var byteIndex = Math.trunc(index / byteLength);
      // Index of bit within byte
      var bitIndex = index % byteLength;

      // Reverse index of bit (arabic system is right to left but we want to write left to right)
      var bitIndexReverse = (byteLength - 1) - bitIndex;

      // State of cell as 0 or 1 (Converts from true || false)
      var cellBinState = cell ? 1 : 0;

      // Add to byte at byteIndex
      // 2^i * n
      buffer[byteIndex] += Math.pow(numbericSystem, bitIndexReverse) * cellBinState;
    });

    return buffer;
  },
  boolean(buffer) {
    var bits = [];
    var byte;
    for (byte of buffer) {
      for (var i = byteLength - 1; i >= 0; i--) {
        bits.push(byte >> i & 1 ? true : false);
      }
    }

    return bits;
  }
};
