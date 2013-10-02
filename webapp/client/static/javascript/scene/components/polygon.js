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
 * Polygon.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Polygon constructor.
 *
 * @class Polygons store a sequence of connected 2D points along with a numeric
 *        label for each vertex and edge in the sequence.  Edges are indexed by
 *        the vertex at which they start, with the last edge connecting the
 *        last vertex back to the first.
 *
 * To create a polygon, specify the x- and y-coordinates of the vertices.
 * Vertex and edge labels may be optionally specified, but if omitted are
 * initialized to zero.
 *
 * @constructor
 * @param {array} xs       x-coordinates of vertices
 * @param {array} ys       y-coordinates of vertices
 * @param {array} v_labels numeric labels assigned to vertices (default: 0)
 * @param {array} e_labels numeric labels assigned to edges (default: 0)
 */
function Polygon(xs, ys, v_labels, e_labels) {
   /* check size of coordinate vectors */
   var n_points = xs.length;
   if (ys.length != n_points)
      throw ("polygon x- and y-coordinate vectors must be the same length");
   /* copy vertex coordinates */
   this.xs = ArrUtil.cloneAs(xs, Float32Array);
   this.ys = ArrUtil.cloneAs(ys, Float32Array);
   /* copy vertex labels */
   if (typeof(v_labels) != "undefined") {
      this.v_labels = ArrUtil.cloneAs(v_labels, Float32Array);
   } else {
      this.v_labels = new Float32Array(n_points);
      for (var n = 0; n < n_points; ++n)
         this.v_labels[n] = 0;
   }
   /* copy edge labels */
   if (typeof(e_labels) != "undefined") {
      this.e_labels = ArrUtil.cloneAs(e_labels, Float32Array);
   } else {
      this.e_labels = new Float32Array(n_points);
      for (var n = 0; n < n_points; ++n)
         this.e_labels[n] = 0;
   }
   /* initialize list of attached renderers */
   this.renderers = {};
}

/*****************************************************************************
 * Polygon manipulation.
 *****************************************************************************/

/**
 * Return the size of the polygon.
 * This is the number of vertices, or equivalently, the number of edges.
 *
 * @returns {int} polygon size
 */
Polygon.prototype.size = function() {
   return this.v_labels.length;
}

/**
 * Get array of polygon vertex x-coordinates.
 *
 * @returns {array} x-coordinates of polygon vertices
 */
Polygon.prototype.getXCoords = function() {
   return this.xs;
}

/**
 * Get array of polygon vertex y-coordinates.
 *
 * @returns {array} y-coordinates of polygon vertices
 */
Polygon.prototype.getYCoords = function() {
   return this.ys;
}

/**
 * Get (x,y) coordinates of the specified vertex.
 *
 * @param   {int}    v vertex id
 * @returns {object}   coordinates in object with fields { x: _ y: _ }
 */
Polygon.prototype.getVertexCoords = function(v) {
   return { x: this.xs[v], y: this.ys[v] };
}

/**
 * Get x-coordinate of the specified vertex.
 *
 * @param   {int}   v vertex id
 * @returns {float}   x-coordinate
 */
Polygon.prototype.getVertexXCoord = function(v) {
   return this.xs[v];
}

/**
 * Get y-coordinate of the specified vertex.
 *
 * @param   {int}   v vertex id
 * @returns {float}   y-coordinate
 */
Polygon.prototype.getVertexYCoord = function(v) {
   return this.ys[v];
}

/**
 * Move the specified polygon vertex to the given coordinates.
 *
 * @param {int}   v vertex id
 * @param {float} x x-coordinate
 * @param {float} y y-coordinate
 */
Polygon.prototype.moveVertex = function(v, x, y) {
   this.moveVertices([v], [x], [y]);
}

/**
 * Move the specified polygon vertices to the given coordinates.
 *
 * @param {array} vs vertex ids
 * @param {array} xs x-coordinates
 * @param {array} ys y-coordinates
 */
