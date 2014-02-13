/*
 * Copyright (C) 2014 Michael Maire <mmaire@gmail.com>
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
 * Ultrametric contour map (UCM).
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Ultrametric contour map (UCM).
 *
 * @class A UCM represents a forest of region trees such that the leaf nodes
 *        of the forest form a partition of the image.  Each interior node is
 *        associated with a real-valued threshold representing the strength of
 *        the boundary between its children.
 *
 * UCMs are created as the output of external image segmentation algorithms
 * and are imported by reading a standard format from a {@link DataStream}.
 * The required layout in the datastream is as follows:
 *
 * Header:
 *    img_size_x     <int32>        image size in x-dimension
 *    img_size_y     <int32>        image size in y-dimension
 *    n_regions_leaf <int32>        #leaf regions in forest
 *    n_regions      <int32>        #regions in forest (leaves + interior)
 * Pixel Data:
 *    px_rid_map     <int32 array>  map: pixels -> leaf region ids
 * Region Data:
 *    reg_info {     <struct array> region info for all nodes in forest
 *       id          <int32>        id of region
 *       parent_id   <int32>        id of parent region (-1 for none)
 *       n_children  <int32>        #child regions
 *       child_ids   <int32 array>  region id of each child
 *       merge_th    <float64>      threshold at which children merge
 *    }
 *
 * Note: Regions with ids 0 through (n_regions_leaf-1) must be leaf nodes,
 * while regions with greater ids must be interior nodes of the forest.
 *
 * @constructor
 * @param {DataStream} ds datastream from which to read UCM
 */
function UCM(ds) {

if (ds instanceof ImgData) {
   this.img_size_x = ds.sizeX();
   this.img_size_y = ds.sizeY();
   this.img_size = ds.size();
   this.n_regions_leaf = 1;
   this.n_regions = 1;
   this.px_rid_map = new Int32Array(this.img_size);
   this.reg_info = new Array(1);
   this.reg_info[0] = {
      id: 0,
      parent_region: null,
      child_regions: [],
      merge_th : 0,
      pixels : new Int32Array(this.img_size)
   };
   for (var n = 0; n < this.img_size; ++n)
      this.reg_info[0].pixels[n] = n;
   /* sort regions by merge threshold (in ascending order) */
   this.reg_sort = new Array(this.n_regions);
   for (var r = 0; r < this.n_regions; ++r)
      this.reg_sort[r] = this.reg_info[r];
   ArrUtil.sort(this.reg_sort, function(a,b){return a.merge_th-b.merge_th;});
   return;
}

   /* retrieve image size */
   this.img_size_x = ds.readInt32();
   this.img_size_y = ds.readInt32();
   this.img_size = (this.img_size_x) * (this.img_size_y);
   /* retrieve forest size */
   this.n_regions_leaf = ds.readInt32(); /* #leaves in forest */
   this.n_regions      = ds.readInt32(); /* #nodes in forest (total) */
   /* retrieve map: pixels -> ids of containing leaf regions in UCM */
   var rle = ArrUtil.rleDeserialize(ds);
   this.px_rid_map = ArrUtil.rleDecompress(rle);
   /* initialize region info array */
   this.reg_info = new Array(this.n_regions);
   for (var r = 0; r < this.n_regions; ++r) {
      this.reg_info[r] = {
         id            : r,      /* region id */
         parent_region : null,   /* parent region (if any) */
         child_regions : [],     /* list of child regions */
         merge_th      : 0,      /* merge thresholds */
         pixels        : null    /* pixels in region (null if not leaf) */
      };
   }
   /* retrieve region info */
   for (var n = 0; n < this.n_regions; ++n) {
      /* grab info data structure for region */
      var r = ds.readInt32();
      var reg = this.reg_info[r];
      /* retrieve parent */
      var parent_id = ds.readInt32();
      reg.parent_region = (parent_id < 0) ? null : this.reg_info[parent_id];
      /* retrieve children */
      var n_children = ds.readInt32();
      reg.child_regions = new Array(n_children);
      for (var c = 0; c < n_children; ++c) {
         var child_id = ds.readInt32();
         reg.child_regions[c] = this.reg_info[child_id];
      }
      /* retrieve merge thredhold */
      reg.merge_th = ds.readFloat64();
      /* store updated region info */
      this.reg_info[r] = reg;
   }
   /* count number of pixels in each region */
   var r_size = new Uint32Array(this.n_regions_leaf);
   for (var p = 0; p < this.img_size; ++p)
      ++r_size[this.px_rid_map[p]];
   /* initialize region pixel membership lists */
   for (var r = 0; r < this.n_regions_leaf; ++r)
      this.reg_info[r].pixels = new Array(r_size[r]);
   /* place pixels into regions */
   var r_pos = new Uint32Array(this.n_regions_leaf);
   for (var p = 0; p < this.img_size; ++p) {
      var r = this.px_rid_map[p];
      this.reg_info[r].pixels[r_pos[r]++] = p;
   }
   /* sort regions by merge threshold (in ascending order) */
   this.reg_sort = new Array(this.n_regions);
   for (var r = 0; r < this.n_regions; ++r)
      this.reg_sort[r] = this.reg_info[r];
   ArrUtil.sort(this.reg_sort, function(a,b){return a.merge_th-b.merge_th;});
}

