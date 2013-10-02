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
 * Polygon renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Polygon renderer constructor.
 *
 * @class A polygon renderer controls the display of a {@link Polygon}
 *        object on the canvas within a {@link RenderContext}.
 *
 * This renderer draws polygon vertices and edges.  The user may specify one
 * color to apply to all vertices and another color to apply to all edges.
 * Alternatively, the user man specify vertex and edge colormaps, causing
 * vertices and edges to be colored according to their respective numeric
 * labels.
 *
 * @constructor
 * @param {RenderContext} ctxt rendering context
 * @param {Polygon}       poly polygon to display
 * @param {string}        tag  renderer name (optional)
 */
function PolygonRenderer(ctxt, poly, tag) {
   /* default arguments */
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   /* store context and source polygon */
   this.ctxt = ctxt;
   this.poly = poly;
   /* set default depth at which to draw polygon */
   this.depth = 0.0;
   /* set default rendering sizes */
   this.point_size = 1.0;                  /* size of drawn polygon vertices */
   this.line_size  = 1.0;                  /* width of drawn polygon edges */
   /* initialize vertex and edge coloring */
   this.v_color = [1.0, 0.0, 0.0, 1.0];    /* vertex color (default: red) */
   this.e_color = [1.0, 0.0, 0.0, 1.0];    /* edge color   (default: red) */
   this.v_cmap_rndr = null;                /* vertex colormap renderer */
   this.e_cmap_rndr = null;                /* edge colormap renderer */
   /* initialize edge rendering data */
   this.e_xs     = null;                   /* duplicated edge x-coordinates */
   this.e_ys     = null;                   /* duplicated edge y-coordinates */
   this.e_labels = null;                   /* duplicated edge labels */
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* initialize vertex data buffers */
   this.buff_v_xs     = gl.createBuffer(); /* vertex x-coordinate buffer */
   this.buff_v_ys     = gl.createBuffer(); /* vertex y-coordinate buffer */
   this.buff_v_labels = gl.createBuffer(); /* vertex label buffer */
   /* initialize edge data buffers */
   this.buff_e_xs     = gl.createBuffer(); /* edge x-coordinate buffer */
   this.buff_e_ys     = gl.createBuffer(); /* egde y-coordinate buffer */
   this.buff_e_labels = gl.createBuffer(); /* edge label buffer */
   /* initialize rendering data to reflect polygon contents */
   this.init();
   /* attach polygon renderer to polygon */
   Renderer.attach(poly, this, tag);
}

/*****************************************************************************
 * Rendering helper methods.
 *****************************************************************************/

/**
 * Initialize data for rendering polygon.
 */
PolygonRenderer.prototype.init = function() {
   /* allocate edge coordinate and label arrays */
   var n_points = this.poly.size();
   this.e_xs     = new Float32Array(2*n_points);
   this.e_ys     = new Float32Array(2*n_points);
   this.e_labels = new Float32Array(2*n_points);
   /* copy edge coordinates by duplicating vertex coordinates */
   for (var n = 1; n < n_points; ++n) {
      /* get point */
      var x = this.poly.xs[n];
      var y = this.poly.ys[n];
      /* store end of previous edge */
      this.e_xs[2*n - 1] = x;
      this.e_ys[2*n - 1] = y;
      /* store start of current edge */
      this.e_xs[2*n] = x;
      this.e_ys[2*n] = y;
      /* get label */
      var lbl = this.poly.e_labels[n];
      /* store label of current edge */
      this.e_labels[2*n]     = lbl;
      this.e_labels[2*n + 1] = lbl;
   }
   /* handle wrap-around for last polygon edge */
   if (n_points > 0) {
      /* get first point in polygon */
      var x = this.poly.xs[0];
      var y = this.poly.ys[0];
      /* store start of first edge */
      this.e_xs[0] = x;
      this.e_ys[0] = y;
      /* store end of last edge */
      this.e_xs[2*n_points - 1] = x;
      this.e_ys[2*n_points - 1] = y;
      /* get label */
      var lbl = this.poly.e_labels[0];
      /* store label of first edge */
      this.e_labels[0] = lbl;
      this.e_labels[1] = lbl;
   }
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* set vertex coordinate buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_xs);
   gl.bufferData(gl.ARRAY_BUFFER, this.poly.xs, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_ys);
   gl.bufferData(gl.ARRAY_BUFFER, this.poly.ys, gl.STATIC_DRAW);
   /* set vertex label buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_labels);
   gl.bufferData(gl.ARRAY_BUFFER, this.poly.v_labels, gl.STATIC_DRAW);
   /* set edge coordinate buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_xs);
   gl.bufferData(gl.ARRAY_BUFFER, this.e_xs, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_ys);
   gl.bufferData(gl.ARRAY_BUFFER, this.e_ys, gl.STATIC_DRAW);
   /* set edge label buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_labels);
   gl.bufferData(gl.ARRAY_BUFFER, this.e_labels, gl.STATIC_DRAW);
}

/**
 * Update rendering data to reflect changes to position of the given vertices.
 *
 * @param {array} vs vertex ids
 */
