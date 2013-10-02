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
 * Region renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Region renderer constructor.
 *
 * @class A region renderer controls the display of a {@link Region}
 *        object on the canvas within a {@link RenderContext}.
 *
 * This renderer blends a user-specified color with the image pixels in the
 * region.  The blending ratio is determined by the color alpha channel.  An
 * additional transparency for the entire fragment may be specified (for 
 * example, to make overlapping region visible).
 *
 * As regions are always associated with an underlying image (either directly
 * or through a segmentation), they share the texture rendering resources of
 * the image.  The optional tag_img argument provides the identity of the
 * attached {@link ImgRenderer} to use for these shared resources.  If the
 * {@link ImgData} associated with the region does not have such an attached
 * renderer, then one is created.
 *
 * @constructor
 * @param {RenderContext} ctxt    rendering context
 * @param {Region}        reg     region to display
 * @param {string}        tag     renderer name (optional)
 * @param {string}        tag_img image renderer name (optional)
 */
function RegionRenderer(ctxt, reg, tag, tag_img) {
   /* default arguments */
   tag     = (typeof(tag)     != "undefined") ? tag     : Renderer.TAG_DEFAULT;
   tag_img = (typeof(tag_img) != "undefined") ? tag_img : Renderer.TAG_DEFAULT;
   /* store context and source region */
   this.ctxt = ctxt;
   this.reg  = reg;
   /* lookup or created shared image renderer */
   this.img_rndr = Renderer.lookup(this.reg.img, tag_img);
   if (this.img_rndr == null)
      this.img_rndr = new ImgRenderer(ctxt, this.reg.img, tag_img);
   /* set default depth at which to draw region */
   this.depth = 0.0;
   /* set default region color and transparency */
   this.color =
      (reg.reg_attribs != null) ?
         ArrUtil.clone(reg.reg_attribs.getColor())
       : [1.0, 0.0, 0.0, 1.0];         /* alpha channel determines blending */
   this.alpha = 1.0;                   /* transparency of rendered fragment */
   /* allocate arrays for bounding box vertex data  */
   this.vrtx_pos        = new Float32Array(8);
   this.vrtx_img_coord  = new Float32Array(8);
   this.vrtx_mask_coord = new Float32Array(8);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* create vertex buffers */
   this.buff_vrtx_pos        = gl.createBuffer();
   this.buff_vrtx_img_coord  = gl.createBuffer();
   this.buff_vrtx_mask_coord = gl.createBuffer();
   /* create pixel visibility mask and texture */
   this.mask = null;
   this.tex_mask = gl.createTexture();
   /* update rendering data to reflect region contents */
   this.updateVertices();
   this.updateMask();
   /* attach region renderer to region */
   Renderer.attach(reg, this, tag);
}

/*****************************************************************************
 * Rendering helper methods.
 *****************************************************************************/

/**
 * Update the rendering data to reflect the region bounding box.
 */