/*****************************************************************************
 * Region forest properties.
 *****************************************************************************/

/**
 * Return the number of leaf regions in the UCM.
 *
 * @returns {int} #leaves in region forest
 */
UCM.prototype.countLeaves = function() {
   return this.n_regions_leaf;
}

/**
 * Return the total number of regions in the UCM.
 *
 * @returns {int} #nodes in region forest
 */
UCM.prototype.countNodes = function() {
   return this.n_regions;
}

/*****************************************************************************
 * Region and pixel lookup.
 *****************************************************************************/

/**
 * Lookup the ids of the leaf regions containing the specified pixels.
 *
 * @param   {array} pixels pixel ids (linear image coordinates)
 * @returns {array}        leaf region id for each corresponding pixel
 */
UCM.prototype.lookupRegions = function(pixels) {
   /* allocate region id array */
   var r_ids = new Uint32Array(pixels.length);
   /* lookup leaf regions covering pixels */
   for (var n = 0; n < pixels.length; ++n)
      r_ids[n] = this.px_rid_map[pixels[n]];
   return r_ids;
}

/**
 * Lookup the ids of the regions descending from the specified region.
 *
 * @param   {int}   r_id region id
 * @returns {array}      ids of descendant regions
 */
UCM.prototype.lookupDescendants = function(r_id) {
   /* postorder traversal of region tree */
   function collectNodes(r) {
      var nodes = [];
      if (r.child_regions.length > 0) {
         /* collect descendants of each child */
         var d_arr = new Array(r.child_regions.length);
         var n_des = 0;
         for (var n = 0; n < r.child_regions.length; ++n) {
            d_arr[n] = collectNodes(r.child_regions[n]);
            n_des = n_des + d_arr[n].length;
         }
         /* flatten array */
         nodes.length = n_des + 1;
         var pos = 0;
         for (var n = 0; n < r.child_regions.length; ++n) {
            var d = d_arr[n];
            for (p = 0; p < d.length; ++p)
               nodes[pos++] = d[p];
         }
         /* add current node */
         nodes[pos] = r.id;
      } else {
         /* add current node */
         nodes[0] = r.id;
      }
      return nodes;
   }
   /* collect descendants, remove root node */
   var descendants = collectNodes(this.reg_info[r_id]);
   --(descendants.length);
   return descendants;
}

/**
 * Lookup pixels contained in the specified region.
 *
 * @param   {int}   r_id region id
 * @returns {array}      pixel ids (linear image coordinates)
 */
UCM.prototype.lookupPixels = function(r_id) {
   /* lookup descendants, add starting node */
   var r_ids = this.lookupDescendants(r_id);
   r_ids[r_ids.length] = r_id;
   /* count number of pixels in leaves */
   var n_px = 0;
   for (var n = 0; n < r_ids.length; ++n) {
      var reg = this.reg_info[r_ids[n]];
      if (reg.pixels != null)
         n_px += reg.pixels.length;
   }
   /* union pixel lists */
   var pixels = new Uint32Array(n_px);
   var pos = 0;
   for (var n = 0; n < r_ids.length; ++n) {
      var reg = this.reg_info[r_ids[n]];
      if (reg.pixels != null) {
         for (var p = 0; p < reg.pixels.length; ++p)
            pixels[pos++] = reg.pixels[p];
      }
   }
   return pixels;
}