PolygonRenderer.prototype.updateCoords = function(vs) {
   /* get number of points in polygon */
   var n_points = this.poly.size();
   /* update corresponding edge coordinates */
   for (var n = 0; n < vs.length; ++n) {
      /* get vertex id */
      var v = vs[n];
      /* get point */
      var x = this.poly.xs[v];
      var y = this.poly.ys[v];
      /* update edges touching vertex */
      if (v == 0) {
         /* handle special case of first vertex */
         this.e_xs[0] = x;
         this.e_ys[0] = y;
         this.e_xs[2*n_points - 1] = x;
         this.e_ys[2*n_points - 1] = y;
      } else {
         /* update edges surrounding vertex */
         this.e_xs[2*v - 1] = x;
         this.e_ys[2*v - 1] = y;
         this.e_xs[2*v] = x;
         this.e_ys[2*v] = y;
      }
   }
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* set vertex coordinate buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_xs);
   gl.bufferData(gl.ARRAY_BUFFER, this.poly.xs, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_ys);
   gl.bufferData(gl.ARRAY_BUFFER, this.poly.ys, gl.STATIC_DRAW);
   /* set edge coordinate buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_xs);
   gl.bufferData(gl.ARRAY_BUFFER, this.e_xs, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_ys);
   gl.bufferData(gl.ARRAY_BUFFER, this.e_ys, gl.STATIC_DRAW);
}

/**
 * Update rendering data to reflect changes to labels of the given vertices.
 *
 * @param {array} vs vertex ids
 */
PolygonRenderer.prototype.updateVertexLabels = function(vs) {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* vertex data used directly from polygon - just update buffers */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_labels);
   gl.bufferData(gl.ARRAY_BUFFER, this.poly.v_labels, gl.STATIC_DRAW);
}

/**
 * Update rendering data to reflect changes to labels of the given edges.
 *
 * @param {array} es edge ids
 */
PolygonRenderer.prototype.updateEdgeLabels = function(es) {
   /* get number of points in polygon */
   var n_points = this.poly.size();
   /* update corresponding edge labels */
   for (var n = 0; n < es.length; ++n) {
      /* get edge id */
      var e = es[n];
      /* get label */
      var lbl = this.poly.e_labels[e];
      /* update edge */
      this.e_labels[2*e]     = lbl;
      this.e_labels[2*e + 1] = lbl;
   }
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* set edge label buffer data */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_labels);
   gl.bufferData(gl.ARRAY_BUFFER, this.e_labels, gl.STATIC_DRAW);
}

/*****************************************************************************
 * Polygon display options.
 *****************************************************************************/

/**
 * Get depth at which to render polygon.
 *
 * @returns {float} polygon rendering depth
 */
PolygonRenderer.prototype.getDepth = function() {
   return this.depth;
}

/**
 * Set depth at which to render polygon.
 *
 * @param {float} depth polygon rendering depth
 */
PolygonRenderer.prototype.setDepth = function(depth) {
   this.depth = depth;
}

/**
 * Get size at which polygon vertices are drawn.
 *
 * @returns {float} point size
 */
PolygonRenderer.prototype.getPointSize = function() {
   return this.point_size;
}

/**
 * Set size at which to draw polygon vertices.
 *
 * @param {float} size point size
 */
PolygonRenderer.prototype.setPointSize = function(size) {
   this.point_size = size;
}

/**
 * Get width at which polygon edges are drawn.
 *
 * @returns {float} line width
 */
PolygonRenderer.prototype.getLineWidth = function() {
   return this.line_size;
}

/**
 * Set width at which to draw polygon edges.
 *
 * @param {float} width line width
 */
PolygonRenderer.prototype.setLineWidth = function(width) {
   this.line_size = width;
}

/*****************************************************************************
 * Polygon coloring options.
 *****************************************************************************/

/**
 * Set default color of all polygon vertices (can be overridden by colormap).
 *
 * @param {array} color color as RGBA tuple with values in range [0, 1]
 */
