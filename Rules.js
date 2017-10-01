module.exports = [
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
  },
  {
    name: "Rule2",
    // Theoretically this rule is obsolete because it just defines "continue living" which would automatically be the case if nothing lese happens
    // But I implemented the rule anyway to demonstrate the idea of rules

    // State that is required by cell to validte it with this rule
    // In this case the cell would continue with living
    requiredState: true,
    // New state that is used for the cell if rule fits
    newState: true,
    // Validate function that the meaning of the rule
    validate: function(cell) {
      // If the current cell has less than 2 surrounding cells that are alive
      /*

        2) Jede lebende Zelle, die 2 oder 3 lebendige Nachbarzellen hat, lebt weiter

      */

      // Return 'true' if they are exactly 2 or 3
      return (cell.surroundingsAlive.length == 2 || cell.surroundingsAlive.length == 3);
    }
  },
  {
    name: "Rule3",
    // State that is required by cell to validte it with this rule
    requiredState: true,
    // New state that is used for the cell if rule fits
    // In this case the cell would die
    newState: false,
    // Validate function that the meaning of the rule
    validate: function(cell) {
      // If the current cell has less than 2 surrounding cells that are alive
      /*

        3) Jede lebende Zelle, die mehr als 3 lebende Nachbarzellen hat, stirbt

      */

      // Return 'true' if they are more than 3
      return cell.surroundingsAlive.length > 3;
    }
  },
  {
    name: "Rule4",
    // State that is required by cell to validte it with this rule
    requiredState: false,
    // New state that is used for the cell if rule fits
    // In this case the cell would start to live
    newState: true,
    // Validate function that the meaning of the rule
    validate: function(cell) {
      // If the current cell has less than 2 surrounding cells that are alive
      /*

        4) Jede tote Zelle, die genau 3 lebende Nachbarzellen hat, wird lebendig

      */

      // Return 'true' if they are exactly 3
      return cell.surroundingsAlive.length == 3;
    }
  }
];
