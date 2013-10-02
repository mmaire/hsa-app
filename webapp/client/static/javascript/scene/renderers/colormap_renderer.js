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
 * Colormap renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Colormap renderer constructor.
 *
 * @class A colormap renderer maintains a texture map for its associated
 *        source colormap.  This renderer is used only to facilitate drawing
 *        of other objects that utilize the colormap.  It allows these objects
 *        to share a single texture resource for the colormap.
 *
 * @constructor
 * @param {RenderContext} ctxt rendering context
 * @param {Colormap}      cmap source colormap
 * @param {string}        tag  renderer name (optional)
 */
ColormapRenderer = function(ctxt, cmap, tag) {
   /* default arguments */
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   /* store context and source colormap */
   this.ctxt = ctxt;
   this.cmap = cmap;
   /* create colormap texture */
   var gl = this.ctxt.getGL();
   this.tex_cmap = gl.createTexture();
   /* update colormap texture */
   this.updateColormap();
   /* attach renderer to colormap */
   Renderer.attach(cmap, this, tag);
}

/*****************************************************************************
 * Rendering helper methods.
 *****************************************************************************/

/**
 * Update the rendering data to reflect changes to the colormap.
 */
ColormapRenderer.prototype.updateColormap = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* bind colormap texture */
   gl.bindTexture(gl.TEXTURE_2D, this.tex_cmap);
   /* refresh texture with colormap data */
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, this.cmap.cdata.length, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.cmap.cdata.buffer)
   );
   /* set texture clamp behavior */
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}


/*****************************************************************************
 * Rendering resource access.
 *****************************************************************************/

/**
 * Colormap texture access.
 * Return the WebGL texture for the colormap.
 *
 * @returns {WebGLTexture} colormap texture
 */
ColormapRenderer.prototype.getTexture = function() {
   return this.tex_cmap;
}

/*****************************************************************************
 * Colormap rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in the colormap.
 *
 * @param {Colormap} obj colormap object being updated
 * @param {object}   ev  event data
 */
ColormapRenderer.prototype.update = function(obj, ev) {
   /* refresh colormap texture */
   this.updateColormap();
}

/**
 * Draw interface.
 * Do nothing as colormaps are not themselves rendering targets.
 */
ColormapRenderer.prototype.draw = function() { }

/**
 * Deallocate colormap rendering resources.
 */
ColormapRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete colormap texture */
   gl.deleteTexture(this.tex_cmap);
}