PolygonRenderer.prototype.setVertexColor = function(color) {
   this.v_color[0] = color[0];
   this.v_color[1] = color[1];
   this.v_color[2] = color[2];
   this.v_color[3] = color[3];
}

/**
 * Set default color of all polygon edges (can be overridden by colormap).
 *
 * @param {array} color color as RGBA tuple with values in range [0, 1]
 */
PolygonRenderer.prototype.setEdgeColor = function(color) {
   this.e_color[0] = color[0];
   this.e_color[1] = color[1];
   this.e_color[2] = color[2];
   this.e_color[3] = color[3];
}

/**
 * Set colormap to use for coloring polygon vertices.
 * The vertex label is used as an index into this colormap.
 *
 * @param {Colormap} cmap colormap (null to disable and use default color)
 * @param {string}   tag  colormap renderer name (optional)
 */
PolygonRenderer.prototype.setVertexColorMap = function(cmap, tag) {
   /* default arguments */
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   /* check if disabling colormap */
   if (cmap == null) {
      /* disable per-vertex colormap */
      this.v_cmap_rndr = null;
   } else {
      /* lookup or create shared colormap renderer */
      this.v_cmap_rndr = Renderer.lookup(cmap, tag);
      if (this.v_cmap_rndr == null)
         this.v_cmap_rndr = new ColormapRenderer(this.ctxt, cmap, tag);
   }
}

/**
 * Set colormap to use for coloring polygon edges.
 * The edge label is used as an index into this colormap.
 *
 * @param {Colormap} cmap colormap (null to disable and use default color)
 * @param {string}   tag  colormap renderer name (optional)
 */
PolygonRenderer.prototype.setEdgeColorMap = function(cmap, tag) {
   /* default arguments */
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   /* check if disabling colormap */
   if (cmap == null) {
      /* disable per-vertex colormap */
      this.e_cmap_rndr = null;
   } else {
      /* lookup or create shared colormap renderer */
      this.e_cmap_rndr = Renderer.lookup(cmap, tag);
      if (this.e_cmap_rndr == null)
         this.e_cmap_rndr = new ColormapRenderer(this.ctxt, cmap, tag);
   }
}

/*****************************************************************************
 * Polygon shader management.
 *****************************************************************************/

/*
 * Polygon vertex and fragment shader script ids within the document source.
 * The document elements marked with these id strings must contain the code for
 * the WebGL shaders for rendering polygons.
 */
PolygonRenderer.VERTEX_SHADER_ID        = "polygon-vertex-shader";
PolygonRenderer.FRAGMENT_SHADER_ID      = "polygon-fragment-shader";
PolygonRenderer.CMAP_VERTEX_SHADER_ID   = "polygon-colormap-vertex-shader";
PolygonRenderer.CMAP_FRAGMENT_SHADER_ID = "polygon-colormap-fragment-shader";

/*
 * Tag used to identify the polygon shader programs within a rendering context.
 */
PolygonRenderer.SHADER_TAG      = "polygon-shader";
PolygonRenderer.CMAP_SHADER_TAG = "polygon-colormap-shader";

/**
 * Use the polygon shader program within the specified rendering context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
PolygonRenderer.useShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(PolygonRenderer.SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(PolygonRenderer.SHADER_TAG))) {
         /* get webgl context */
         var gl = ctxt.getGL();
         /* create shader program */
         var prog = Shader.create(
            ctxt,
            PolygonRenderer.VERTEX_SHADER_ID,
            PolygonRenderer.FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var data = {
            /* locations of shader uniforms */
            u_mv_mx        : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx         : gl.getUniformLocation(prog, "u_p_mx"),
            u_color        : gl.getUniformLocation(prog, "u_color"),
            u_depth        : gl.getUniformLocation(prog, "u_depth"),
            u_point_size   : gl.getUniformLocation(prog, "u_point_size"),
            /* locations of shader attributes */
            a_vrtx_x       : gl.getAttribLocation(prog, "a_vrtx_x"),
            a_vrtx_y       : gl.getAttribLocation(prog, "a_vrtx_y")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            PolygonRenderer.SHADER_TAG,
            prog,
            data,
            PolygonRenderer.updateShader
         );
      }
      /* use shader */
      ctxt.useShader(PolygonRenderer.SHADER_TAG);
   }
}

/**
 * Use the polygon colormap shader program within the specified rendering
 * context.
 *
 * If the rendering context does not already contain the required shader
 * program, create it and add it to the context.
 *
 * @param {RenderContext} ctxt rendering context
 */