Polygon.prototype.moveVertices = function(vs, xs, ys) {
   /* update vertex coordinates */
   for (var n = 0; n < vs.length; ++n) {
      var v = vs[n];
      this.xs[v] = xs[n];
      this.ys[v] = ys[n];
   }
   /* notify attached renderers of polygon update */
   Renderer.updateAll(this, { name: "move-vertices", vs: vs });
}

/**
 * Append a vertex to the polygon.
 *
 * @param {float} x       x-coordinate
 * @param {float} y       y-coordinate
 * @param {float} v_label label of appended vertex (optional, default: 0)
 * @param {float} e_label label of edge starting at vertex (default: 0)
 */
Polygon.prototype.appendVertex = function(x, y, v_label, e_label) {
   v_label = (typeof(v_label) != "undefined") ? v_label : 0;
   e_label = (typeof(e_label) != "undefined") ? e_label : 0;
   this.appendVertices([x], [y], [v_label], [e_label]);
}

/**
 * Append multiple vertices to the polygon.
 *
 * @param {array} xs       x-coordinates
 * @param {array} ys       y-coordinates
 * @param {array} v_labels labels of appended vertices (optional, default: 0)
 * @param {array} e_labels labels of edges starting at vertices (default: 0)
 */
Polygon.prototype.appendVertices = function(xs, ys, v_labels, e_labels) {
   /* get array sizes */
   var n_points = this.v_labels.length;
   var n_append = xs.length;
   /* compute total size */
   var sz = n_points + n_append;
   /* allocate extended arrays for polygon elements */
   var x_arr     = new Float32Array(sz);
   var y_arr     = new Float32Array(sz);
   var v_lbl_arr = new Float32Array(sz);
   var e_lbl_arr = new Float32Array(sz);
   /* copy elements */
   for (var n = 0; n < n_points; ++n) {
      x_arr[n]     = this.xs[n];
      y_arr[n]     = this.ys[n];
      v_lbl_arr[n] = this.v_labels[n];
      e_lbl_arr[n] = this.e_labels[n];
   }
   /* append coordinates */
   for (var n = 0; n < n_append; ++n) {
      x_arr[n_points + n] = xs[n];
      y_arr[n_points + n] = ys[n];
   }
   /* append vertex labels */
   if (typeof(v_labels) != "undefined") {
      for (var n = 0; n < n_append; ++n)
         v_lbl_arr[n_points + n] = v_labels[n];
   } else {
      for (var n = 0; n < n_append; ++n)
         v_lbl_arr[n_points + n] = 0;
   }
   /* append edge labels */
   if (typeof(e_labels) != "undefined") {
      for (var n = 0; n < n_append; ++n)
         e_lbl_arr[n_points + n] = e_labels[n];
   } else {
      for (var n = 0; n < n_append; ++n)
         e_lbl_arr[n_points + n] = 0;
   }
   /* swap updated polygon into current polygon */
   this.xs       = x_arr;
   this.ys       = y_arr;
   this.v_labels = v_lbl_arr;
   this.e_labels = e_lbl_arr;
   /* notify attached renderers of polygon update */
   Renderer.updateAll(this, { name: "append-vertices" });
}

/**
 * Insert a vertex into the polygon at the specified location.
 * Increment the ids of the vertices following the inserted vertex.
 *
 * @param {int}   v       vertex id (insertion position)
 * @param {float} x       x-coordinate
 * @param {float} y       y-coordinate
 * @param {float} v_label label of inserted vertex (optional, default: 0)
 * @param {float} e_label label of edge starting at vertex (default: 0)
 */
Polygon.prototype.insertVertex = function(v, x, y, v_label, e_label) {
   v_label = (typeof(v_label) != "undefined") ? v_label : 0;
   e_label = (typeof(e_label) != "undefined") ? e_label : 0;
   this.insertVertices([v], [x], [y], [v_label], [e_label]);
}

