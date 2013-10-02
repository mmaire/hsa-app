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

/**
 * @class Image utility functions.
 */
function ImgUtil() { }

/*****************************************************************************
 * Pixel coordinate conversion.
 *****************************************************************************/

/**
 * Get x-coordinates for specified pixels.
 *
 * @param   {int}   sy     size of image in y-dimension
 * @param   {array} pixels pixel ids
 * @returns {array}        pixel x-coordinates
 */
ImgUtil.coordsX = function(sy, pixels) {
   var xs = ArrUtil.create(pixels.length, pixels);
   for (var n = 0; n < pixels.length; ++n)
      xs[n] = Math.floor(pixels[n] / sy);
   return xs;
}

/**
 * Get y-coordinates for specified pixels.
 *
 * @param   {int}   sy     size of image in y-dimension
 * @param   {array} pixels pixel ids
 * @returns {array}        pixel y-coordinates
 */
ImgUtil.coordsY = function(sy, pixels) {
   var ys = ArrUtil.create(pixels.length, pixels);
   for (var n = 0; n < pixels.length; ++n)
      ys[n] = pixels[n] % sy;
   return ys;
}

/**
 * Convert (x,y)-coordinates to pixel ids.
 *
 * @param   {int}   sy size of image in y-dimension
 * @param   {array} xs pixel x-coordinates
 * @param   {array} ys pixel y-coordinates
 * @returns {array}    pixel ids
 */
ImgUtil.coordsLinear = function(sy, xs, ys) {
   var pixels = ArrUtil.create(xs.length, xs);
   for (var n = 0; n < xs.length; ++n)
      pixels[n] = xs[n]*sy + ys[n];
   return pixels;
}

/*****************************************************************************
 * Bounding boxes.
 *****************************************************************************/

/**
 * Return coordinates of bounding box containing the specified pixels.
 *
 * @param   {int}   sy     size of image in y-dimension
 * @param   {array} pixels pixel ids
 * @returns {array}        4-element array of (xmin,ymin,xlim,ylim)
 */
ImgUtil.bboxFromPixels = function(sy, pixels) {
   var xs = ImgUtil.coordsX(sy, pixels);
   var ys = ImgUtil.coordsY(sy, pixels);
   return ImgUtil.bboxFromCoords(xs, ys);
}

/**
 * Return coordinates of bounding box containing the specified pixels.
 *
 * @param   {array} xs pixel x-coordinates
 * @param   {array} ys pixel y-coordinates
 * @returns {array}    4-element array of (xmin,ymin,xlim,ylim)
 */
ImgUtil.bboxFromCoords = function(xs, ys) {
   var bbox = ArrUtil.create(4, xs);
   if (xs.length > 0) {
      bbox[0] = SetUtil.minElement(xs);
      bbox[2] = SetUtil.maxElement(xs) + 1;
   } else {
      bbox[0] = 0;
      bbox[2] = 0;
   }
   if (ys.length > 0) {
      bbox[1] = SetUtil.minElement(ys);
      bbox[3] = SetUtil.maxElement(ys) + 1;
   } else {
      bbox[1] = 0;
      bbox[3] = 0;
   }
   return bbox;
}

/**
 * Check whether the given bounding boxes overlap.
 *
 * @param   {array} bbA first bounding box (in form of 4-element array)
 * @param   {array} bbB second bounding box (in form of 4-element array)
 * @returns {bool}      true iff bounding boxes overlap
 */
ImgUtil.bboxOverlap = function(bbA, bbB) {
   /* check if intervals overlap */
   function intervalsOverlap(minA, limA, minB, limB) {
      return (
         ((minA <= minB) && (minB < limA)) || 
         ((minB <= minA) && (minA < limB))
      );
   }
   /* determine whether both x- and y-intervals overlap */
   return (
      intervalsOverlap(bbA[0],bbA[2],bbB[0],bbB[2]) && 
      intervalsOverlap(bbA[1],bbA[3],bbB[1],bbB[3])
   );
}

/**
 * Check whether the given bounding boxes touch (including overlapping).
 *
 * @param   {array} bbA first bounding box (in form of 4-element array)
 * @param   {array} bbB second bounding box (in form of 4-element array)
 * @returns {bool}      true iff bounding boxes overlap or touch.
 */