PolygonRenderer.useColormapShader = function(ctxt) {
   if (!(ctxt.hasActiveShader(PolygonRenderer.CMAP_SHADER_TAG))) {
      /* create required shader if it does not exist within context */
      if (!(ctxt.hasShader(PolygonRenderer.CMAP_SHADER_TAG))) {
         /* get webgl context */
         var gl = ctxt.getGL();
         /* create shader program */
         var prog = Shader.create(
            ctxt,
            PolygonRenderer.CMAP_VERTEX_SHADER_ID,
            PolygonRenderer.CMAP_FRAGMENT_SHADER_ID
         );
         /* initialize shader data */
         var data = {
            /* locations of shader uniforms */
            u_mv_mx        : gl.getUniformLocation(prog, "u_mv_mx"),
            u_p_mx         : gl.getUniformLocation(prog, "u_p_mx"),
            u_color_samp   : gl.getUniformLocation(prog, "u_color_samp"),
            u_cmap_size    : gl.getUniformLocation(prog, "u_cmap_size"),
            u_depth        : gl.getUniformLocation(prog, "u_depth"),
            u_point_size   : gl.getUniformLocation(prog, "u_point_size"),
            /* locations of shader attributes */
            a_vrtx_x       : gl.getAttribLocation(prog, "a_vrtx_x"),
            a_vrtx_y       : gl.getAttribLocation(prog, "a_vrtx_y"),
            a_label        : gl.getAttribLocation(prog, "a_label")
         };
         /* add shader program to rendering context */
         ctxt.addShader(
            PolygonRenderer.CMAP_SHADER_TAG,
            prog,
            data,
            PolygonRenderer.updateColormapShader
         );
      }
      /* use shader */
      ctxt.useShader(PolygonRenderer.CMAP_SHADER_TAG);
   }
}

/**
 * Handle callback events for polygon shader program within rendering context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
PolygonRenderer.updateShader = function(ctxt, prog, data, ev) {
   /* get webgl context */
   var gl = ctxt.getGL();
   /* determine event type */
   if (ev.name == "activate") {
      /* use the shader program */
      gl.useProgram(prog);
      /* setup camera uniforms */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
      /* enable attributes */
      gl.enableVertexAttribArray(data.a_vrtx_x);
      gl.enableVertexAttribArray(data.a_vrtx_y);
   } else if (ev.name == "deactivate") {
      /* disable attributes */
      gl.disableVertexAttribArray(data.a_vrtx_x);
      gl.disableVertexAttribArray(data.a_vrtx_y);
   } else if (ev.name == "model-view") {
      /* update model-view uniform */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
   } else if (ev.name == "perspective") {
      /* update persepective uniform */
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
   }
}

/**
 * Handle callback events for polygon colormap shader program within rendering
 * context.
 *
 * This function handles activating and deactivating the shader, as well as
 * updating shader variables to reflect changes in rendering parameters.
 *
 * @param {RenderContext} ctxt rendering context
 * @param {WebGLProgram}  prog shader program
 * @param {object}        data shader program data
 * @param {object}        ev   event data
 */
PolygonRenderer.updateColormapShader = function(ctxt, prog, data, ev) {
   /* get webgl context */
   var gl = ctxt.getGL();
   /* determine event type */
   if (ev.name == "activate") {
      /* use the shader program */
      gl.useProgram(prog);
      /* setup camera uniforms */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
      /* enable attributes */
      gl.enableVertexAttribArray(data.a_vrtx_x);
      gl.enableVertexAttribArray(data.a_vrtx_y);
      gl.enableVertexAttribArray(data.a_label);
   } else if (ev.name == "deactivate") {
      /* disable attributes */
      gl.disableVertexAttribArray(data.a_vrtx_x);
      gl.disableVertexAttribArray(data.a_vrtx_y);
      gl.disableVertexAttribArray(data.a_label);
   } else if (ev.name == "model-view") {
      /* update model-view uniform */
      gl.uniformMatrix4fv(data.u_mv_mx, false, ctxt.cameraModelView());
   } else if (ev.name == "perspective") {
      /* update persepective uniform */
      gl.uniformMatrix4fv(data.u_p_mx, false, ctxt.cameraPerspective());
   }
}

/*****************************************************************************
 * Polygon rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in region or attributes.
 *
 * @param {Region} obj object (region or attributes) being updated
 * @param {object} ev  event data
 */