/**
 * Insert multiple vertices into the polygon at the specified locations.
 * Shift all vertex ids to account for the inserted vertices.
 *
 * @param {array} vs       vertex ids (insertion positions)
 * @param {array} xs       x-coordinates
 * @param {array} ys       y-coordinates
 * @param {array} v_labels labels of inserted vertices (optional, default: 0)
 * @param {array} e_labels labels of edges starting at vertices (default: 0)
 */
Polygon.prototype.insertVertices = function(vs, xs, ys, v_labels, e_labels) {
   /* default arguments - initialize labels of inserted vertices */
   if (typeof(v_labels) == "undefined") {
      v_labels = new Float32Array(vs.length);
      for (var n = 0; n < v_labels.length; ++n)
         v_labels[n] = 0;
   }
   /* default arguments - initialize labels of inserted edges */
   if (typeof(e_labels) == "undefined") {
      e_labels = new Float32Array(vs.length);
      for (var n = 0; n < e_labels.length; ++n)
         e_labels[n] = 0;
   }
   /* mark shifts */
   var shift = new Uint32Array(this.v_labels.length); /* shift indicator */
   var n_ins = 0;                                     /* # vertices inserted */
   for (var n = 0; n < this.v_labels.length; ++n)
      shift[n] = 0;
   for (var n = 0; n < vs.length; ++n) {
      var v = vs[n];
      if (shift[v] == 0) {
         shift[v] = 1;
         ++n_ins;
      }
   }
   /* allocate extended arrays for polygon elements */
   var x_arr     = new Float32Array(this.xs.length + n_ins);
   var y_arr     = new Float32Array(this.ys.length + n_ins);
   var v_lbl_arr = new Float32Array(this.v_labels.length + n_ins);
   var e_lbl_arr = new Float32Array(this.e_labels.length + n_ins);
   /* copy current elements to shifted positions */
   for (var n = 0, s = 0; n < this.v_labels.length; ++n) {
      /* get cumulative shift */
      s += shift[n];
      /* shift elements */
      x_arr[n + s]     = this.xs[n];
      y_arr[n + s]     = this.ys[n];
      v_lbl_arr[n + s] = this.v_labels[n];
      e_lbl_arr[n + s] = this.e_labels[n];
      /* store cumulative shift */
      shift[n] = s;
   }
   /* insert vertices */
   for (var n = 0; n < vs.length; ++n) {
      /* compute shifted position */
      var v = vs[n] + shift[vs[n]] - 1;
      /* insert elements  */
      x_arr[v]     = xs[n];
      y_arr[v]     = ys[n];
      v_lbl_arr[v] = v_labels[n];
      e_lbl_arr[v] = e_labels[n];
   }
   /* swap updated polygon into current polygon */
   this.xs       = x_arr;
   this.ys       = y_arr;
   this.v_labels = v_lbl_arr;
   this.e_labels = e_lbl_arr;
   /* notify attached renderers of polygon update */
   Renderer.updateAll(this, { name: "insert-vertices" });
}

/**
 * Remove the specified vertex from the polygon.
 * Decrement the ids of the vertices following the removed vertex.
 *
 * @param {int} v id of vertex to remove
 */
Polygon.prototype.removeVertex = function(v) {
   this.removeVertices([v]);
}

/**
 * Remove multiple vertices from the polygon.
 * Shift all vertex ids to account for the removed vertices.
 *
 * @param {array} vs ids of vertices to remove
 */
