/*
 * Copyright (C) 2012-2014 Michael Maire <mmaire@gmail.com>
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
 * Scribble renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Scribble renderer constructor.
 *
 * @class A scribble renderer displays a {@link Scribble} object on the canvas
 *        within a {@link RenderContext}.
 *
 * This renderer overlays a visulation of user markings (negative and positive 
 * brush strokes), hard constraints (forbidden and required areas), and the
 * currently selected area on top of the source image.
 *
 * As a scribble is always associated with an underlying image, it shares the
 * texture rendering resources of the image.  The optional tag_img argument
 * provides the identity of the attached {@link ImgRenderer} to use for these
 * shared resources.  If the {@link ImgData} associated with the region does
 * not have such an attached renderer, then one is created.
 *
 * @constructor
 * @param {RenderContext} ctxt  rendering context
 * @param {Scribble}      scrib scribble to display
 * @param {string}              tag     renderer name (optional)
 * @param {string}              tag_img image renderer name (optional)
 */
function ScribbleRenderer(ctxt, scrib, tag, tag_img) {
   /* default arguments */
   tag     = (typeof(tag)     != "undefined") ? tag     : Renderer.TAG_DEFAULT;
   tag_img = (typeof(tag_img) != "undefined") ? tag_img : Renderer.TAG_DEFAULT;
   /* store context and source scribble */
   this.ctxt  = ctxt;
   this.scrib = scrib;
   /* lookup or created shared image renderer */
   this.img_rndr = Renderer.lookup(this.scrib.img, tag_img);
   if (this.img_rndr == null)
      this.img_rndr = new ImgRenderer(ctxt, this.scrib.img, tag_img);
   /* set default depth at which to draw */
   this.depth = 0.0;
   /* set default colors (alpha channel determines blending with image) */
   this.colors = {
      negative   : [1.0, 0.0, 0.0, 0.8],  /* negative user strokes */
      positive   : [0.0, 1.0, 0.0, 0.8],  /* positive user strokes */
      forbidden  : [0.0, 0.0, 0.0, 0.5],  /* hard negative areas */
      required   : [1.0, 1.0, 1.0, 0.5],  /* hard positive areas */
      background : [0.0, 0.0, 0.0, 0.0],  /* unmarked, not selected */
      foreground : [0.0, 1.0, 0.0, 0.5]   /* inferred selection area */
   }
   /* set default transparency (applies after blending with image) */
   this.alpha = 1.0;                      /* transparency of rendered pixels */
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* create pixel and constraint mask textures */
   this.tex_px   = gl.createTexture();
   this.tex_mask = gl.createTexture();
   /* update pixel and constraint mask textures */
   this.updatePx();
   this.updateMask();
   /* attach scribble renderer to scribble */
   Renderer.attach(scrib, this, tag);
}

/*****************************************************************************
 * Rendering helper methods.
 *****************************************************************************/

/**
 * Update the rendering data to reflect changes to pixel selection status.
 */
ScribbleRenderer.prototype.updatePx = function() {
   /* get image size */
   var sx = this.scrib.img.sizeX();
   var sy = this.scrib.img.sizeY();
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* get byte-wise view of mask data */
   var px = new Uint8Array(this.scrib.px_flags.buffer);
   /* bind mask texture */
   gl.bindTexture(gl.TEXTURE_2D, this.tex_px);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, sy, sx, 0, gl.RGBA, gl.UNSIGNED_BYTE, px
   );
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/**
 * Update the rendering data to reflect changes to the constraint mask.
 */
ScribbleRenderer.prototype.updateMask = function() {
   /* get image size */
   var sx = this.scrib.img.sizeX();
   var sy = this.scrib.img.sizeY();
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* get byte-wise view of mask data */
   var mask = new Uint8Array(this.scrib.mask_flags.buffer);
   /* bind mask texture */
   gl.bindTexture(gl.TEXTURE_2D, this.tex_mask);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, sy, sx, 0, gl.RGBA, gl.UNSIGNED_BYTE, mask
   );
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/*****************************************************************************
 * Scribble display options.
 *****************************************************************************/

/**
 * Get depth at which to render scribble.
 *
 * @returns {float} scribble endering depth
 */
ScribbleRenderer.prototype.getDepth = function() {
   return this.depth;
}

/**
 * Set depth at which to render scribble.
 *
 * @param {float} depth scribble rendering depth
 */
ScribbleRenderer.prototype.setDepth = function(depth) {
   this.depth = depth;
}

/**
 * Get color of the specified pixel status mode within the scribble.
 * Mode must be one of:
 * "negative", "positive", "forbidden", "required", "background", "foreground"
 *
 * @param   {string} mode status mode
 * @returns {array}       color as RGBA tuple with values in range [0, 1]
 */
ScribbleRenderer.prototype.getColor = function(mode) {
   if (mode in this.colors) {
      return this.colors[mode];
   } else {
      throw ("attempt to get color of invalid scribble status mode: " + mode);
   }
}

/**
 * Set color of the specified pixel status mode within the scribble.
 * Mode must be one of:
 * "negative", "positive", "forbidden", "required", "background", "foreground"
 *
 * @param {array}  color color as RGBA tuple with values in range [0, 1]
 * @param {string} mode  status mode
 */
ScribbleRenderer.prototype.setColor = function(color, mode) {
   if (mode in this.colors) {
      /* copy color */
      var c = this.colors[mode];
      c[0] = color[0];
      c[1] = color[1];
      c[2] = color[2];
      c[3] = color[3];
   } else {
      throw ("attempt to set color of invalid scribble status mode: " + mode);
   }
}

/**
 * Get scribble transparency.
 *
 * @returns {float} transparency value in range [0, 1]
 */
ScribbleRenderer.prototype.getAlpha = function() {
   return this.alpha;
}

