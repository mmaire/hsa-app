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
 * Brush renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Brush renderer constructor.
 *
 * @class A brush renderer controls the display of a {@link Brush} object on
 *        the canvas within a {@link RenderContext}.
 *
 * This renderer overlays a circular brush with three areas whose color and
 * transparency is determined by user-specified RGBA tuples.  These areas are:
 *
 *    (1) The pixels grabbed according to the brush type (foreground).
 *    (2) The pixels in the circle not grabbed by the brush (background).
 *    (3) The outline of a targetting frame to assist visualization (frame).
 *
 * @constructor
 * @param {RenderContext} ctxt  rendering context
 * @param {Brush}         brush brush to display
 * @param {string}        tag   renderer name (optional)
 */
function BrushRenderer(ctxt, brush, tag) {
   /* default arguments */
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   /* store context and source brush */
   this.ctxt  = ctxt;
   this.brush = brush;
   /* set default depth at which to draw brush */
   this.depth = 0.0;
   /* set default frame width (fraction of brush radius) */
   this.frame_width = 0.05;
   /* set default brush colors (alpha channel controls transparency) */
   this.colors = {
      foreground : [1.0, 0.0, 0.0, 0.5],  /* area grabbed by brush */
      background : [0.0, 0.0, 0.0, 0.5],  /* inside radius, but not grabbed */
      frame      : [0.0, 0.0, 0.0, 1.0]   /* color of surrounding frame */
   };
   /* create vertex offset array (offsets are corners of unit square) */
   this.vrtx_offset = new Float32Array(
      [-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
   );
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* create vertex offset buffer */
   this.buff_vrtx_offset = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_offset);
   gl.bufferData(gl.ARRAY_BUFFER, this.vrtx_offset, gl.STATIC_DRAW);
   /* create pixel containment mask texture */
   this.tex_px_mask = gl.createTexture();
   this.updatePixelMask();
   /* create type mask textures */
   this.tex_ty_masks = {};
   for (type in this.brush.type_masks) {
      this.tex_ty_masks[type] = gl.createTexture();
      this.updateTypeMask(type);
   }
   /* attach brush renderer to brush */
   Renderer.attach(brush, this, tag);
}

/*****************************************************************************
 * Rendering helper methods.
 *****************************************************************************/

/**
 * Update the rendering data to reflect the pixel containment mask.
 */
BrushRenderer.prototype.updatePixelMask = function() {
   /* get image size */
   var sx = this.brush.img.sizeX();
   var sy = this.brush.img.sizeY();
   /* get view of pixel mask buffer */
   var px_mask = new Uint8Array(this.brush.pixel_mask.buffer);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* bind mask texture */
   gl.bindTexture(gl.TEXTURE_2D, this.tex_px_mask);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, sy, sx, 0, gl.RGBA, gl.UNSIGNED_BYTE, px_mask
   );
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/**
 * Update the rendering data for the given pixel type id mask.
 *
 * @param {string} type type mask name
 */
BrushRenderer.prototype.updateTypeMask = function(type) {
   /* get image size */
   var sx = this.brush.img.sizeX();
   var sy = this.brush.img.sizeY();
   /* get view of type mask buffer */
   var ty_mask = new Uint8Array(this.brush.type_masks[type].buffer);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* bind mask texture */
   gl.bindTexture(gl.TEXTURE_2D, this.tex_ty_masks[type]);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, sy, sx, 0, gl.RGBA, gl.UNSIGNED_BYTE, ty_mask
   );
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/*****************************************************************************
 * Brush display options.
 *****************************************************************************/

/**
 * Get depth at which to render brush.
 *
 * @returns {float} brush rendering depth
 */
BrushRenderer.prototype.getDepth = function() {
   return this.depth;
}

/**
 * Set depth at which to render brush.
 *
 * @param {float} depth brush rendering depth
 */
BrushRenderer.prototype.setDepth = function(depth) {
   this.depth = depth;
}

/**
 * Get color of the specified brush part.
 * If no part is specified, return the color of the foreground.
 *
 * @param   {string} part brush part ("foreground", "background", or "frame")
 * @returns {array}       color as RGBA tuple with values in range [0, 1]
 */
BrushRenderer.prototype.getColor = function(part) {
   /* default arguments */
   part = (typeof(part) != "undefined") ? part : "foreground";
   /* get part color */
   if (part in this.colors) {
      return this.colors[part];
   } else {
      throw ("attempt to get color of invalid brush part: " + part);
   }
}

/**
 * Set color of the specified brush part.
 * If no part is specified, set the color of the foreground.
 *
 * @param {array}  color color as RGBA tuple with values in range [0, 1]
 * @param {string} part  brush part ("foreground", "background", or "frame")
 */
BrushRenderer.prototype.setColor = function(color, part) {
   /* default arguments */
   part = (typeof(part) != "undefined") ? part : "foreground";
   /* set part color */
   if (part in this.colors) {
      /* copy color */
      var c = this.colors[part];
      c[0] = color[0];
      c[1] = color[1];
      c[2] = color[2];
      c[3] = color[3];
   } else {
      throw ("attempt to set color of invalid brush part: " + part);
   }
}

/*****************************************************************************
 * Brush shader management.
 *****************************************************************************/

/*
 * Brush vertex and fragment shader script ids within the html document source.
 * The document elements marked with these id strings must contain the code for
 * the WebGL shaders for rendering brushes.
 */
BrushRenderer.VERTEX_SHADER_ID   = "brush-vertex-shader";
BrushRenderer.FRAGMENT_SHADER_ID = "brush-fragment-shader";

/*
 * Tag used to identify the brush shader program within a rendering context.
 */
BrushRenderer.SHADER_TAG = "brush-shader";