/*****************************************************************************
 * Binary label inference.
 *
 * The forest structure imposed by the UCM supports propagating a partial
 * labeling of nodes to a full (or fuller) labeling.  The methods below
 * implement such propagation for the case of binary labels where the sign
 * of the label indicates type (each node is negative, unlabeled, or positive)
 * and the magnitude indicates strength.
 *
 * Specifically, labels propagate as follows:
 *
 * (1) Propagate from leaves to roots:
 *     An unlabled node receives the label of its strongest child, unless
 *     children disagree with equal strength.
 *
 * (2) Propagate from root to leaves:
 *     Unlabeled children assume the label of their closest labeled ancestor.
 *
 * (3) Encountering a node with a merge threshold that is too large (as
 *     specified by the user), prevents propagation in step (1).
 *****************************************************************************/

/**
 * Create and return a label array with an entry for each region in the UCM.
 * Initialize all entries to zero to indicate the unlabeled state.
 *
 * @returns {array} label array
 */
UCM.prototype.labelsCreate = function() {
   return new Float32Array(this.n_regions);
}

/**
 * Propagate a partial labeling to a full (or fuller) labeling by inferring
 * missing region labels according to the label of the closest labeled region
 * in the UCM.
 *
 * @param {array} labels weighted binary partial labeling (will be updated)
 * @param {float} th     maximum merge threshold for propagation (default: 1.0)
 */
UCM.prototype.labelsPropagate = function(labels, th) {
   /* default arguments */
   th = (typeof(th) != "undefined") ? th : 1.0;
   /* propagate labels from leaves to root (process regions in merge order) */
   for (var n = 0; n < this.n_regions; ++n) {
      /* get next region in merge order */
      var reg = this.reg_sort[n];
      var r_id = reg.id;
      /* check merge threshold */
      if (reg.merge_th > th) {
         /* current and future merges exceed threshold */
         break;
      }
      /* check that not already labeled */
      if (labels[r_id] == 0) {
         /* compute min and max label among child regions */
         var lbl_min = 0;
         var lbl_max = 0;
         var child_regions = reg.child_regions;
         for (var c = 0; c < child_regions.length; ++c) {
            var c_lbl = labels[child_regions[c].id];
            lbl_min = Math.min(lbl_min, c_lbl);
            lbl_max = Math.max(lbl_max, c_lbl);
         }
         /* check labeling consistency */
         if (isNaN(lbl_min) || isNaN(lbl_max)) {
            /* inconsistent children */
            labels[r_id] = NaN;
         } else if (lbl_min == lbl_max) {
            /* children agree exactly */
            labels[r_id] = lbl_min;
         } else {
            /* determine winner by label strength */
            var mag_min = Math.abs(lbl_min);
            var mag_max = Math.abs(lbl_max);
            if (mag_min > mag_max) {
               /* negative labeling is stronger */
               labels[r_id] = lbl_min;
            } else if (mag_min < mag_max) {
               /* positive labeling is stronger */
               labels[r_id] = lbl_max;
            } else {
               /* children disagree with same strength (inconsistent) */
               labels[r_id] = NaN;
            }
         }
      }
   }
   /* propagate labels from root to leaves (process in reverse merge order) */
   for (var n = this.n_regions - 1; n >= 0; --n) {
      /* get next region in reverse merge order */
      var reg = this.reg_sort[n];
      var r_id = reg.id;
      /* check if parent label overrules current label */
      if (reg.parent_region != null) {
         var lbl_parent = labels[reg.parent_region.id];
         if (!isNaN(lbl_parent)) {
            if (Math.abs(lbl_parent) > Math.abs(labels[r_id])) {
               /* inherit parent label */
               labels[r_id] = lbl_parent;
            }
         }
      }
   }
   /* replace NaN labels (disagreement) with zero labels (unlabeled) */
   for (var n = 0; n < this.n_regions; ++n) {
      if (isNaN(labels[n]))
         labels[n] = 0;
   }
}