PolygonRenderer.prototype.update = function(obj, ev) {
   /* determine event type */
   if ((ev.name == "insert-vertices") ||
       (ev.name == "remove-vertices") ||
       (ev.name == "append-vertices") ||
       (ev.name == "reverse")) {
      /* rebuild rendering data */
      this.init();
   } else if (ev.name == "move-vertices") {
      /* update coordinates for changed vertices */
      this.updateCoords(ev.vs);
   } else if (ev.name == "set-vertex-labels") {
      /* update labels for changed vertices */
      this.updateVertexLabels(ev.vs);
   } else if (ev.name == "set-edge-labels") {
      /* update labels for changed edges */
      this.updateEdgeLabels(ev.es);
   } else {
      throw ("invalid PolygonRenderer update event: " + ev.name);
   }
}

/**
 * Draw polygon.
 */
PolygonRenderer.prototype.draw = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* activate shader for polygon vertices */
   if (this.v_cmap_rndr == null) {
      PolygonRenderer.useShader(this.ctxt);
   } else {
      PolygonRenderer.useColormapShader(this.ctxt);
   }
   /* get shader program data */
   var sh_data = this.ctxt.getActiveShader().data;
   /* assign depth */
   gl.uniform1f(sh_data.u_depth, this.depth);
   /* assign point size */
   gl.uniform1f(sh_data.u_point_size, this.point_size);
   /* assign coloring */
   if (this.v_cmap_rndr == null) {
      /* use constant color */
      gl.uniform4fv(sh_data.u_color, this.v_color);
   } else {
      /* use colormap */
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.v_cmap_rndr.getTexture());
      gl.uniform1i(sh_data.u_color_samp, 0);
      /* assign colormap size */
      gl.uniform1f(sh_data.u_cmap_size, this.v_cmap_rndr.cmap.size());
   }
   /* assign coordinate attributes */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_xs);
   gl.vertexAttribPointer(sh_data.a_vrtx_x, 1, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_ys);
   gl.vertexAttribPointer(sh_data.a_vrtx_y, 1, gl.FLOAT, false, 0, 0);
   /* assign label attributes */
   if (this.v_cmap_rndr != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_v_labels);
      gl.vertexAttribPointer(sh_data.a_label, 1, gl.FLOAT, false, 0, 0);
   }
   /* draw polygon vertices */
   gl.drawArrays(gl.POINTS, 0, this.poly.size());
   /* activate shader for polygon edges */
   if (this.e_cmap_rndr == null) {
      PolygonRenderer.useShader(this.ctxt);
   } else {
      PolygonRenderer.useColormapShader(this.ctxt);
   }
   /* get shader program data */
   sh_data = this.ctxt.getActiveShader().data;
   /* assign depth */
   gl.uniform1f(sh_data.u_depth, this.depth);
   /* assign point size */
   gl.uniform1f(sh_data.u_point_size, this.point_size);
   /* assign coloring */
   if (this.e_cmap_rndr == null) {
      /* use constant color */
      gl.uniform4fv(sh_data.u_color, this.e_color);
   } else {
      /* use colormap */
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.e_cmap_rndr.getTexture());
      gl.uniform1i(sh_data.u_color_samp, 0);
      /* assign colormap size */
      gl.uniform1f(sh_data.u_cmap_size, this.e_cmap_rndr.cmap.size());
   }
   /* assign coordinate attributes */
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_xs);
   gl.vertexAttribPointer(sh_data.a_vrtx_x, 1, gl.FLOAT, false, 0, 0);
   gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_ys);
   gl.vertexAttribPointer(sh_data.a_vrtx_y, 1, gl.FLOAT, false, 0, 0);
   /* assign label attributes */
   if (this.e_cmap_rndr != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buff_e_labels);
      gl.vertexAttribPointer(sh_data.a_label, 1, gl.FLOAT, false, 0, 0);
   }
   /* assign line width */
   gl.lineWidth(this.line_size);
   /* draw polygon edges */
   gl.drawArrays(gl.LINES, 0, 2*this.poly.size());
}

/**
 * Deallocate polygon rendering resources.
 */
PolygonRenderer.prototype.destroy = function() {
   /* get webgl context */
   var gl = this.ctxt.getGL();
   /* delete vertex data buffers */
   gl.deleteBuffer(this.buff_v_xs);
   gl.deleteBuffer(this.buff_v_ys);
   gl.deleteBuffer(this.buff_v_labels);
   /* delete edge data buffers */
   gl.deleteBuffer(this.buff_e_xs);
   gl.deleteBuffer(this.buff_e_ys);
   gl.deleteBuffer(this.buff_e_labels);
}
