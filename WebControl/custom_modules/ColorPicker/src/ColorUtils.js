/*!
 * Code modified from: iro.js v3.5.6
 * 2016-2018 James Daniel
 * Released under the MIT License
 * github.com/jaames/iro.js
 */


function ColorUtils() {
}

/**
  * @desc convert rgb object to hsv
  * @param {Object} rgb - rgb object
  * @return {Object} hsv object
*/
ColorUtils.prototype.rgb2Hsv = function(rgb) {
  // Modified from https://github.com/bgrins/TinyColor/blob/master/tinycolor.js#L446
  var r = rgb.r / 255,
      g = rgb.g / 255,
      b = rgb.b / 255,
      max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      delta = max - min,
      hue;

  switch (max) {
    case min:
      hue = 0;
      break;

    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;

    case g:
      hue = (b - r) / delta + 2;
      break;

    case b:
      hue = (r - g) / delta + 4;
      break;
  }

  hue /= 6;
  return {
    h: hue * 360,
    s: max == 0 ? 0 : delta / max * 100,
    v: max * 100
  };
};

/**
  * @desc convert hsv object to hsl
  * @param {Object} hsv - hsv object
  * @return {Object} hsl object
*/
ColorUtils.prototype.hsv2Hsl = function(hsv) {
  var s = hsv.s / 100,
      v = hsv.v / 100;
  var l = 0.5 * v * (2 - s);
  s = v * s / (1 - Math.abs(2 * l - 1));
  return {
    h: hsv.h,
    s: s * 100 || 0,
    l: l * 100
  };
};


/**
  * @desc convert hsv object to rgb
  * @param {Object} hsv - hsv object
  * @return {Object} rgb object
*/
ColorUtils.prototype.hsv2Rgb = function(hsv) {
  var r, g, b, i, f, p, q, t;
  var h = hsv.h / 360,
      s = hsv.s / 100,
      v = hsv.v / 100;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v, g = t, b = p;
      break;

    case 1:
      r = q, g = v, b = p;
      break;

    case 2:
      r = p, g = v, b = t;
      break;

    case 3:
      r = p, g = q, b = v;
      break;

    case 4:
      r = t, g = p, b = v;
      break;

    case 5:
      r = v, g = p, b = q;
      break;
  }

  return {
    r: r * 255,
    g: g * 255,
    b: b * 255
  };
};

/**
  * @desc convert hsl object to hsv
  * @param {Object} hsl - hsl object
  * @return {Object} hsv object
*/
ColorUtils.prototype.hsl2Hsv = function(hsl) {
  var s = hsl.s / 100,
      l = hsl.l / 100;
  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  return {
    h: hsl.h,
    s: 2 * s / (l + s) * 100,
    v: (l + s) / 2 * 100
  };
};
/**
  * @desc convert hsl object to string
  * @param {Object} hsl - hsl object
  * @return {Object} hsl string
*/

ColorUtils.prototype.hsl2Str = function(hsl) {
  return "hsl" + (hsl.a ? "a" : "") + "(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%" + (hsl.a ? ", " + hsl.a : "") + ")";
};
/**
  * @desc convert rgb object to string
  * @param {Object} rgb - rgb object
  * @return {Object} rgb string
*/

ColorUtils.prototype.rgb2Str = function(rgb) {
  return "rgb" + (rgb.a ? "a" : "") + "(" + rgb.r + ", " + rgb.g + ", " + rgb.b + (rgb.a ? ", " + rgb.a : "") + ")";
};

/**
  * @desc convert rgb object to hex string
  * @param {Object} rgb - rgb object
  * @return {Object} hex string
*/
ColorUtils.prototype.rgb2Hex = function(rgb) {
  var str = "#";
  str += rgb.r.toString(16).padStart(2, "0");
  str += rgb.g.toString(16).padStart(2, "0");
  str += rgb.b.toString(16).padStart(2, "0");
  return str;
};

/**
  * @desc parse hex string
  * @param {String} str - color string
  * @return {Object} rgb object
*/
ColorUtils.prototype.parseHexStr = function(hex) {
  // Strip any "#" characters
  hex = hex.replace("#", ""); // Prefix the hex string with "0x" which indicates a number in hex notation, then convert to an integer

  var int = parseInt("0x" + hex),
      // If the length of the input is only 3, then it is a shorthand hex color
  isShorthand = hex.length == 3,
      // bitMask for isolating each channel
  bitMask = isShorthand ? 0xF : 0xFF,
      // bitLength of each channel (for example, F is 4 bits long while FF is 8 bits long)
  bitLength = isShorthand ? 4 : 8,
      // If we're using shorthand notation, multiply each channel by 17
  multiplier = isShorthand ? 17 : 1;
  return {
    r: (int >> bitLength * 2 & bitMask) * multiplier,
    g: (int >> bitLength & bitMask) * multiplier,
    b: (int & bitMask) * multiplier
  };
};

/**
  * @desc generic parser for hsl / rgb / etc string
  * @param {String} str - color string
  * @param {Array} maxValues - max values for each channel (used for calculating percent-based values)
  * @return {Array} type (rgb | rgba | hsl | hsla) values for each channel
*/
ColorUtils.prototype.parseColorStr = function(str, maxValues) {
  // eslint-disable-next-line no-useless-escape
  var parsed = str.match(/(\S+)\((\d+)(%?)(?:\D+?)(\d+)(%?)(?:\D+?)(\d+)(%?)(?:\D+?)?([0-9\.]+?)?\)/i),
      val1 = parseInt(parsed[2]),
      val2 = parseInt(parsed[4]),
      val3 = parseInt(parsed[6]);
  return [parsed[1], parsed[3] == "%" ? val1 / 100 * maxValues[0] : val1, parsed[5] == "%" ? val2 / 100 * maxValues[1] : val2, parsed[7] == "%" ? val3 / 100 * maxValues[2] : val3, parseFloat(parsed[8]) || undefined];
}

/**
  * @desc parse hsl string
  * @param {String} str - color string
  * @return {Object} hsl object
*/
ColorUtils.prototype.parseHslStr = function(str) {
  var parsed = this.parseColorStr(str, [360, 100, 100]);
  return {
    h: parsed[1],
    s: parsed[2],
    l: parsed[3]
  };
};

/**
  * @desc parse rgb string
  * @param {String} str - color string
  * @return {Object} rgb object
*/
ColorUtils.prototype.parseRgbStr = function(str) {
  var parsed = this.parseColorStr(str, [255, 255, 255]);
  return {
    r: parsed[1],
    g: parsed[2],
    b: parsed[3]
  };
};

export default new ColorUtils();