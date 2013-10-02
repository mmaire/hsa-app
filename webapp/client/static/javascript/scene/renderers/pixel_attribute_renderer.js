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
 * Pixel attribute renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Pixel attribute renderer constructor.
 *
 * @class A pixel attribute renderer displays a {@link Region} object on the
 *        canvas within a {@link RenderContext}.  Unlike the simpler
 *        {@link RegionRenderer}, which displays only the area belonging to
 *        the region, a {@link PixelAttributeRenderer} enables visualization
 *        of the per-pixel attributes defined over the {@link Region}.
 *
 * This renderer overlays a visualization of a user-selected subset of the
 * pixel attributes on the image region.
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
function PixelAttributeRenderer(ctxt, reg, tag, tag_img) {
   /* default arguments */
   tag     = (typeof(tag)     != "undefined") ? tag     : Renderer.TAG_DEFAULT;
   tag_img = (typeof(tag_img) != "undefined") ? tag_img : Renderer.TAG_DEFAULT;
   /* store context, source region, and tag */
   this.ctxt = ctxt;
   this.reg  = reg;
   this.tag  = tag;
   /* lookup or created shared image renderer */
   this.img_rndr = Renderer.lookup(this.reg.img, tag_img);
   if (this.img_rndr == null)
      this.img_rndr = new ImgRenderer(ctxt, this.reg.img, tag_img);
   /* set default depth at which to draw region */
   this.depth = 0.0;
   /* set default attribute overlay blending */
   this.blend = 0.5;
   /* set default list of attributes to view to empty */
   this.view_attribs = [];
   /* allocate arrays for view bitmasks */
   this.view_bitmasks = new Array(PixelAttributes.TEXTURES_PER_PIXEL);
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      this.view_bitmasks[t] = new Array(PixelAttributes.BYTES_PER_TEXTURE);
      for (var b = 0; b < PixelAttributes.BYTES_PER_TEXTURE; ++b)
         this.view_bitmasks[t][b] = 0.0;
   }
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
   this.mask     = null;
   this.tex_mask = gl.createTexture();
   /* create attribute masks and textures */
   this.attribs     = new Array(PixelAttributes.TEXTURES_PER_PIXEL);
   this.tex_attribs = new Array(PixelAttributes.TEXTURES_PER_PIXEL);
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      this.attribs[t]     = null;
      this.tex_attribs[t] = gl.createTexture();
   }
   /* update rendering data to reflect region contents */
   this.updateVertices();
   this.updateMask();
   this.updatePixelAttributes();
   /* attach renderer to region and region's pixel attributes */
   Renderer.attach(reg, this, tag);
   if (reg.px_attribs != null)
      Renderer.attach(reg.px_attribs, this, tag);
}

/*****************************************************************************
 * Rendering helper methods.
 *****************************************************************************/

/**
 * Update the rendering data to reflect the region bounding box.
 */
PixelAttributeRenderer.prototype.updateVertices = function() {
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
PixelAttributeRenderer.prototype.updateMask = function() {
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

/**
 * Update the pixel attribute textures used for rendering.
 */
PixelAttributeRenderer.prototype.updatePixelAttributes = function() {
   /* get region bounding box */
   var xmin = this.reg.bbox[0];
   var ymin = this.reg.bbox[1];
   var xlim = this.reg.bbox[2];
   var ylim = this.reg.bbox[3];
   /* compute dimensions of attribute mask covering bounding box */
   var msx  = xlim - xmin;
   var msy  = ylim - ymin;
   var mlen = msx * msy * PixelAttributes.BYTES_PER_TEXTURE;
   /* allocate and initialize pixel attribute masks */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      var attrib_mask = new Uint8Array(mlen);
      for (var n = 0; n < mlen; ++n)
         attrib_mask[n] = 0;
      this.attribs[t] = attrib_mask;
   }
   /* copy attributes into masks */
   if (this.reg.px_attribs != null) {
      var sy = this.reg.img.sizeY();
      for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
         var attrib_mask = this.attribs[t];
         var attrib_data = this.reg.px_attribs.attributes[t];
         for (var n = 0; n < this.reg.pixels.length; ++n) {
            var px_id = this.reg.pixels[n];
            var x = Math.floor(px_id / sy) - xmin;
            var y = (px_id % sy) - ymin;
            var idm = (x*msy + y) * PixelAttributes.BYTES_PER_TEXTURE;
            var pos = n * PixelAttributes.BYTES_PER_TEXTURE;
            for (var b = 0; b < PixelAttributes.BYTES_PER_TEXTURE; ++b)
               attrib_mask[idm + b] = attrib_data[pos + b];
         }
      }
   }
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* bind attribute mask textures */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      gl.bindTexture(gl.TEXTURE_2D, this.tex_attribs[t]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
         gl.TEXTURE_2D, 0, gl.RGBA, msy, msx, 0, gl.RGBA, gl.UNSIGNED_BYTE,
         this.attribs[t]
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   }
}

