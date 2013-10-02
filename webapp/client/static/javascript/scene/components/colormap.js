/*
 * Copyright (C) 2012-2013 Michael Maire <mmaire@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * Colormap.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Colormap constructor.
 * Create and return a zero-initialized colormap of specified size.
 *
 * @class A colormap stores a mapping from integers in the range [0, size-1]
 *        to RGBA tuples.  Colors are stored as integers with 8 bits of
 *        precision per channel (in the range [0, 255]).
 *
 * @constructor
 * @param {int} size number of elements in the colormap (default: 0)
 */
function Colormap(size) {
   /* default arguments */
   size = (typeof(size) != "undefined") ? size : 0;
   /* colormap data */
   this.cdata = new Uint32Array(size);
   /* rendering data */
   this.renderers = {};
}

/*****************************************************************************
 * Colormap size.
 *****************************************************************************/

/**
 * Get size of colormap.
 *
 * @returns {int} number of elements in colormap
 */
Colormap.prototype.size = function() {
   return this.cdata.length;
}

/**
 * Resize colormap.
 * Zero-initialize any elements added to colormap.
 *
 * @param {int} size number of elements in colormap
 */
Colormap.prototype.resize = function(size) {
   /* allocate resized colormap */
   var cdata = new Uint32Array(size);
   /* compute overlap size */
   var sz = Math.min(this.cdata.size, size);
   /* copy existing elements */
   for (var n = 0; n < sz; ++n)
      cdata[n] = this.cdata[n];
   /* initialize additional elements */
   for (var n = sz; n < size; ++n)
      cdata[n] = 0;
   /* swap in updated color data */
   this.cdata = cdata;
   /* notify attached renderers */
   Renderer.updateAll(this, { name: "resize" });
}

/*****************************************************************************
 * Color manipulation.
 *****************************************************************************/

/**
 * Get the color for the specified element.
 *
 * @param   {int}   n element id
 * @returns {array}   color as RGBA tuple with values in range [0, 255]
 */
Colormap.prototype.getColor = function(n) {
   /* get per-channel view of colormap */
   var cdata = new Uint8Array(this.cdata.buffer);
   /* extract color channels */
   var r = cdata[4*n];
   var g = cdata[4*n + 1];
   var b = cdata[4*n + 2];
   var a = cdata[4*n + 3];
   /* assemble color */
   return [r, g, b, a];
}

/**
 * Set the color for the specified element.
 *
 * @param {int}   n     element id
 * @param {array} color color as RGBA tuple with values in range [0, 255]
 */
Colormap.prototype.setColor = function(n, color) {
   /* get per-channel view of colormap */
   var cdata = new Uint8Array(this.cdata.buffer);
   /* set color channels */
   for (var c = 0; c < 4; ++c)
      cdata[4*n + c] = color[c];
   /* notify attached renderers */
   Renderer.updateAll(this, { name: "set-color" });
}

/**
 * Invert red, green, and blue channels for all elements in the colormap.
 */
Colormap.prototype.invert = function() {
   /* get per-channel view of colormap */
   var cdata = new Uint8Array(this.cdata.buffer);
   /* invert RGB channels */
   for (var n = 0; n < cdata.length; n += 4) {
      cdata[n]   = 255 - cdata[n];
      cdata[n+1] = 255 - cdata[n+1];
      cdata[n+2] = 255 - cdata[n+2];
   }
   /* notify attached renderers */
   Renderer.updateAll(this, { name: "invert" });
}
