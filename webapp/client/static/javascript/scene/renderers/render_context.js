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
 * Rendering context for WebGL-based renderers.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Render context constructor.
 *
 * @class A rendering context stores common data needed by a renderer to draw
 *        to a target WebGL-enabled canvas.
 *
 * @constructor
 * @param {Canvas} canvas target canvas element
 */
function RenderContext(canvas) {
   /* store canvas and initialize webgl context */
   this.canvas = canvas;
   this.gl     = RenderContext.initWebGL(canvas);
   /* camera viewpoint */
   this.model_view_mx  = mat4.create();
   this.perspective_mx = mat4.create();
   /* attached and active shader programs */
   this.sh_progs      = {};
   this.sh_active     = null;
   this.sh_active_tag = "";
}

/*****************************************************************************
 * WebGL initialization.
 *****************************************************************************/

/**
 * Initialize WebGL context for the specified canvas.
 *
 * @param   {Canvas}       canvas canvas element
 * @returns {WebGLContext}        webgl context
 */
RenderContext.initWebGL = function(canvas) {
   var gl = null;
   try {
      gl = canvas.getContext("webgl") || 
           canvas.getContext("experimental-webgl");
   } catch (e) { }
   if (!gl) {
      throw ("could not initialize WebGL");
   }
   return gl;
}

/*****************************************************************************
 * Canvas and WebGL context access.
 *****************************************************************************/

/**
 * Get the canvas element associated with the rendering context.
 *
 * @returns {Canvas} canvas element
 */
RenderContext.prototype.getCanvas = function() {
   return this.canvas;
}

/**
 * Get the WebGL context associated with the rendering context.
 *
 * @returns {WebGLContext} webgl context
 */
RenderContext.prototype.getGL = function() {
   return this.gl;
}

/*****************************************************************************
 * Canvas management.
 *****************************************************************************/

/**
 * Initialize the canvas for WebGL rendering.
 */
RenderContext.prototype.canvasInit = function() {
   /* setup rendering viewport to match canvas size */
   this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
   /* setup blending and depth test */
   this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
   this.gl.enable(this.gl.DEPTH_TEST);
   this.gl.enable(this.gl.BLEND);
}

/**
 * Set the canvas background color.
 *
 * @param {array} color color as RGBA tuple with values in range [0, 1]
 */
RenderContext.prototype.canvasColor = function(color) {
   this.gl.clearColor(color[0], color[1], color[2], color[3]);
}

/**
 * Resize the canvas.
 *
 * @param {int} width  canvas width (in pixels)
 * @param {int} height canvas height (in pixels)
 */
RenderContext.prototype.canvasResize = function(width, height) {
   /* resize the canvas */
   this.canvas.width  = width;
   this.canvas.height = height;
   /* setup rendering viewport to match canvas size */
   this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
}

/**
 * Clear the drawing canvas.
 */
RenderContext.prototype.canvasClear = function() {
   this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
}

/*****************************************************************************
 * Camera management.
 *****************************************************************************/

/**
 * Initialize the camera to be an orthonal projection onto the region of the
 * (x,y)-plane matching the canvas size.  Set the z-depth bounds of the view
 * frustum to the specified range.
 *
 * @param {float} z_min minimum z-depth of view frustum (default: -1.0)
 * @param {float} z_max maximum z-depth of view frustum (default:  1.0)
 */
RenderContext.prototype.cameraInit = function(z_min, z_max) {
   /* default arguments */
   z_min = (typeof(z_min) != "undefined") ? z_min : -1.0;
   z_max = (typeof(z_max) != "undefined") ? z_max :  1.0;
   /* construct view and projection matrices */
   mat4.identity(this.model_view_mx);
   mat4.ortho(
      0, this.canvas.width, 0, this.canvas.height, -z_min, -z_max,
      this.perspective_mx
   );
   /* update active shader */
   this.updateShader({ name: "model-view" });
   this.updateShader({ name: "perspective" });
}

/**
 * Control camera model-view matrix.
 * Optionally set the model-view matrix by copying the specified matrix.
 * Return a reference to the render context's updated model-view matrix.
 *
 * @param   {mat4} mv_mx model-view matrix (optional, to be copied)
 * @returns {mat4}       updated model-view matrix
 */
RenderContext.prototype.cameraModelView = function(mv_mx) {
   if (typeof(mv_mx) != "undefined") {
      this.model_view_mx = mat4.create(mv_mx);
      this.updateShader({ name: "model-view" });
   }
   return this.model_view_mx;
}

/**
 * Control camera perspective matrix.
 * Optionally set the perspective matrix by copying the specified matrix.
 * Return a reference to the render context's updated perspective matrix.
 *
 * @param   {mat4} p_mx perspective matrix (optional, to be copied)
 * @returns {mat4}      updated perspective matrix
 *
 */
RenderContext.prototype.cameraPerspective = function(p_mx) {
   if (typeof(p_mx) != "undefined") {
      this.perspective_mx = mat4.create(p_mx);
      this.updateShader({ name: "perspective" });
   }
   return this.perspective_mx;
}