ImgUtil.bboxTouch = function(bbA, bbB) {
   /* check if intervals touch */
   function intervalsTouch(minA, limA, minB, limB) {
      return (
         (((minA-1) <= minB) && (minB <= limA)) || 
         (((minB-1) <= minA) && (minA <= limB))
      );
   }
   /* determine whether both x- and y-intervals touch */
   return (
      intervalsTouch(bbA[0],bbA[2],bbB[0],bbB[2]) && 
      intervalsTouch(bbA[1],bbA[3],bbB[1],bbB[3])
   );
}

/*****************************************************************************
 * Drawing functions.
 *****************************************************************************/

/**
 * Compute ids of pixels lying on the line segment with the given endpoints.
 * The endpoints must have integer coordinates.
 *
 * @param   {int}   sy size of image in y-dimension
 * @param   {int}   x0 x-coordinate of first endpoint
 * @param   {int}   y0 y-coordinate of first endpoint
 * @param   {int}   x1 x-coordinate of second endpoint
 * @param   {int}   y1 y-coordinate of second endpoint
 * @returns {array}    pixels on line segment
 */
ImgUtil.drawLine = function(sy, x0, y0, x1, y1) {
   /* compute x- and y-differences */
   var diff_x = x1 - x0;
   var diff_y = y1 - y0;
   /* compute sign of steps */
   var dx = 0;
   var dy = 0;
   if (diff_x > 0) { dx = 1; } else if (diff_x < 0) { dx = -1; }
   if (diff_y > 0) { dy = 1; } else if (diff_y < 0) { dy = -1; }
   /* initialize pixel coordinate array */
   var abs_diff_x = diff_x * dx;
   var abs_diff_y = diff_y * dy;
   var px_len = Math.max(abs_diff_x, abs_diff_y) + 1;
   var pixels = new Array(px_len);
   /* record line segment end point */
   pixels[px_len-1] = (x1 * sy) + y1;
   var pos = 0;
   /* determine whether to step in x or y */
   if (abs_diff_y == 0) {
      /* horizontal line segment */
      for (var x = x0; x != x1; x += dx)
         pixels[pos++] = (x * sy) + y0;
   } else if (abs_diff_x == 0) {
      /* vertical line segment */
      for (var y = y0; y != y1; y += dy)
         pixels[pos++] = (x0 * sy) + y;
   } else if (abs_diff_x > abs_diff_y) {
      /* step x-coordinate */
      var delta_y = diff_y / abs_diff_x;
      var y = y0;
      for (var x = x0; x != x1; x += dx) {
         pixels[pos++] = (x * sy) + Math.round(y);
         y += delta_y;
      }
   } else {
      /* step y-coordinate */
      var delta_x = diff_x / abs_diff_y;
      var x = x0;
      for (var y = y0; y != y1; y += dy) {
         pixels[pos++] = (Math.round(x) * sy) + y;
         x += delta_x;
      }
   }
   return pixels;
}

/**
 * Compute ids of pixels lying on the given polygon.
 * The polygon vertices must have integer coordinates.
 * Return an array containing a subarray listing pixels on each boundary edge.
 *
 * @param   {int}   sy     size of image in y-dimension
 * @param   {array} poly_x x-coordinates of polygon vertices
 * @param   {array} poly_y y-coordinates of polygon vertices
 * @returns {array}        pixels on polygon boundary
 */
ImgUtil.drawPolygon = function(sy, poly_x, poly_y) {
   /* draw line segments between vertices  */
   var n_vrtx = poly_x.length;
   var px_arr = new Array(n_vrtx);
   for (var v = 0; (v+1) < n_vrtx; ++v) {
      px_arr[v] = ImgUtil.drawLine(
         sy, poly_x[v], poly_y[v], poly_x[v+1], poly_y[v+1]
      );
   }
   if (n_vrtx > 0) {
      px_arr[n_vrtx-1] = ImgUtil.drawLine(
         sy, poly_x[n_vrtx-1], poly_y[n_vrtx-1], poly_x[0], poly_y[0]
      );
   }
   return px_arr;
}

/**
 * Collapse a two-level pixel array into a single-level pixel list.
 *
 * @param   {array} px_arr array of pixel arrays (such as from drawPolygon)
 * @returns {array}        single-level pixel array
 */
