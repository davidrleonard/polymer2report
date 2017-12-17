/**
 * Helper functions for formatting cli output.
 */

// Colors

const reset = (s) => `\x1b[0m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const light = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

// Formatting

/* Takes a numerator and denominator and returns a percentage as a string. */
const percent = (a,b) => `${((a/b)*100).toFixed(0)}%`;

/* Justifies text by adding dots */
const justify = (len, str1, str2, char='.') => {
  let numChar = len - str1.length - str2.length;
  let chars = char.repeat(numChar);
  return str1 + light(chars) + str2;
}

module.exports = {
  reset,
  bold,
  light,
  red,
  green,
  percent,
  justify
}