/**
 * Perform a partial update of the pixel attribute textures used for rendering.
 *
 * Only attribute values are updated.  The size, shape, and location of the
 * region on which the pixel attributes are defined must not have changed.
 *
 * @param {array} ids    list of attribute ids to update
 * @param {array} pixels list of pixels in the region with changed attributes
 *
 * If either argument is missing or null, then all attributes, or all pixels
 * within the region are assumed to require an update.
 */
PixelAttributeRenderer.prototype.updatePixelAttributeValues = function(
   ids, pixels)
{
   /* default arguments */
   ids    = (typeof(ids)    != "undefined") ? ids    : null;
   pixels = (typeof(pixels) != "undefined") ? pixels : null;
   /* flag the subset of attribute textures which require updates */
   var t_flag = new Array(PixelAttributes.TEXTURES_PER_PIXEL);
   if (ids == null) {
      /* no ids specified - assume all attributes require an update */
      for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t)
         t_flag[t] = true;
   } else {
      /* only update attributes in specified set of ids */
      for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t)
         t_flag[t] = false;
      for (var n = 0; n < ids.length; ++n) {
         /* lookup texture location of attribute */
         var id = ids[n];
         var t = PixelAttributes.LABELS[id].texture;
         /* flag texture */
         t_flag[t] = true;
      }
   }
   /* get region bounding box */
   var xmin = this.reg.bbox[0];
   var ymin = this.reg.bbox[1];
   var xlim = this.reg.bbox[2];
   var ylim = this.reg.bbox[3];
   /* compute dimensions of attribute mask covering bounding box */
   var msx = xlim - xmin;
   var msy = ylim - ymin;
   /* get image y-size */
   var sy = this.reg.img.sizeY();
   /* update attribute masks */
   if (this.reg.px_attribs != null) {
      if (pixels == null) {
         /* update attribute mask values for all pixels */
         for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
            if (t_flag[t]) {
               var attrib_mask = this.attribs[t];
               var attrib_data = this.reg.px_attribs.attributes[t];
               for (var n = 0; n < this.reg.pixels.length; ++n) {
                  var px_id = this.reg.pixels[n];
                  var x = Math.floor(px_id / sy) - xmin;
                  var y = (px_id % sy) - ymin;
                  var idm = (x*msy + y) * PixelAttributes.BYTES_PER_TEXTURE;
                  var pos = n * PixelAttributes.BYTES_PER_TEXTURE;
                  for (var b = 0; b < PixelAttributes.BYTES_PER_TEXTURE; ++b)
                     attrib_mask[idm + b] = attrib_data[pos + b];
               }
            }
         }
      } else {
         /* update attribute mask values for specified pixels */
         for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
            if (t_flag[t]) {
               var attrib_mask = this.attribs[t];
               var attrib_data = this.reg.px_attribs.attributes[t];
               for (var n = 0; n < pixels.length; ++n) {
                  var px_index = pixels[n];
                  var px_id = this.reg.pixels[px_index];
                  var x = Math.floor(px_id / sy) - xmin;
                  var y = (px_id % sy) - ymin;
                  var idm = (x*msy + y) * PixelAttributes.BYTES_PER_TEXTURE;
                  var pos = px_index * PixelAttributes.BYTES_PER_TEXTURE;
                  for (var b = 0; b < PixelAttributes.BYTES_PER_TEXTURE; ++b)
                     attrib_mask[idm + b] = attrib_data[pos + b];
               }
            }
         }
      }
   }
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* bind updated attribute mask textures */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      if (t_flag[t]) {
         gl.bindTexture(gl.TEXTURE_2D, this.tex_attribs[t]);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
         gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, msy, msx, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            this.attribs[t]
         );
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
   }
}

