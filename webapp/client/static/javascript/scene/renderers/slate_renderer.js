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
 * Slate renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Slate renderer constructor.
 *
 * @class A slate renderer displays a {@link Slate} object on the canvas within
 *        a {@link RenderContext}.
 *
 * This renderer overlays a visulation of the slate's selection state (allowed
 * selection area, required selection area, and currently selected pixels) on
 * the source image.
 *
 * As a slate is always associated with an underlying image, it shares the
 * texture rendering resources of the image.  The optional tag_img argument
 * provides the identity of the attached {@link ImgRenderer} to use for these
 * shared resources.  If the {@link ImgData} associated with the region does
 * not have such an attached renderer, then one is created.
 *
 * @constructor
 * @param {RenderContext} ctxt rendering context
 * @param {Slate}         slt  slate to display
 * @param {string}             tag     renderer name (optional)
 * @param {string}             tag_img image renderer name (optional)
 */
function SlateRenderer(ctxt, slt, tag, tag_img) {
   /* default arguments */
   tag     = (typeof(tag)     != "undefined") ? tag     : Renderer.TAG_DEFAULT;
   tag_img = (typeof(tag_img) != "undefined") ? tag_img : Renderer.TAG_DEFAULT;
   /* store context and source slate */
   this.ctxt = ctxt;
   this.slt  = slt;
   /* lookup or created shared image renderer */
   this.img_rndr = Renderer.lookup(this.slt.img, tag_img);
   if (this.img_rndr == null)
      this.img_rndr = new ImgRenderer(ctxt, this.slt.img, tag_img);
   /* set default depth at which to draw */
   this.depth = 0.0;
   /* set default colors (alpha channel determines blending with image) */
   this.colors = {
      selected  : [0.0, 1.0, 0.0, 0.5],   /* area selected by user */
      required  : [1.0, 1.0, 1.0, 0.5],   /* area that must be selected */
      forbidden : [0.0, 0.0, 0.0, 0.5],   /* unallowed area of image */
      normal    : [0.0, 0.0, 0.0, 0.0]    /* none of the above */
   }
   /* set default transparency (applies after blending with image) */
   this.alpha = 1.0;                      /* transparency of rendered pixels */
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* create selection mask texture */
   this.tex_mask = gl.createTexture();
   this.updateMask();
   /* attach slate renderer to slate */
   Renderer.attach(slt, this, tag);
}

/*****************************************************************************
 * Rendering helper methods.
 *****************************************************************************/

/**
 * Update the rendering data to reflect changes to the selection mask.
 */