Polygon.prototype.removeVertices = function(vs) {
   /* mark removed vertices */
   var r_arr = new Uint32Array(this.v_labels.length); /* remove indicator */
   var n_rem = 0;                                     /* # vertices removed */
   for (var n = 0; n < this.v_labels.length; ++n)
      r_arr[n] = 0;
   for (var n = 0; n < vs.length; ++n) {
      var v = vs[n];
      if (r_arr[v] == 0) {
         r_arr[v] = 1;
         ++n_rem;
      }
   }
   /* allocate shrunk arrays for polygon elements */
   var x_arr     = new Float32Array(this.xs.length - n_rem);
   var y_arr     = new Float32Array(this.ys.length - n_rem);
   var v_lbl_arr = new Float32Array(this.v_labels.length - n_rem);
   var e_lbl_arr = new Float32Array(this.e_labels.length - n_rem);
   /* copy elments to shifted positions */
   for (var n = 0, s = 0; n < this.v_labels.length; ++n) {
      /* check if element remains */
      if (r_arr[n] == 0) {
         /* shift element */
         x_arr[n - s]     = this.xs[n];
         y_arr[n - s]     = this.ys[n];
         v_lbl_arr[n - s] = this.v_labels[n];
         e_lbl_arr[n - s] = this.e_labels[n];
      }
      /* update cumulative shift */
      s += r_arr[n];
   }
   /* swap updated polygon into current polygon */
   this.xs       = x_arr;
   this.ys       = y_arr;
   this.v_labels = v_lbl_arr;
   this.e_labels = e_lbl_arr;
   /* notify attached renderers of polygon update */
   Renderer.updateAll(this, { name: "remove-vertices" });
}

/**
 * Reverse the order of vertices and edges in the polygon.
 */
Polygon.prototype.reverse = function() {
   /* revese polygon elements */
   ArrUtil.reverse(this.xs);
   ArrUtil.reverse(this.ys);
   ArrUtil.reverse(this.v_labels);
   ArrUtil.reverse(this.e_labels);
   /* notify attached renderers of polygon update */
   Renderer.updateAll(this, { name: "reverse" });
}

/*****************************************************************************
 * Vertex and edge label manipulation.
 *****************************************************************************/

/**
 * Get array of polygon vertex labels.
 *
 * @returns {array} vertex labels
 */
Polygon.prototype.getVertexLabels = function() {
   return this.v_labels;
}

/**
 * Get array of polygon edge labels.
 *
 * @returns {array} edge labels
 */
Polygon.prototype.getEdgeLabels = function() {
   return this.e_labels;
}

/**
 * Get label of the specified vertex.
 *
 * @param   {int}   v vertex id
 * @returns {float}   vertex label
 */
Polygon.prototype.getVertexLabel = function(v) {
   return this.v_labels[v];
}

/**
 * Get label of the specified edge.
 *
 * @param   {int}   e edge id
 * @returns {float}   edge label
 *
 */
Polygon.prototype.getEdgeLabel = function(e) {
   return this.e_labels[e];
}

/**
 * Set label of the specified vertex.
 *
 * @param {int}   v       vertex id
 * @param {float} v_label vertex label
 */
Polygon.prototype.setVertexLabel = function(v, v_label) {
   this.setVertexLabels([v], [v_label]);
}

/**
 * Set labels of the specified vertices.
 *
 * @param {array} vs       vertex ids
 * @param {array} v_labels vertex labels
 */
Polygon.prototype.setVertexLabels = function(vs, v_labels) {
   /* set vertex labels */
   for (var n = 0; n < vs.length; ++n)
      this.v_labels[vs[n]] = v_labels[n];
   /* notify attached renderers */
   Renderer.updateAll(this, { name: "set-vertex-labels", vs: vs });
}

/**
 * Set label of the specified edge.
 *
 * @param {int}   e       edge id
 * @param {float} e_label edge label
 */
Polygon.prototype.setEdgeLabel = function(e, e_label) {
   this.setEdgeLabels([e], [e_label]);
}

/**
 * Set labels of the specified edges.
 *
 * @param {array} es       edge ids
 * @param {array} e_labels edge labels
 */
Polygon.prototype.setEdgeLabels = function(es, e_labels) {
   /* set edge labels */
   for (var n = 0; n < es.length; ++n)
      this.e_labels[es[n]] = e_labels[n];
   /* notify attached renderers */
   Renderer.updateAll(this, { name: "set-edge-labels", es: es });
}
