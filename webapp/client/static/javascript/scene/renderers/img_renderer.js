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
 * Image renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Image renderer constructor.
 *
 * @class An image renderer controls the display of an {@link ImgData} object
 *        on the canvas within a {@link RenderContext}.
 *
 * The image is rendered in the xy-plane at a specified z-depth.
 *
 * An alpha value in [0,1] controls the transparency of the displayed image.
 * An user-specified color may optionally be blended with the image prior to
 * display.
 *
 * @constructor
 * @param {RenderContext} ctxt rendering context
 * @param {ImgData}       img  image to display
 * @param {string}        tag  renderer name (optional)
 */
ImgRenderer = function(ctxt, img, tag) {
   /* default arguments */
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   /* store context and source image */
   this.ctxt = ctxt;
   this.img  = img;
   /* set default depth at which to draw image */
   this.depth = 0.0;
   /* set default image color and transparency */
   this.color = [0.0, 0.0, 0.0, 0.0];  /* alpha channel determines blending */
   this.alpha = 1.0;                   /* transparency of rendered image */
   /* get image size */
   var sx = img.sizeX();
   var sy = img.sizeY();
   /* create arrays for bounding box vertex data */
   this.vrtx_pos       = new Float32Array([0, 0, 0, sx, sy, 0, sy, sx]);
   this.vrtx_img_coord = new Float32Array([0, 0, 0,  1,  1, 0,  1,  1]);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* create vertex buffers */
   this.buff_vrtx_pos       = gl.createBuffer();
   this.buff_vrtx_img_coord = gl.createBuffer();
   /* set vertex buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_pos);
   gl.bufferData(gl.ARRAY_BUFFER, this.vrtx_pos, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_img_coord);
   gl.bufferData(gl.ARRAY_BUFFER, this.vrtx_img_coord, gl.STATIC_DRAW);
   /* create image texture */
   this.tex_img = gl.createTexture();
   /* bind image texture */
   gl.bindTexture(gl.TEXTURE_2D, this.tex_img);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img.data()
   );
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   /* attach renderer to image */
   Renderer.attach(img, this, tag);
}

/*****************************************************************************
 * Image display options.
 *****************************************************************************/

/**
 * Get depth at which to render image.
 *
 * @returns {float} image rendering depth
 */
ImgRenderer.prototype.getDepth = function() {
   return this.depth;
}

/**
 * Set depth at which to render image.
 *
 * @param {float} depth image rendering depth
 */
ImgRenderer.prototype.setDepth = function(depth) {
   this.depth = depth;
}

/**
 * Get image overlay color.
 *
 * @returns {array} overlay color as RGBA tuple with values in range [0, 1]
 */
ImgRenderer.prototype.getColor = function() {
   return this.color;
}

/**
 * Set image overlay color.
 *
 * @param {array} color overlay color as RGBA tuple with values in range [0, 1]
 */
ImgRenderer.prototype.setColor = function(color) {
   /* copy color */
   this.color[0] = color[0];
   this.color[1] = color[1];
   this.color[2] = color[2];
   this.color[3] = color[3];
}

/**
 * Get image transparency.
 *
 * @returns {float} transparency value in range [0, 1]
 */
ImgRenderer.prototype.getAlpha = function() {
   return this.alpha;
}

/**
 * Set image transparency.
 *
 * @param {float} alpha transparency value in range [0, 1]
 */
ImgRenderer.prototype.setAlpha = function(alpha) {
   this.alpha = alpha;
}

/*****************************************************************************
 * Image shader management.
 *****************************************************************************/

/*
 * Image vertex and fragment shader script ids within the html document source.
 * The document elements marked with these id strings must contain the code for
 * the WebGL shaders for rendering images.
 */
ImgRenderer.VERTEX_SHADER_ID   = "img-vertex-shader";
ImgRenderer.FRAGMENT_SHADER_ID = "img-fragment-shader";

/*
 * Tag used to identify the image shader program within a rendering context.
 */
ImgRenderer.SHADER_TAG = "img-shader";

/**
 * Use the image shader program within the specified rendering context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
ImgRenderer.useShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(ImgRenderer.SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(ImgRenderer.SHADER_TAG))) {
         /* create shader program */
         var prog = Shader.create(
            ctxt, ImgRenderer.VERTEX_SHADER_ID, ImgRenderer.FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var gl = ctxt.getGL();
         var data = {
            /* locations of shader uniforms */
            u_mv_mx        : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx         : gl.getUniformLocation(prog, "u_p_mx"),
            u_img_samp     : gl.getUniformLocation(prog, "u_img_samp"),
            u_depth        : gl.getUniformLocation(prog, "u_depth"),
            u_color        : gl.getUniformLocation(prog, "u_color"),
            u_transparency : gl.getUniformLocation(prog, "u_transparency"),
            /* locations of shader attributes */
            a_vrtx_pos     : gl.getAttribLocation(prog, "a_vrtx_pos"),
            a_img_coord    : gl.getAttribLocation(prog, "a_img_coord")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            ImgRenderer.SHADER_TAG, prog, data, ImgRenderer.updateShader
         );
      }
      /* use shader */
      ctxt.useShader(ImgRenderer.SHADER_TAG);
   }
}

/**
 * Handle callback events for image shader program within rendering context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
ImgRenderer.updateShader = function(ctxt, prog, data, ev) {
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
 * Image rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in image.
 *
 * @param {ImgData} obj image object being updated
 * @param {object}  ev  event data
 */
ImgRenderer.prototype.update = function(obj, ev) {
   /* do nothing - no update events for images are currently in use */
}

/**
 * Draw image.
 */
ImgRenderer.prototype.draw = function() {
   /* activate shader program */
   ImgRenderer.useShader(this.ctxt);
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* get shader program data */
   var sh_data = this.ctxt.getActiveShader().data;
   /* assign image texture */
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, this.tex_img);
   gl.uniform1i(sh_data.u_img_samp, 0);
   /* assign image depth */
   gl.uniform1f(sh_data.u_depth, this.depth);
   /* assign color and transparency */
   gl.uniform4fv(sh_data.u_color, this.color);
   gl.uniform1f(sh_data.u_transparency, this.alpha);
   /* assign vertex attributes */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_pos);
   gl.vertexAttribPointer(sh_data.a_vrtx_pos, 2, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_vrtx_img_coord);
   gl.vertexAttribPointer(sh_data.a_img_coord, 2, gl.FLOAT, false, 0, 0);
   /* draw region */
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Deallocate image rendering resources.
 */
ImgRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete vertex buffers */
   gl.deleteBuffer(this.buff_vrtx_pos);
   gl.deleteBuffer(this.buff_vrtx_img_coord);
   /* delete image texture */
   gl.deleteTexture(this.tex_img);
}