/*****************************************************************************
 * Pixel attribute display options.
 *****************************************************************************/

/**
 * Get depth at which to render region.
 *
 * @returns {float} region rendering depth
 */
PixelAttributeRenderer.prototype.getDepth = function() {
   return this.depth;
}

/**
 * Set depth at which to render region.
 *
 * @param {float} depth region rendering depth
 */
PixelAttributeRenderer.prototype.setDepth = function(depth) {
   this.depth = depth;
}

/**
 * Get attribute blending factor.
 *
 * @returns {float} blending factor in range [0, 1]
 */
PixelAttributeRenderer.prototype.getBlend = function() {
   return this.blend;
}

/**
 * Set attribute blending factor.
 *
 * @param {float} blend blending factor in range [0, 1]
 */
PixelAttributeRenderer.prototype.setBlend = function(blend) {
   this.blend = blend;
}

/**
 * Get list of attributes to display.
 *
 * @returns {array} attribute ids
 */
PixelAttributeRenderer.prototype.getViewAttributes = function() {
   return this.view_attribs;
}

/**
 * Set list of attributes to display.
 *
 * @param {array} ids attribute ids
 */
PixelAttributeRenderer.prototype.setViewAttributes = function(ids) {
   /* reset view bitmasks */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      for (var b = 0; b < PixelAttributes.BYTES_PER_TEXTURE; ++b)
         this.view_bitmasks[t][b] = 0.0;
   }
   /* reset attribute view list */
   this.view_attribs = [];
   /* add specified attributes to display */
   this.addViewAttributes(ids);
}

/**
 * Add attributes to the display set.
 *
 * @param {array} ids attribute ids
 */
PixelAttributeRenderer.prototype.addViewAttributes = function(ids) {
   /* turn on bit for each additional attribute to display */
   for (var n = 0; n < ids.length; ++n) {
      /* lookup bit location of attribute */
      var id = ids[n];
      var label_info = PixelAttributes.LABELS[id];
      var t = label_info.texture;
      var b = label_info.offset;
      var m = label_info.mask;
      /* update bitmask */
      var bitmask = Math.round(this.view_bitmasks[t][b] * 255);
      bitmask = bitmask | m;
      this.view_bitmasks[t][b] = bitmask / 255;
   }
   /* update attribute view list */
   this.view_attribs = SetUtil.union(this.view_attribs, ids);
}

/**
 * Remove attributes from the display set.
 *
 * @param {array} ids attribute ids
 */
PixelAttributeRenderer.prototype.removeViewAttributes = function(ids) {
   /* turn off bit for each attribute being removed from display */
   for (var n = 0; n < ids.length; ++n) {
      /* lookup bit location of attribute */
      var id = ids[n];
      var label_info = PixelAttributes.LABELS[id];
      var t = label_info.texture;
      var b = label_info.offset;
      var m = label_info.mask;
      /* update bitmask */
      var bitmask = Math.round(this.view_bitmasks[t][b] * 255);
      bitmask = bitmask & (~m);
      this.view_bitmasks[t][b] = bitmask / 255;
   }
   /* update attribute view list */
   this.view_attribs = SetUtil.setdiff(this.view_attribs, ids);
}

/*****************************************************************************
 * Pixel attribute shader management.
 *****************************************************************************/