RegionRenderer.prototype.updateVertices = function() {
   /* get image size */
   var sx = this.reg.img.sizeX();
   var sy = this.reg.img.sizeY();
   /* get region bounding box */
   var xmin = this.reg.bbox[0];
   var ymin = this.reg.bbox[1];
   var xlim = this.reg.bbox[2];
   var ylim = this.reg.bbox[3];
   /* set vertex (x,y) position */
   this.vrtx_pos[0] = ymin; this.vrtx_pos[1] = xmin;
   this.vrtx_pos[2] = ymin; this.vrtx_pos[3] = xlim;
   this.vrtx_pos[4] = ylim; this.vrtx_pos[5] = xmin;
   this.vrtx_pos[6] = ylim; this.vrtx_pos[7] = xlim;
   /* set vertex image coordinates */
   var sxm = Math.max(sx,1);
   var sym = Math.max(sy,1);
   this.vrtx_img_coord[0] = ymin/sym; this.vrtx_img_coord[1] = xmin/sxm;
   this.vrtx_img_coord[2] = ymin/sym; this.vrtx_img_coord[3] = xlim/sxm;
   this.vrtx_img_coord[4] = ylim/sym; this.vrtx_img_coord[5] = xmin/sxm;
   this.vrtx_img_coord[6] = ylim/sym; this.vrtx_img_coord[7] = xlim/sxm;
   /* set vertex mask coordinates */
   this.vrtx_mask_coord[0] = 0.0; this.vrtx_mask_coord[1] = 0.0;
   this.vrtx_mask_coord[2] = 0.0; this.vrtx_mask_coord[3] = 1.0;
   this.vrtx_mask_coord[4] = 1.0; this.vrtx_mask_coord[5] = 0.0;
   this.vrtx_mask_coord[6] = 1.0; this.vrtx_mask_coord[7] = 1.0;
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* set vertex buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_pos);
   gl.bufferData(gl.ARRAY_BUFFER, this.vrtx_pos, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_img_coord);
   gl.bufferData(gl.ARRAY_BUFFER, this.vrtx_img_coord, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_mask_coord);
   gl.bufferData(gl.ARRAY_BUFFER, this.vrtx_mask_coord, gl.STATIC_DRAW);
}

/**
 * Update the region pixel visibility mask used for rendering.
 */
RegionRenderer.prototype.updateMask = function() {
   /* get region bounding box */
   var xmin = this.reg.bbox[0];
   var ymin = this.reg.bbox[1];
   var xlim = this.reg.bbox[2];
   var ylim = this.reg.bbox[3];
   /* compute dimensions of mask covering bounding box */
   var msx  = xlim - xmin;
   var msy  = ylim - ymin;
   var mlen = msx * msy * 4;
   /* allocate and initialize pixel visibility mask */
   this.mask = new Uint8Array(mlen);
   for (var n = 0; n < mlen; ++n)
      this.mask[n] = 0;
   /* mark pixels in region as visible */
   var sy = this.reg.img.sizeY();
   for (var n = 0; n < this.reg.pixels.length; ++n) {
      var id = this.reg.pixels[n];
      var x = Math.floor(id / sy) - xmin;
      var y = (id % sy) - ymin;
      this.mask[4*(x*msy + y) + 3] = 255;
   }
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* bind mask texture */
   gl.bindTexture(gl.TEXTURE_2D, this.tex_mask);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, msy, msx, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      this.mask
   );
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/*****************************************************************************
 * Region display options.
 *****************************************************************************/

/**
 * Get depth at which to render region.
 *
 * @returns {float} region rendering depth
 */
RegionRenderer.prototype.getDepth = function() {
   return this.depth;
}

/**
 * Set depth at which to render region.
 *
 * @param {float} depth region rendering depth
 */
RegionRenderer.prototype.setDepth = function(depth) {
   this.depth = depth;
}

/**
 * Get region overlay color.
 *
 * @returns {array} color as RGBA tuple with values in range [0, 1]
 */
RegionRenderer.prototype.getColor = function() {
   return this.color;
}

/**
 * Set region overlay color.
 *
 * @param {array} color color as RGBA tuple with values in range [0, 1]
 */
RegionRenderer.prototype.setColor = function(color) {
   this.color[0] = color[0];
   this.color[1] = color[1];
   this.color[2] = color[2];
   this.color[3] = color[3];
}

/**
 * Get region transparency.
 *
 * @returns {float} transparency value in range [0, 1]
 */
RegionRenderer.prototype.getAlpha = function() {
   return this.alpha;
}

/**
 * Set region transparency.
 *
 * @param {float} alpha transparency value in range [0, 1]
 */
RegionRenderer.prototype.setAlpha = function(alpha) {
   this.alpha = alpha;
}

/*****************************************************************************
 * Region shader management.
 *****************************************************************************/

/*
 * Region vertex and fragment shader script ids within the html document source.
 * The document elements marked with these id strings must contain the code for
 * the WebGL shaders for rendering regions.
 */