/**
 * Set scribble transparency.
 *
 * @param {float} alpha transparency value in range [0, 1]
 */
ScribbleRenderer.prototype.setAlpha = function(alpha) {
   this.alpha = alpha;
}

/*****************************************************************************
 * Scribble shader management.
 *****************************************************************************/

/*
 * Scribble vertex and fragment shader script ids within the document source.
 * The document elements marked with these id strings must contain the code for
 * the WebGL shaders for rendering scribbles.
 */
ScribbleRenderer.VERTEX_SHADER_ID   = "scribble-vertex-shader";
ScribbleRenderer.FRAGMENT_SHADER_ID = "scribble-fragment-shader";

/*
 * Tag used to identify the scribble shader program within a rendering context.
 */
ScribbleRenderer.SHADER_TAG = "scribble-shader";

/**
 * Use the scribble shader program within the specified rendering context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
ScribbleRenderer.useShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(ScribbleRenderer.SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(ScribbleRenderer.SHADER_TAG))) {
         /* create shader program */
         var prog = Shader.create(
            ctxt,
            ScribbleRenderer.VERTEX_SHADER_ID,
            ScribbleRenderer.FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var gl = ctxt.getGL();
         var data = {
            /* locations of shader uniforms */
            u_mv_mx         : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx          : gl.getUniformLocation(prog, "u_p_mx"),
            u_img_samp      : gl.getUniformLocation(prog, "u_img_samp"),
            u_px_samp       : gl.getUniformLocation(prog, "u_px_samp"),
            u_mask_samp     : gl.getUniformLocation(prog, "u_mask_samp"),
            u_depth         : gl.getUniformLocation(prog, "u_depth"),
            u_color_neg     : gl.getUniformLocation(prog, "u_color_neg"),
            u_color_pos     : gl.getUniformLocation(prog, "u_color_pos"),
            u_color_hneg    : gl.getUniformLocation(prog, "u_color_hneg"),
            u_color_hpos    : gl.getUniformLocation(prog, "u_color_hpos"),
            u_color_bg      : gl.getUniformLocation(prog, "u_color_bg"),
            u_color_fg      : gl.getUniformLocation(prog, "u_color_fg"),
            u_transparency  : gl.getUniformLocation(prog, "u_transparency"),
            /* locations of shader attributes */
            a_vrtx_pos      : gl.getAttribLocation(prog, "a_vrtx_pos"),
            a_img_coord     : gl.getAttribLocation(prog, "a_img_coord")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            ScribbleRenderer.SHADER_TAG,
            prog,
            data,
            ScribbleRenderer.updateShader
         );
      }
      /* use shader */
      ctxt.useShader(ScribbleRenderer.SHADER_TAG);
   }
}

/**
 * Handle callback events for scribble shader program within rendering context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
ScribbleRenderer.updateShader = function(ctxt, prog, data, ev) {
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
      gl.enableVertexAttribArray(data.a_vrtx_pos);
      gl.enableVertexAttribArray(data.a_img_coord);
   } else if (ev.name == "deactivate") {
      /* disable attributes */
      gl.disableVertexAttribArray(data.a_vrtx_pos);
      gl.disableVertexAttribArray(data.a_img_coord);
   } else if (ev.name == "model-view") {
      /* update model-view uniform */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
   } else if (ev.name == "perspective") {
      /* update persepective uniform */
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
   }
}

/*****************************************************************************
 * Scribble rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in the scribble.
 *
 * @param {Scribble} obj scribble object being updated
 * @param {object}   ev  event data
 */
ScribbleRenderer.prototype.update = function(obj, ev) {
   /* check event type */
   if (ev.name == "update-px") {
      this.updatePx();
   } else if (ev.name == "update-mask") {
      this.updateMask();
   }
}

/**
 * Draw scribble.
 */
ScribbleRenderer.prototype.draw = function() {
   /* activate shader program */
   ScribbleRenderer.useShader(this.ctxt);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* get shader program data */
   var sh_data = this.ctxt.getActiveShader().data;
   /* assign image texture */
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, this.img_rndr.tex_img);
   gl.uniform1i(sh_data.u_img_samp, 0);
   /* assign pixel status texture */
   gl.activeTexture(gl.TEXTURE1);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_px);
   gl.uniform1i(sh_data.u_px_samp, 1);
   /* assign constraint mask texture */
   gl.activeTexture(gl.TEXTURE2);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_mask);
   gl.uniform1i(sh_data.u_mask_samp, 2);
   /* assign depth */
   gl.uniform1f(sh_data.u_depth, this.depth);
   /* assign colors */
   gl.uniform4fv(sh_data.u_color_neg,  this.colors.negative);
   gl.uniform4fv(sh_data.u_color_pos,  this.colors.positive);
   gl.uniform4fv(sh_data.u_color_hneg, this.colors.forbidden);
   gl.uniform4fv(sh_data.u_color_hpos, this.colors.required);
   gl.uniform4fv(sh_data.u_color_bg,   this.colors.background);
   gl.uniform4fv(sh_data.u_color_fg,   this.colors.foreground);
   /* assign transparency */
   gl.uniform1f(sh_data.u_transparency, this.alpha);
   /* assign vertex attributes */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.img_rndr.buff_vrtx_pos);
   gl.vertexAttribPointer(sh_data.a_vrtx_pos, 2, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.img_rndr.buff_vrtx_img_coord);
   gl.vertexAttribPointer(sh_data.a_img_coord, 2, gl.FLOAT, false, 0, 0);
   /* draw scribble */
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Deallocate scribble rendering resources.
 */
ScribbleRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete textures */
   gl.deleteTexture(this.tex_px);
   gl.deleteTexture(this.tex_mask);
}