/*
 * Attribute vertex and fragment shader script ids within the document source.
 * The document elements marked with these id strings must contain the code for
 * the WebGL shaders for rendering pixel attributes.
 */
PixelAttributeRenderer.VERTEX_SHADER_ID   = "pixel-attribute-vertex-shader";
PixelAttributeRenderer.FRAGMENT_SHADER_ID = "pixel-attribute-fragment-shader";

/*
 * Tag used to identify the attribute shader program within a rendering context.
 */
PixelAttributeRenderer.SHADER_TAG = "pixel-attribute-shader";

/*
 * Attribute color lookup map.
 */
PixelAttributeRenderer.CMAP = null;

/*
 * Attribute bitmask combination map.
 */
PixelAttributeRenderer.BMAP = null;

/**
 * Use the attribute shader program within the specified rendering context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
PixelAttributeRenderer.useShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(PixelAttributeRenderer.SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(PixelAttributeRenderer.SHADER_TAG))) {
         /* get webgl context */
         var gl = ctxt.getGL();
         /* create attribute color and bitmask lookup maps */
         if (PixelAttributeRenderer.CMAP == null)
            PixelAttributeRenderer.CMAP = PixelAttributes.generateColorMap();
         if (PixelAttributeRenderer.BMAP == null)
            PixelAttributeRenderer.BMAP = PixelAttributes.generateBitmaskMap();
         /* create textures for attribute color and bitmask maps */
         var tex_cmap = gl.createTexture();
         var tex_bmap = gl.createTexture();
         /* bind texture for attribute color lookup */
         gl.bindTexture(gl.TEXTURE_2D, tex_cmap);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
         gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, PixelAttributes.BYTES_PER_PIXEL, 256, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, PixelAttributeRenderer.CMAP
         );
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         /* bind texture for attribute bitmask combination */
         gl.bindTexture(gl.TEXTURE_2D, tex_bmap);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
         gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, PixelAttributeRenderer.BMAP
         );
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         /* create shader program */
         var prog = Shader.create(
            ctxt,
            PixelAttributeRenderer.VERTEX_SHADER_ID,
            PixelAttributeRenderer.FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var data = {
            /* attribute color and bitmask lookup textures */
            tex_cmap       : tex_cmap,
            tex_bmap       : tex_bmap,
            /* locations of shader uniforms */
            u_mv_mx        : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx         : gl.getUniformLocation(prog, "u_p_mx"),
            u_img_samp     : gl.getUniformLocation(prog, "u_img_samp"),
            u_mask_samp    : gl.getUniformLocation(prog, "u_mask_samp"),
            u_attrib0_samp : gl.getUniformLocation(prog, "u_attrib0_samp"),
            u_attrib1_samp : gl.getUniformLocation(prog, "u_attrib1_samp"),
            u_attrib2_samp : gl.getUniformLocation(prog, "u_attrib2_samp"),
            u_attrib3_samp : gl.getUniformLocation(prog, "u_attrib3_samp"),
            u_color_samp   : gl.getUniformLocation(prog, "u_color_samp"),
            u_bitmask_samp : gl.getUniformLocation(prog, "u_bitmask_samp"),
            u_bitmask0     : gl.getUniformLocation(prog, "u_bitmask0"),
            u_bitmask1     : gl.getUniformLocation(prog, "u_bitmask1"),
            u_bitmask2     : gl.getUniformLocation(prog, "u_bitmask2"),
            u_bitmask3     : gl.getUniformLocation(prog, "u_bitmask3"),
            u_transparency : gl.getUniformLocation(prog, "u_transparency"),
            u_depth        : gl.getUniformLocation(prog, "u_depth"),
            /* locations of shader attributes */
            a_vrtx_pos     : gl.getAttribLocation(prog, "a_vrtx_pos"),
            a_img_coord    : gl.getAttribLocation(prog, "a_img_coord"),
            a_mask_coord   : gl.getAttribLocation(prog, "a_mask_coord")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            PixelAttributeRenderer.SHADER_TAG,
            prog,
            data,
            PixelAttributeRenderer.updateShader
         );
      }
      /* use shader */
      ctxt.useShader(PixelAttributeRenderer.SHADER_TAG);
   }
}