/**
 * Use the brush shader program within the specified rendering context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
BrushRenderer.useShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(BrushRenderer.SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(BrushRenderer.SHADER_TAG))) {
         /* create shader program */
         var prog = Shader.create(
            ctxt,
            BrushRenderer.VERTEX_SHADER_ID,
            BrushRenderer.FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var gl = ctxt.getGL();
         var data = {
            /* locations of shader uniforms */
            u_mv_mx        : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx         : gl.getUniformLocation(prog, "u_p_mx"),
            u_px_mask_samp : gl.getUniformLocation(prog, "u_px_mask_samp"),
            u_ty_mask_samp : gl.getUniformLocation(prog, "u_ty_mask_samp"),
            u_img_size     : gl.getUniformLocation(prog, "u_img_size"),
            u_center       : gl.getUniformLocation(prog, "u_center"),
            u_radii        : gl.getUniformLocation(prog, "u_radii"),
            u_ignore_ty    : gl.getUniformLocation(prog, "u_ignore_ty"),
            u_depth        : gl.getUniformLocation(prog, "u_depth"),
            u_color_fg     : gl.getUniformLocation(prog, "u_color_fg"),
            u_color_bg     : gl.getUniformLocation(prog, "u_color_bg"),
            u_color_frame  : gl.getUniformLocation(prog, "u_color_frame"),
            /* locations of shader attributes */
            a_vrtx_offset  : gl.getAttribLocation(prog, "a_vrtx_offset")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            BrushRenderer.SHADER_TAG, prog, data, BrushRenderer.updateShader
         );
      }
      /* use shader */
      ctxt.useShader(BrushRenderer.SHADER_TAG);
   }
}

/**
 * Handle callback events for brush shader program within rendering context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
BrushRenderer.updateShader = function(ctxt, prog, data, ev) {
   /* get webgl context */
   var gl = ctxt.getGL();
   /* determine event type */
   if (ev.name == "activate") {
      /* use the shader program */
      gl.useProgram(prog);
      /* setup uniforms */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
      /* enable attributes */
      gl.enableVertexAttribArray(data.a_vrtx_offset);
   } else if (ev.name == "deactivate") {
      /* disable attributes */
      gl.disableVertexAttribArray(data.a_vrtx_offset);
   } else if (ev.name == "model-view") {
      /* update model-view uniform */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
   } else if (ev.name == "perspective") {
      /* update persepective uniform */
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
   }
}

/*****************************************************************************
 * Brush rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in brush.
 *
 * @param {Brush}  obj brush object being updated
 * @param {object} ev  event data
 */
BrushRenderer.prototype.update = function(obj, ev) {
   /* determine event type */
   if (ev.name == "set-containment") {
      this.updatePixelMask();
   } else if (ev.name == "update-type") {
      this.updateTypeMask(ev.type);
   } else if (ev.name == "add-type") {
      var gl = this.ctxt.getGL();
      this.tex_ty_masks[ev.type] = gl.createTexture();
      this.updateTypeMask(ev.type);
   } else if (ev.name == "remove-type") {
      var gl = this.ctxt.getGL();
      gl.deleteTexture(this.tex_ty_masks[type]);
      delete this.tex_ty_masks[type];
   }
}

/**
 * Draw brush.
 */
BrushRenderer.prototype.draw = function() {
   /* activate shader program */
   BrushRenderer.useShader(this.ctxt);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* get shader program data */
   var sh_data = this.ctxt.getActiveShader().data;
   /* assign pixel containment mask texture */
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_px_mask);
   gl.uniform1i(sh_data.u_px_mask_samp, 0);
   /* assign type mask texture */
   gl.activeTexture(gl.TEXTURE1);
   if (this.brush.type != null) {
      /* use type id mask */
      gl.bindTexture(gl.TEXTURE_2D, this.tex_ty_masks[this.brush.type]);
   } else {
      /* use pixel containment as type id */
      gl.bindTexture(gl.TEXTURE_2D, this.tex_px_mask);
   }
   gl.uniform1i(sh_data.u_ty_mask_samp, 1);
   /* assign image size */
   var sxm = Math.max(this.brush.img.sizeX(), 1);
   var sym = Math.max(this.brush.img.sizeY(), 1);
   gl.uniform2fv(sh_data.u_img_size, [sym, sxm]);
   /* assign brush location */
   gl.uniform2fv(sh_data.u_center, [this.brush.y, this.brush.x]);
   /* compute brush frame radius */
   var frame_radius = Math.ceil(this.brush.radius * (1.0 + this.frame_width));
   /* assign brush radii */
   gl.uniform2fv(sh_data.u_radii, [this.brush.radius, frame_radius]);
   /* assign whether to ignore brush type restriction */
   var ignore_ty = (this.brush.type == null) ? 1.0 : 0.0;
   gl.uniform1f(sh_data.u_ignore_ty, ignore_ty);
   /* assign brush depth */
   gl.uniform1f(sh_data.u_depth, this.depth);
   /* assign brush colors */
   gl.uniform4fv(sh_data.u_color_fg, this.colors.foreground);
   gl.uniform4fv(sh_data.u_color_bg, this.colors.background);
   gl.uniform4fv(sh_data.u_color_frame, this.colors.frame);
   /* assign vertex attributes */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_offset);
   gl.vertexAttribPointer(sh_data.a_vrtx_offset, 2, gl.FLOAT, false, 0, 0);
   /* draw brush */
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Deallocate brush rendering resources.
 */
BrushRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete vertex offset buffer */
   gl.deleteBuffer(this.buff_vrtx_offset);
   /* delete pixel containment mask texture */
   gl.deleteTexture(this.tex_px_mask);
   /* delete type mask textures */
   for (type in this.tex_ty_masks)
      gl.deleteTexture(this.tex_ty_masks[type]);
}