ImgUtil.collapsePixelArray = function(px_arr) {
   /* count total number of pixels */
   var n_pixels = 0;
   for (var v = 0; v < px_arr.length; ++v)
      n_pixels += px_arr[v].length;
   /* concatenate pixels into single array */
   var pixels = new Array(n_pixels);
   var pos = 0;
   for (var v = 0; v < px_arr.length; ++v) {
      var line = px_arr[v];
      for (var n = 0; n < line.length; ++n)
         pixels[pos++] = line[n];
   }
   return pixels;
}

/**
 * Set pixels in an image to the specified value.
 *
 * @param {array}   im     image
 * @param {array}   pixels pixel ids
 * @param {numeric} val    value
 */
ImgUtil.setPixels = function(im, pixels, val) {
   for (var n = 0; n < pixels.length; ++n)
      im[pixels[n]] = val;
}

/**
 * Set pixels in an image to the specified value (given a two-level array).
 *
 * @param {array}   im       image
 * @param {array}   px_array array of array of pixel ids
 * @param {numeric} val      value
 */
ImgUtil.setPixelArray = function(im, px_arr, val) {
   for (var n = 0; n < px_arr.length; ++n)
      ImgUtil.setPixels(im, px_arr[n], val);
}

/*****************************************************************************
 * Connected components.
 *****************************************************************************/

/**
 * Label 4-connected components in a 2D image.
 * Adjacent elements having the same value are considered connected.
 *
 * @param   {array}  im image matrix
 * @param   {int}    sx size of image in x-dimension
 * @param   {int}    sy size of image in y-dimension
 * @returns {object}    connected component data
 *
 * The returned object is a structure with fields:
 * {array} labels - integer-valued matrix containing component labels
 * {int}   n_comp - number of connected components (labeled 0 through n_comp-1)
 */
ImgUtil.connComp = function(im, sx, sy) {
   /* get image size */
   var len = im.length;
   /* compute coordinate bounds */
   var xm = sx - 1;
   var ym = sy - 1;
   /* initialize connected component labels */
   var labels = new Array(len);
   for (var n = 0; n < len; n++)
      labels[n] = -1;
   /* initialize current label and value */
   var lbl = 0;
   var val = 0;
   /* initialize pixel visit queue */
   var q_px = new Array(len);
   var q_len = 0;
   /* follow connected components from each element */
   for (var n = 0; n < len; n++) {
      /* check if current position begins component */
      if (labels[n] < 0) {
         /* set label */
         labels[n] = lbl;
         /* record value to match */
         val = im[n];
         /* enqueue current position */
         q_px[q_len++] = n;
         /* follow current component */
         while (q_len > 0) {
            /* dequeue position */
            var pos = q_px[--q_len];
            var x = Math.floor(pos / sy);
            var y = pos - (x * sy);
            /* compute positions of neighbors */
            var pos_north = pos - sy;
            var pos_south = pos + sy;
            var pos_west = pos - 1;
            var pos_east = pos + 1;
            /* label and enqueue unlabeled matching neighbors */
            if ((x > 0) && (labels[pos_north] < 0) && (im[pos_north] == val)) {
               labels[pos_north] = lbl;
               q_px[q_len++] = pos_north;
            }
            if ((x < xm) && (labels[pos_south] < 0) && (im[pos_south] == val)) {
               labels[pos_south] = lbl;
               q_px[q_len++] = pos_south;
            }
            if ((y > 0) && (labels[pos_west] < 0) && (im[pos_west] == val)) {
               labels[pos_west] = lbl;
               q_px[q_len++] = pos_west;
            }
            if ((y < ym) && (labels[pos_east] < 0) && (im[pos_east] == val)) {
               labels[pos_east] = lbl;
               q_px[q_len++] = pos_east;
            }
         }
         /* increment label */
         ++lbl;
      }
   }
   /* return connected component data */
   var cc = {
      labels : labels,
      n_comp : lbl
   }
   return cc;
}

/**
 * Return the set of labels used by the given connected components.
 * Since labels are used in order, this set is [0, max(cc.labels)].
 *
 * @param   {object} cc connected component data
 * @returns {array}     array containing the set [0, max(cc.labels)].
 */
ImgUtil.connCompLabels = function(cc) {
   /* check if label set is empty */
   if (cc.n_comp == 0)
      return [];
   /* get maximum label */
   var lbl_max = cc.n_comp - 1;
   /* assemble label set */
   var lbl_set = new Array((lbl_max+1));
   for (var l = 0; l < lbl_max; ++l)
      lbl_set[l] = l;
   return lbl_set;
}