/**
 * Set camera perspective to the specified orthogonal projection.
 *
 * @param   {array} xrange (xmin, xmax) tuple giving x-coordinate range
 * @param   {array} yrange (ymin, ymax) tuple giving y-coordinate range
 * @param   {array} drange (dmin, dmax) tuple giving depth rendering range
 * @returns {mat4}         updated perspective matrix
 */
RenderContext.prototype.cameraOrthogonal = function(xrange, yrange, drange) {
   mat4.ortho(
      xrange[0], xrange[1],
      yrange[0], yrange[1],
      drange[0], drange[1],
      this.perspective_mx
   );
   this.updateShader({ name: "perspective" });
   return this.perspective_mx;
}

/*****************************************************************************
 * Shader management.
 *****************************************************************************/

/**
 * Check whether the shader program with the given tag is available within the
 * rendering context.
 *
 * @param   {string} tag shader program name
 * @returns {bool}       does shader program exist in context?
 */
RenderContext.prototype.hasShader = function(tag) {
   return (tag in this.sh_progs);
}

/**
 * Check whether the shader program with the given tag is the currently active
 * shader program within the rendering context.
 *
 * @param   {string} tag shader program name
 * @returns {bool}       is shader program in use within context?
 */
RenderContext.prototype.hasActiveShader = function(tag) {
   return (tag == this.sh_active_tag);
}

/**
 * Lookup and return the shader program with the specified tag in the rendering
 * context.  Return null if no such shader program exists.
 *
 * @param   {string} tag  shader program name
 * @returns {object}      shader program information
 */
RenderContext.prototype.getShader = function(tag) {
   if (tag in this.sh_progs)
      return this.sh_progs[tag];
   else
      return null;
}

/**
 * Lookup and return the currently active shader program within the rendering
 * context.  Return null if no shader program is in use.
 *
 * @returns {object} active shader program information
 */
RenderContext.prototype.getActiveShader = function() {
   return this.sh_active;
}

/**
 * Add a shader program to the rendering context, while specifying a unique tag
 * by which to identify the shader program when later activating it.
 *
 * Throw an error if specifying a tag that already exists in the context.
 *
 * Rather than adding only the shader program, it is packed together with
 * auxiallary data and a callback function, and this entire shader information
 * structure is added to the rendering context.
 *
 * The callback function is triggered when activating or deactivating the
 * shader within the rendering context, or when making changes to the context
 * (such as altering the camera view) that may require updating variables in
 * the active shader program.
 *
 * Callbacks must take argument lists of the following form:
 *    callback(ctxt, prog, data, ev)
 * where ctxt is the rendering context, prog and data store the shader program
 * and shader program data, and ev is the event data.
 *
 * @param {string}       tag      shader program name
 * @param {WebGLProgram} prog     shader program
 * @param {object}       data     shader program data
 * @param {function}     callback event handler for shader
 */
RenderContext.prototype.addShader = function(tag, prog, data, callback) {
   /* check the tag is unique */
   if (tag in this.sh_progs)
      throw ("duplicate tag specified when adding shader to render context");
   /* create shader info data structure */
   var sh_prog = { prog: prog, data: data, callback: callback };
   /* add shader info to rendering context */
   this.sh_progs[tag] = sh_prog;
}

/**
 * Remove and return the shader program with the specified tag.
 * If the specified shader is currently active, deactivate it before removal.
 *
 * Throw an error if no shader program with the given tag exists.
 *
 * @param   {string} tag shader program name
 * @returns {object}     removed shader program information
 */
RenderContext.prototype.removeShader = function(tag) {
   if (tag in this.sh_progs) {
      /* check if shader is active */
      if (tag == this.sh_active_tag) {
         /* deactivate shader program */
         this.updateShader({ name: "deactivate" });
         this.sh_active = null;
         this.sh_active_tag = "";
      }
      /* remove shader program */
      var sh_prog = this.sh_progs[tag];
      delete this.sh_progs[tag];
      return sh_prog;
   } else {
      throw ("attempt to remove shader with nonexistent tag: " + tag);
   }
}

/**
 * Use the shader with the specified tag within the rendering context.
 * This shader becomes the active shader used in all subsequent drawing calls.
 *
 * Throw an error if no shader program with the given tag exists.
 *
 * @param {string} tag shader program name
 */
RenderContext.prototype.useShader = function(tag) {
   if (tag != this.sh_active_tag) {
      if (tag in this.sh_progs) {
         /* get requested shader */
         var sh_prog = this.sh_progs[tag];
         /* deactivate currently active shader (if any) */
         this.updateShader({ name: "deactivate" });
         /* set requested shader as active */
         this.sh_active     = sh_prog;
         this.sh_active_tag = tag;
         /* activate requested shader */
         this.updateShader({ name: "activate" });
      } else {
         throw ("attempt to use shader with nonexistent tag: " + tag);
      }
   }
}

/**
 * Update the currently active shader by passing the specified event to its
 * callback function.  If no shader is active, then do nothing.
 *
 * @param {object} ev event data
 */
RenderContext.prototype.updateShader = function(ev) {
   if (this.sh_active != null) {
      this.sh_active.callback(
         this, this.sh_active.prog, this.sh_active.data, ev
      );
   }
}