/**
 * Handle callback events for attribute shader program within rendering context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
PixelAttributeRenderer.updateShader = function(ctxt, prog, data, ev) {
   /* get webgl context */
   var gl = ctxt.getGL();
   /* determine event type */
   if (ev.name == "activate") {
      /* use the shader program */
      gl.useProgram(prog);
      /* setup camera uniforms */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
      /* assign attribute colormap texture */
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, data.tex_cmap);
      gl.uniform1i(data.u_color_samp, 6);
      /* assign attribute bitmask texture */
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, data.tex_bmap);
      gl.uniform1i(data.u_bitmask_samp, 7);
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
 * Pixel attribute rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in region or attributes.
 *
 * @param {Region} obj object (region or attributes) being updated
 * @param {object} ev  event data
 */
PixelAttributeRenderer.prototype.update = function(obj, ev) {
   /* determine source object of update */
   if (obj instanceof Region) {
      /* handle updates to the region */
      if (ev.name == "set-pixels") {
         /* region contents changed - update all rendering data */
         this.updateVertices();
         this.updateMask();
         this.updatePixelAttributes();
      } else if (ev.name == "attach-pixel-attributes") {
         /* listen to future pixel attribute events */
         Renderer.attach(this.reg.px_attribs, this, this.tag);
      } else if (ev.name == "enable-pixel-attributes") {
         /* update pixel attribute rendering */
         this.updatePixelAttributes();
         /* listen to future pixel attribute events */
         Renderer.attach(this.reg.px_attribs, this, this.tag);
      } else if (ev.name == "disable-pixel-attributes") {
         /* update attribute rendering */
         this.updatePixelAttributes();
      }
   } else if (obj instanceof PixelAttributes) {
      /* handle updates to the region's pixel attributes */
      if (ev.name == "set") {
         /* update attribute values for rendering */
         this.updatePixelAttributeValues(ev.ids, ev.pixels);
      }
   }
}

/**
 * Draw pixel attributes.
 */
PixelAttributeRenderer.prototype.draw = function() {
   /* activate shader program */
   PixelAttributeRenderer.useShader(this.ctxt);
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
   /* assign attribute textures */
   gl.activeTexture(gl.TEXTURE2);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_attribs[0]);
   gl.uniform1i(sh_data.u_attrib0_samp, 2);
   gl.activeTexture(gl.TEXTURE3);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_attribs[1]);
   gl.uniform1i(sh_data.u_attrib1_samp, 3);
   gl.activeTexture(gl.TEXTURE4);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_attribs[2]);
   gl.uniform1i(sh_data.u_attrib2_samp, 4);
   gl.activeTexture(gl.TEXTURE5);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_attribs[3]);
   gl.uniform1i(sh_data.u_attrib3_samp, 5);
   /* assign view bitmask */
   gl.uniform4fv(sh_data.u_bitmask0, this.view_bitmasks[0]);
   gl.uniform4fv(sh_data.u_bitmask1, this.view_bitmasks[1]);
   gl.uniform4fv(sh_data.u_bitmask2, this.view_bitmasks[2]);
   gl.uniform4fv(sh_data.u_bitmask3, this.view_bitmasks[3]);
   /* assign transparency */
   gl.uniform1f(sh_data.u_transparency, this.blend);
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
 * Deallocate pixel attribute rendering resources.
 */
PixelAttributeRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete vertex buffers */
   gl.deleteBuffer(this.buff_vrtx_pos);
   gl.deleteBuffer(this.buff_vrtx_img_coord);
   gl.deleteBuffer(this.buff_vrtx_mask_coord);
   /* delete mask texture */
   gl.deleteTexture(this.tex_mask);
   /* delete attribute textures */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t)
      gl.deleteTexture(this.tex_attribs[t]);
}