RegionRenderer.VERTEX_SHADER_ID   = "region-vertex-shader";
RegionRenderer.FRAGMENT_SHADER_ID = "region-fragment-shader";

/*
 * Tag used to identify the region shader program within a rendering context.
 */
RegionRenderer.SHADER_TAG = "region-shader";

/**
 * Use the region shader program within the specified rendering context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
RegionRenderer.useShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(RegionRenderer.SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(RegionRenderer.SHADER_TAG))) {
         /* create shader program */
         var prog = Shader.create(
            ctxt,
            RegionRenderer.VERTEX_SHADER_ID,
            RegionRenderer.FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var gl = ctxt.getGL();
         var data = {
            /* locations of shader uniforms */
            u_mv_mx        : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx         : gl.getUniformLocation(prog, "u_p_mx"),
            u_img_samp     : gl.getUniformLocation(prog, "u_img_samp"),
            u_mask_samp    : gl.getUniformLocation(prog, "u_mask_samp"),
            u_color        : gl.getUniformLocation(prog, "u_color"),
            u_transparency : gl.getUniformLocation(prog, "u_transparency"),
            u_depth        : gl.getUniformLocation(prog, "u_depth"),
            /* locations of shader attributes */
            a_vrtx_pos     : gl.getAttribLocation(prog, "a_vrtx_pos"),
            a_img_coord    : gl.getAttribLocation(prog, "a_img_coord"),
            a_mask_coord   : gl.getAttribLocation(prog, "a_mask_coord")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            RegionRenderer.SHADER_TAG, prog, data, RegionRenderer.updateShader
         );
      }
      /* use shader */
      ctxt.useShader(RegionRenderer.SHADER_TAG);
   }
}

/**
 * Handle callback events for region shader program within rendering context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
RegionRenderer.updateShader = function(ctxt, prog, data, ev) {
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
      gl.enableVertexAttribArray(data.a_mask_coord);
   } else if (ev.name == "deactivate") {
      /* disable attributes */
      gl.disableVertexAttribArray(data.a_vrtx_pos);
      gl.disableVertexAttribArray(data.a_img_coord);
      gl.disableVertexAttribArray(data.a_mask_coord);
   } else if (ev.name == "model-view") {
      /* update model-view uniform */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
   } else if (ev.name == "perspective") {
      /* update persepective uniform */
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
   }
}

/*****************************************************************************
 * Region rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in region.
 *
 * @param {Region} obj region object being updated
 * @param {object} ev  event data
 */
RegionRenderer.prototype.update = function(obj, ev) {
   /* determine event type */
   if (ev.name == "set-pixels") {
      /* update bounding box vertices and region mask */
      this.updateVertices();
      this.updateMask();
   }
}

/**
 * Draw region.
 */
RegionRenderer.prototype.draw = function() {
   /* activate shader program */
   RegionRenderer.useShader(this.ctxt);
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
   /* assign color and transparency */
   gl.uniform4fv(sh_data.u_color, this.color);
   gl.uniform1f(sh_data.u_transparency, this.alpha);
   /* assign depth */
   gl.uniform1f(sh_data.u_depth, this.depth);
   /* assign vertex attributes */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_pos);
   gl.vertexAttribPointer(sh_data.a_vrtx_pos, 2, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_img_coord);
   gl.vertexAttribPointer(sh_data.a_img_coord, 2, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_mask_coord);
   gl.vertexAttribPointer(sh_data.a_mask_coord, 2, gl.FLOAT, false, 0, 0);
   /* draw region */
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Deallocate region rendering resources.
 */
RegionRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete vertex buffers */
   gl.deleteBuffer(this.buff_vrtx_pos);
   gl.deleteBuffer(this.buff_vrtx_img_coord);
   gl.deleteBuffer(this.buff_vrtx_mask_coord);
   /* delete mask texture */
   gl.deleteTexture(this.tex_mask);
}
