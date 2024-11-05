# JavaScript lib to manipulate colours
This little JS lib allow you to get dominant colour from an image element.<br>

## Functions
Functions are not all in the following table !
| Name         | Usage                                                                |
| ------------ | -------------------------------------------------------------------- |
| toString     | Get RGB CSS property _(using current saved colour)_                  |
| hexToRGB     | Hexadecimal colour to RGB colour                                     |
| **solve**    | Get Filter CSS property for specified colour _(input as hex colour)_ |
| **css**      | Function used in "solve" to get CSS filter property                  |
| invert       | Invert the current colour                                            |
| sepia        | Get sepia of input colour _(input as r,g,b)_                         |
| saturate     | Get saturated colour from input _(input as r,g,b)_                   |
| hueRotate    | New hue from angle, based on input _(input as r,g,b)_                |
| hsl          | Get HSL colour from input _(input as r,g,b)_                         |
| toHex        | RGB colour to Hex colour                                             |
| getDominant  | Get dominant colour from image element                               |

---

The getDominant function could not work as expected, due to cros-origin.