/**
 * Extract a set for each connected component.
 * Return an array, indexed by component label, which, for each label, 
 * contains an array of the pixels ids belonging to that component.
 *
 * @param   {object} cc connected component data
 * @returns {array}     array containing a set for each connected component
 */
ImgUtil.connCompSets = function(cc) {
   /* check that labels is nonempty */
   if (cc.labels.length == 0)
      return [];
   /* get maximum label */
   var lbl_max = cc.n_comp - 1;
   /* get component sizes */
   var comp_len = new Array((lbl_max+1));
   for (var l = 0; l <= lbl_max; ++l)
      comp_len[l] = 0;
   for (var n = 0; n < cc.labels.length; ++n)
      ++comp_len[cc.labels[n]];
   /* initialize component sets */
   var cc_sets      = new Array((lbl_max+1));
   var cc_sets_pos  = new Array((lbl_max+1));
   for (var l = 0; l <= lbl_max; ++l) {
      cc_sets[l]     = new Array(comp_len[l]);
      cc_sets_pos[l] = 0;
   }
   /* place pixels into components */
   for (var n = 0; n < cc.labels.length; ++n) {
      var lbl = cc.labels[n];
      cc_sets[lbl][cc_sets_pos[lbl]++] = n;
   }
   return cc_sets;
}

/**
 * Extract the set of pixels belonging to the given connected component.
 *
 * @param   {array} labels label matrix
 * @param   {int}   lbl    label of desired component
 * @returns {array}        pixel ids in component
 */
ImgUtil.connCompSet = function(labels, lbl) {
   /* check that labels is nonempty */
   if (labels.length == 0)
      return [];
   /* extract specified component */
   var s = new Array(labels.length);
   var s_len = 0;
   for (var n = 0; n < labels.length; ++n) {
      if (labels[n] == lbl)
         s[s_len++] = n;
   }
   s.length = s_len;
   return s;
}

/**
 * Extract the set of pixels not belonging to the given connected component.
 *
 * @param   {array} labels label matrix
 * @param   {int}   lbl    label of component to invert
 * @returns {array}        pixel ids not in component
 */
ImgUtil.connCompSetInv = function(labels, lbl) {
   /* check that labels is nonempty */
   if (labels.length == 0)
      return [];
   /* extract specified component */
   var s = new Array(labels.length);
   var s_len = 0;
   for (var n = 0; n < labels.length; ++n) {
      if (labels[n] != lbl)
         s[s_len++] = n;
   }
   s.length = s_len;
   return s;
}

/**
 * Construct a 2D matrix (array of arrays) mapping each pair of labels
 * (one from each set) to a single unique label.
 *
 * Note that each label set is treated as containing integer labels in the
 * range [0,M] where M is the maximum label found in the set.
 *
 * @param   {array} lbl_setA first set of labels
 * @param   {array} lbl_setB second set of labels
 * @returns {array} label mapping (array of arrays)
 */
ImgUtil.crossLabelMap = function(lbl_setA, lbl_setB) {
   /* get label range limits */
   var limA = 0;
   var limB = 0;
   if (lbl_setA.length > 0) { limA = SetUtil.maxElement(lbl_setA) + 1; }
   if (lbl_setB.length > 0) { limB = SetUtil.maxElement(lbl_setB) + 1; }
   /* create mapping */
   var lbl_map = new Array(limA);
   var pos = 0;
   for (var a = 0; a < limA; ++a) {
      var lbls = new Array(limB);
      for (var b = 0; b < limB; ++b)
         lbls[b] = pos++;
      lbl_map[a] = lbls;
   }
   return lbl_map;
}

/**
 * Cross two given labelings of an image, producing a single labeling.
 * Replace unique pairs of indentifiers by a single unique identifier.
 *
 * @param   {array} labelsA first labeling
 * @param   {array} labelsB second labeling
 * @returns {array} labeling obtained by crossing first and second labeling
 */
ImgUtil.crossLabels = function(labelsA, labelsB, lbl_map) {
   /* compute label map if not supplied */
   lbl_map = (typeof(lbl_map) != "undefined") ?
      lbl_map : ImgUtil.crossLabelMap(labelsA, labelsB);
   /* apply map to label pairs */
   var labels = ArrUtil.create(labelsA.length, labelsA);
   for (var n = 0; n < labels.length; ++n)
      labels[n] = lbl_map[labelsA[n]][labelsB[n]];
   return labels;
}