SlateRenderer.prototype.updateMask = function() {
   /* get image size */
   var sx = this.slt.img.sizeX();
   var sy = this.slt.img.sizeY();
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* get byte-wise view of mask data */
   var mask = new Uint8Array(this.slt.mask.buffer);
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
 * Slate display options.
 *****************************************************************************/

/**
 * Get depth at which to render slate.
 *
 * @returns {float} slate rendering depth
 */
SlateRenderer.prototype.getDepth = function() {
   return this.depth;
}

/**
 * Set depth at which to render slate.
 *
 * @param {float} depth slate rendering depth
 */
SlateRenderer.prototype.setDepth = function(depth) {
   this.depth = depth;
}

/**
 * Get color of the specified pixel selection mode within the slate.
 * If no mode is specified, return the color of selected pixels.
 *
 * @param   {string} mode mode ("selected", "required", "forbidden", "normal")
 * @returns {array}       color as RGBA tuple with values in range [0, 1]
 */
SlateRenderer.prototype.getColor = function(mode) {
   /* default arguments */
   mode = (typeof(mode) != "undefined") ? mode : "selected";
   /* get mode color */
   if (mode in this.colors) {
      return this.colors[mode];
   } else {
      throw ("attempt to get color of invalid slate selection mode: " + mode);
   }
}

/**
 * Set color of the specified pixel selection mode within the slate.
 * If no mode is specified, set the color of selected pixels.
 *
 * @param {array}  color color as RGBA tuple with values in range [0, 1]
 * @param {string} mode  mode ("selected", "required", "forbidden", "normal")
 */
SlateRenderer.prototype.setColor = function(color, mode) {
   /* default arguments */
   mode = (typeof(mode) != "undefined") ? mode : "selected";
   /* set mode color */
   if (mode in this.colors) {
      /* copy color */
      var c = this.colors[mode];
      c[0] = color[0];
      c[1] = color[1];
      c[2] = color[2];
      c[3] = color[3];
   } else {
      throw ("attempt to set color of invalid slate selection mode: " + mode);
   }
}

/**
 * Get slate transparency.
 *
 * @returns {float} transparency value in range [0, 1]
 */
SlateRenderer.prototype.getAlpha = function() {
   return this.alpha;
}

/**
 * Set slate transparency.
 *
 * @param {float} alpha transparency value in range [0, 1]
 */
SlateRenderer.prototype.setAlpha = function(alpha) {
   this.alpha = alpha;
}

/*****************************************************************************
 * Slate shader management.
 *****************************************************************************/

/*
 * Slate vertex and fragment shader script ids within the html document source.
 * The document elements marked with these id strings must contain the code for
 * the WebGL shaders for rendering slates.
 */
SlateRenderer.VERTEX_SHADER_ID   = "slate-vertex-shader";
SlateRenderer.FRAGMENT_SHADER_ID = "slate-fragment-shader";

/*
 * Tag used to identify the slate shader program within a rendering context.
 */
SlateRenderer.SHADER_TAG = "slate-shader";

/**
 * Use the slate shader program within the specified rendering context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
SlateRenderer.useShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(SlateRenderer.SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(SlateRenderer.SHADER_TAG))) {
         /* create shader program */
         var prog = Shader.create(
            ctxt,
            SlateRenderer.VERTEX_SHADER_ID,
            SlateRenderer.FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var gl = ctxt.getGL();
         var data = {
            /* locations of shader uniforms */
            u_mv_mx         : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx          : gl.getUniformLocation(prog, "u_p_mx"),
            u_img_samp      : gl.getUniformLocation(prog, "u_img_samp"),
            u_mask_samp     : gl.getUniformLocation(prog, "u_mask_samp"),
            u_depth         : gl.getUniformLocation(prog, "u_depth"),
            u_color_select  : gl.getUniformLocation(prog, "u_color_select"),
            u_color_require : gl.getUniformLocation(prog, "u_color_require"),
            u_color_forbid  : gl.getUniformLocation(prog, "u_color_forbid"),
            u_color_normal  : gl.getUniformLocation(prog, "u_color_normal"),
            u_transparency  : gl.getUniformLocation(prog, "u_transparency"),
            /* locations of shader attributes */
            a_vrtx_pos      : gl.getAttribLocation(prog, "a_vrtx_pos"),
            a_img_coord     : gl.getAttribLocation(prog, "a_img_coord")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            SlateRenderer.SHADER_TAG, prog, data, SlateRenderer.updateShader
         );
      }
      /* use shader */
      ctxt.useShader(SlateRenderer.SHADER_TAG);
   }
}

/**
 * Handle callback events for slate shader program within rendering context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
SlateRenderer.updateShader = function(ctxt, prog, data, ev) {
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
 * Slate rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in slate.
 *
 * @param {Slate}  obj slate object being updated
 * @param {object} ev  event data
 */
SlateRenderer.prototype.update = function(obj, ev) {
   /* check event type */
   if ((ev.name == "clear") ||
       (ev.name == "set-allowed") ||
       (ev.name == "set-required") ||
       (ev.name == "pixel-select"))
   { this.updateMask(); }
}

/**
 * Draw slate.
 */
SlateRenderer.prototype.draw = function() {
   /* activate shader program */
   SlateRenderer.useShader(this.ctxt);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* get shader program data */
   var sh_data = this.ctxt.getActiveShader().data;
   /* assign image texture */
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, this.img_rndr.tex_img);
   gl.uniform1i(sh_data.u_img_samp, 0);
   /* assign mask texture */
   gl.activeTexture(gl.TEXTURE1);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_mask);
   gl.uniform1i(sh_data.u_mask_samp, 1);
   /* assign depth */
   gl.uniform1f(sh_data.u_depth, this.depth);
   /* assign colors */
   gl.uniform4fv(sh_data.u_color_select,  this.colors.selected);
   gl.uniform4fv(sh_data.u_color_require, this.colors.required);
   gl.uniform4fv(sh_data.u_color_forbid,  this.colors.forbidden);
   gl.uniform4fv(sh_data.u_color_normal,  this.colors.normal);
   /* assign transparency */
   gl.uniform1f(sh_data.u_transparency, this.alpha);
   /* assign vertex attributes */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.img_rndr.buff_vrtx_pos);
   gl.vertexAttribPointer(sh_data.a_vrtx_pos, 2, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.img_rndr.buff_vrtx_img_coord);
   gl.vertexAttribPointer(sh_data.a_img_coord, 2, gl.FLOAT, false, 0, 0);
   /* draw slate */
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Deallocate slate rendering resources.
 */
SlateRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete mask texture */
   gl.deleteTexture(this.tex_mask);
}
