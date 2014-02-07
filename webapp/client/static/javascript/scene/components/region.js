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
 * Region.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Region constructor.
 *
 * @class Regions store properties associated with a set of pixels.
 *        Regions exist in the context of a source image, specified by an
 *        {@link ImgData} object, and may or may not be part of a
 *        {@link Segmentation}.
 *
 * This constructor takes either the image or segmentation in which the region
 * exists as well as (optionally) a list of pixels in the region.  In the
 * absence of the optional pixels argument, an empty region is returned.
 *
 * When creating a region within a segmentation, that region is connected to
 * the segmentation and added to the base level of the segmentation's
 * hierarchical region tree.
 *
 * @constructor
 * @param {ImgData/Segmentation} img_seg containing image or segmentation
 * @param {array}                pixels  ids of pixels in region (optional)
 */
function Region(img_seg, pixels) {
   /* image data */
   this.img = null;                 /* region exists within this image */
   /* segmentation: identity */
   this.seg = null;                 /* segmentation containing region */
   this.id  = 0;                    /* region id within segmentation */
   /* segmentation: region tree */
   this.parent_region = null;       /* parent region (if any) */
   this.parent_index  = 0;          /* position in parent's child list */
   this.child_regions = [];         /* child regions */
   /* segmentation: region depth rank */
   this.rank = 0;                   /* depth rank relative to siblings */
   /* segmentation: region containment */
   this.covering = [];              /* covering regions in segmentation */
   this.covered  = [];              /* covered regions in segmentation */
   /* region contents */
   this.pixels = [];                /* ids of pixels within region */
   this.layers = [];                /* position in each pixel's region list */
   this.bbox   = [0, 0, 0, 0];      /* bounding box around region */
   /* region annotation data */
   this.scrib_data = null;          /* scribble annotation data */
   /* attributes */
   this.px_attribs  = null;         /* pixel-level attributes */
   this.reg_attribs = null;         /* region-level attributes */
   /* renderers */
   this.renderers = {};             /* region renderers */
   /* initialize link to containing image */
   if (img_seg instanceof ImgData) {
      /* link directly to image */
      this.img = img_seg;
   } else if (img_seg instanceof Segmentation) {
      /* link to same image as containing segmentation */
      this.img = img_seg.img;
   } else {
      throw ("new Region must be linked to ImgData or Segmentation");
   }
   /* initialize link to segmentation */
   if (img_seg instanceof Segmentation)
      this.connectSegmentation(img_seg);
   /* initialize region contents */
   if (typeof(pixels) != "undefined")
      this.setPixels(pixels);
}

/*****************************************************************************
 * Image access.
 *****************************************************************************/

/**
 * Get image in which region exists.
 *
 * @returns {ImgData} image
 */
Region.prototype.getImage = function() {
   return this.img;
}

/*****************************************************************************
 * Segmentation manipulation.
 *****************************************************************************/

/**
 * Connect the region and all of its descendants to the given segmentation,
 * placing it as a child of the specified parent in the region tree.  If no
 * parent region is given, place it as a child of the root region in the
 * segmentation.
 *
 * As regions are added, change their ids to the next available id in the
 * segmentation.
 *
 * By default, place the connecting region behind its siblings by changing its
 * rank to be one unit greater than the largest rank of its siblings.  This
 * behavior can be overridden by specifying a non-null rank argument.
 *
 * Note that the region and its descendants are first disconnected from any
 * currently connected segmentation.
 *
 * @param {Segmentation} seg      segmentation to connect
 * @param {Region}       r_parent parent in segmentation (default: seg.root)
 * @param {float}        rank     rank relative to siblings (default: null)
 */
Region.prototype.connectSegmentation = function(seg, r_parent, rank) {
   /* default arguments */
   r_parent = (typeof(r_parent) != "undefined") ? r_parent : seg.root;
   rank = (typeof(rank) != "undefined") ? rank : null;
   /* compute rank if using default of placing connecting region last */
   if (rank == null) {
      /* get target sibling regions */
      var siblings = r_parent.child_regions;
      /* compute rank */
      if (siblings.length == 0) {
         rank = 0;
      } else {
         /* find maximum rank of siblings */
         rank = siblings[0].rank;
         for (var n = 1; n < siblings.length; ++n) {
            var sib_rank = siblings[n].rank;
            if (sib_rank > rank) { rank = sib_rank; }
         }
         /* increment rank */
         ++rank;
      }
   }
   /* disconnect existing segmentation (if any) */
   this.disconnectSegmentation();
   /* connect to specified segmentation */
   this.seg = seg;
   this.id  = seg.regions.length;
   seg.regions[this.id] = this;
   /* set parent within segmentation (if needed) */
   if (this.parent_region != r_parent) /* required for handling descendants */
      this.setParentRegion(r_parent);
   /* set rank relative to siblings */
   this.rank = rank;
   /* initialize pixel overlap count */
   var n_regions = this.seg.regions.length;
   var overlap = new Array(n_regions);
   for (var n = 0; n < n_regions; ++n)
      overlap[n] = 0;
   /* update segmentation region map and count pixel overlap */
   for (var n = 0; n < this.pixels.length; ++n) {
      /* get id of pixel */
      var p_id = this.pixels[n];
      /* get regions containing pixel */
      var regs = this.seg.px_region_map[p_id];
      var inds = this.seg.px_index_map[p_id];
      /* update layer map */
      this.layers[n] = regs.length;
      /* add current region to containing regions */
      regs[regs.length] = this.id;
      inds[inds.length] = n;
      /* tally overlap */
      for (var o = 0; o < regs.length; ++o)
         ++(overlap[regs[o]]);
   }
   /* initialize covering and covered regions */
   this.covering = new Array(n_regions);
   this.covered  = new Array(n_regions);
   var n_covering = 0;
   var n_covered  = 0;
   /* determine covering and covered regions */
   for (var n = 0; n < n_regions; ++n) {
      if (n != this.id) {
         /* check if region covers current region */
         if (overlap[n] == this.pixels.length)
            this.covering[n_covering++] = this.seg.regions[n];
         /* check if region is covered by current region */
         if (overlap[n] == this.seg.regions[n].pixels.length)
            this.covered[n_covered++] = this.seg.regions[n];
      }
   }
   /* trim covering and covered lists to correct length */
   this.covering.length = n_covering;
   this.covered.length  = n_covered;
   /* update relationships with covering regions */
   for (var n = 0; n < n_covering; ++n) {
      var r = this.covering[n];
      r.covered[r.covered.length] = this;
   }
   /* update relationships with covered regions */
   for (var n = 0; n < n_covered; ++n) {
      var r = this.covered[n];
      r.covering[r.covering.length] = this;
   }
   /* notify attached renderers of segmentation update */
   Renderer.updateAll(this.seg, { name: "region-add" });
   /* add child regions to segmentation with current region as parent */
   for (var n = 0; n < this.child_regions.length; ++n) {
      var r_child = this.child_regions[n];
      r_child.connectSegmentation(seg, this, r_child.rank);
   }
}

/**
 * Disconnect the region and all of its descendants from any connected
 * segmentation.
 *
 * Reorder remaining regions in the segmentation by replacing, as they are
 * disconnected, removed regions with the last (highest id) region in the
 * segmentation.
 */
Region.prototype.disconnectSegmentation = function() {
   /* check for connected segmentation */
   if (this.seg != null) {
      /* determine whether to unlink region from its parent */
      var unlink =
         (this.parent_region != null) &&
            ((this.parent_region.seg != null) ||
             (this.parent_region == this.seg.root));
      /* remove region from segmentation, but keep its children linked to it */
      this.removeFromSegmentation(this, unlink);
      /* disconnect children from segmentation */
      for (var n = 0; n < this.child_regions.length; ++n)
         this.child_regions[n].disconnectSegmentation();
   }
}

/**
 * Remove the region from the segmentation, but leave its descendants.
 *
 * Connect the removed region's child regions to the specified parent region.
 * If no parent is specified, connect them to their grandparent in the
 * segmentation (removed region's parent).
 *
 * @param {Region} r_parent new parent of children (default: region's parent)
 * @param {bool}   unlink   unlink region from its parent? (default: true)
 */
Region.prototype.removeFromSegmentation = function(r_parent, unlink) {
   /* default arguments */
   r_parent = (typeof(r_parent) != "undefined") ? r_parent : this.parent_region;
   unlink   = (typeof(unlink) != "undefined") ? unlink : true;
   /* check for connected segmentation */
   if (this.seg != null) {
      /* unlink from parent (if requested) */
      if (unlink)
         this.setParentRegion(null);
      /* link children to their new parent (if it has changed) */
      if (r_parent != this) {
         var children = ArrUtil.clone(this.child_regions);
         for (var n = 0; n < children.length; ++n)
            children[n].setParentRegion(r_parent);
      }
      /* update segmentation region map - remove current region */
      for (var n = 0; n < this.pixels.length; ++n) {
         /* get id and layer of pixel */
         var p_id  = this.pixels[n];
         var layer = this.layers[n];
         /* get regions containing pixel */
         var regs = this.seg.px_region_map[p_id];
         var inds = this.seg.px_index_map[p_id];
         /* get last region in list */
         var r = regs[regs.length - 1];
         var i = inds[inds.length - 1];
         /* move last region in list to current position */
         regs[layer] = r;
         inds[layer] = i;
         --(regs.length);
         --(inds.length);
         /* update layer within moved region */
         this.seg.regions[r].layers[i] = layer;
         /* zero out layer map for current region */
         this.layers[n] = 0;
      }
      /* remove from covered list of covering regions */
      for (var n = 0; n < this.covering.length; ++n) {
         var r = this.covering[n];
         for (var c = 0; c < r.covered.length; ++c) {
            if (r.covered[c] == this) {
               r.covered[c] = r.covered[r.covered.length - 1];
               break;
            }
         }
         --(r.covered.length);
      }
      /* remove from covering list of covered regions */
      for (var n = 0; n < this.covered.length; ++n) {
         var r = this.covered[n];
         for (var c = 0; c < r.covering.length; ++c) {
            if (r.covering[c] == this) {
               r.covering[c] = r.covering[r.covering.length - 1];
               break;
            }
         }
         --(r.covering.length);
      }
      /* clear region containment lists */
      this.covering = [];
      this.covered  = [];
      /* update region list - replace current region with last region */
      var r_last = this.seg.regions[this.seg.regions.length - 1];
      r_last.id  = this.id;
      this.seg.regions[this.id] = r_last;
      --(this.seg.regions.length);
      /* update segmentation region map - update id of last region */
      if (r_last != this) {
         /* moved region is still valid - update its mapping */
         for (var n = 0; n < r_last.pixels.length; ++n) {
            var p_id  = r_last.pixels[n];
            var layer = r_last.layers[n];
            this.seg.px_region_map[p_id][layer] = r_last.id;
         }
      }
      /* notify attached renderers of segmentation update */
      Renderer.updateAll(this.seg, { name: "region-remove", id: this.id });
      /* unlink segmentation from region */
      this.seg = null;
      this.id  = 0;
   } else {
      throw ("cannot remove region from segmentation when it is not in one");
   }
}

/**
 * Check if the region is connected to a segmentation.
 *
 * @returns {bool} is region in a segmentation?
 */
Region.prototype.hasSegmentation = function() {
   return (this.seg != null);
}

/**
 * Get the segmentation (if any) containing the region.
 * Return null if the region is not connected to a segmentation.
 *
 * @returns {Segmentation} segmentation containing region
 */
Region.prototype.getSegmentation = function() {
   return this.seg;
}

/**
 * Get region id within segmentation.
 *
 * @returns {int} region id
 */
Region.prototype.getRegionId = function() {
   return this.id;
}

/**
 * Check if the region is a base region in the segmentation.
 * Base regions have the dummy root node as their parent.
 *
 * @returns {bool} is region a top-level region in the segmentation?
 */
Region.prototype.isBaseRegion = function() {
   /* check for connected segmentation */
   if (this.seg != null) {
      /* in a segmentation - check if base region */
      return (this.parent_region == this.seg.root);
   } else {
      /* not in a segmentation */
      return false;
   }
}

/**
 * Check if the region has a parent in the segmentation.
 * NOTE: Only the dummy root region has no parent.
 *       Use the previous method to check if a region is a base region.
 *
 * @returns {bool} does region have a parent?
 */
Region.prototype.hasParentRegion = function() {
   return (this.parent_region != null);
}

/**
 * Check if the region has one or more child regions in the segmentation.
 *
 * @returns {bool} does the region have children?
 */
Region.prototype.hasChildRegions = function() {
   return (this.child_regions.length > 0);
}

/**
 * Check if the region has one or more sibling regions in the segmentation.
 *
 * @returns {bool} does the region have siblings?
 */
Region.prototype.hasSiblingRegions = function() {
   /* check for existance of parent */
   if (this.parent_region != null) {
      /* check for multiple children of parent */
      return (this.parent_region.child_regions.length > 1);
   } else {
      /* no parent and hence no siblings */
      return false;
   }
}

/**
 * Get the number of child regions in the segmentation.
 *
 * @returns {int} number of children
 */
Region.prototype.countChildren = function() {
   return this.child_regions.length;
}

/**
 * Get the number of sibling regions in the segmentation.
 *
 * @returns {int} number of siblings
 */
Region.prototype.countSiblings = function() {
   /* check for existance of parent */
   if (this.parent_region != null) {
      /* return number of siblings */
      return (this.parent_region.child_regions.length - 1);
   } else {
      /* no parent and hence no siblings */
      return 0;
   }
}

/**
 * Get parent region (if any) in the segmentation.
 * Return null if the region has no parent.
 *
 * @returns {Region} parent region
 */
Region.prototype.getParentRegion = function() {
   return this.parent_region;
}

/**
 * Get child regions in the segmentation.
 *
 * @returns {array} child regions
 */
Region.prototype.getChildRegions = function() {
   return this.child_regions;
}

/**
 * Construct and return a list of sibling regions in the segmentation.
 * The region itself is NOT included in this list.
 *
 * @returns {array} sibling regions
 */
Region.prototype.getSiblingRegions = function() {
   /* get children of parent */
   var r_parent = this.parent_region;
   var children = (r_parent != null) ? (r_parent.child_regions) : [];
   /* construct sibling list */
   var n_sibs = (children.length > 0) ? (children.length - 1) : 0;
   var siblings = new Array(n_sibs);
   for (var n = 0, s = 0; n < n_sibs; ++n) {
      if (children[n] != this)
         siblings[s++] = children[n];
   }
   return siblings;
}

/**
 * Construct and return a list of all ancestor regions in the segmentation.
 *
 * @returns {array} ancestor regions
 */
Region.prototype.getAncestorRegions = function() {
   /* count ancestors */
   var n = 0;
   var r = this.parent_region;
   while (r != null) {
      r = r.parent_region;
      ++n;
   }
   /* construct ancestor list */
   var ancestors = new Array(n);
   n = 0;
   r = this.parent_region;
   while (r != null) {
      ancenstors[n++] = r;
      r = r.parent_region;
   }
   return ancestors;
}

/**
 * Construct and return a list of all descendant regions in the segmentation.
 *
 * @returns {array} descendant regions
 */
Region.prototype.getDescendantRegions = function() {
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
         nodes[pos] = r;
      } else {
         /* add current node */
         nodes[0] = r;
      }
      return nodes;
   }
   /* collect descendants, remove current node */
   var descendants = collectNodes(this);
   --(descendants.length);
   return descendants;
}

/**
 * Set parent region in the segmentation.
 *
 * @param {Region} r parent region
 */
Region.prototype.setParentRegion = function(r) {
   /* unlink from current parent (if any) */
   if (this.parent_region != null) {
      /* get parent and last child of parent */
      var p = this.parent_region;
      var c = p.child_regions[p.child_regions.length - 1];
      /* move last child of parent into current position */
      p.child_regions[this.parent_index] = c;
      c.parent_index = this.parent_index;
      --(p.child_regions.length);
   }
   /* set parent */
   this.parent_region = r;
   /* link to parent (if any) */
   if (r != null) {
      this.parent_index = r.child_regions.length;
      r.child_regions[this.parent_index] = this;
   } else {
      this.parent_index = 0;
   }
}

/**
 * Set child regions in the segmentation.
 *
 * @param {array} rs child regions
 */
Region.prototype.setChildRegions = function(rs) {
   /* unlink current children */
   for (var n = 0; n < this.child_regions.length; ++n) {
      var c = this.child_regions[n];
      c.parent_region = null;
      c.parent_index = 0;
   }
   /* set child regions */
   this.child_regions = ArrUtil.cloneAs(rs, Array);
   /* link children */
   for (var n = 0; n < this.child_regions.length; ++n) {
      var c = this.child_regions[n];
      c.parent_region = this;
      c.parent_index = n;
   }
}

/**
 * Add a child region in the segmentation.
 *
 * @param {Region} r child region
 */
Region.prototype.addChildRegion = function(r) {
   if (r != null)
      r.setParentRegion(this);
}

/**
 * Get the relative rank of the region in the segmentation, as compared to
 * its siblings.  Within a set of siblings, greater rank indicates a more
 * distant region in the 2.1D segmentation.
 *
 * @returns {float} region rank
 */
Region.prototype.getRank = function() {
   return this.rank;
}

/**
 * Set the relative rank of the region in the segmentation, as compared to
 * its siblings.  Within a set of siblings, greater rank indicates a more
 * distant region in the 2.1D segmentation.
 *
 * @param {float} rank region rank
 */
Region.prototype.setRank = function(rank) {
   this.rank = rank;
}

/**
 * Move the region forward (closer) by swapping its rank with that of the
 * sibling immediately in front of it.
 *
 * If no closer sibling region exists, do not change the rank.
 */
Region.prototype.moveRankForward = function() {
   /* get children of parent */
   var r_parent = this.parent_region;
   var children = (r_parent != null) ? (r_parent.child_regions) : [];
   /* search for sibling immediately in front of region */
   var sib = null;
   for (var n = 0; n < children.length; ++n) {
      var child = children[n];
      if ((child.rank < this.rank) &&
          ((sib == null) || (child.rank > sib.rank)))
      { sib = child; }
   }
   /* swap rank with closer sibling */
   if (sib != null) {
      var temp   = this.rank;
      this.rank = sib.rank;
      sib.rank  = temp;
   }
}

/**
 * Move the region back (farther away) by swapping its rank with that of the
 * sibling immediately behind it.
 *
 * If no farther sibling region exists, do not change the rank.
 */
Region.prototype.moveRankBackward = function() {
   /* get children of parent */
   var r_parent = this.parent_region;
   var children = (r_parent != null) ? (r_parent.child_regions) : [];
   /* search for sibling immediately in front of region */
   var sib = null;
   for (var n = 0; n < children.length; ++n) {
      var child = children[n];
      if ((child.rank > this.rank) &&
          ((sib == null) || (child.rank < sib.rank)))
      { sib = child; }
   }
   /* swap rank with farther sibling */
   if (sib != null) {
      var temp   = this.rank;
      this.rank = sib.rank;
      sib.rank  = temp;
   }
}

/*****************************************************************************
 * Region content manipulation.
 *****************************************************************************/

/**
 * Get pixels belonging to region.
 *
 * Return the ids of the pixels in the region, where each pixel's id is its
 * linear index into the 2D image matrix (viewed as a vector).
 *
 * @returns {array} pixel ids (linear image coordinates)
 */
Region.prototype.getPixels = function() {
   return this.pixels;
}

/**
 * Set pixels belonging to region.
 *
 * Define the region to contain the given pixels, as specified by their linear
 * indices into the 2D image matrix (viewed as a vector).
 *
 * This method preserves attributes defined on pixels that remain in the region
 * (pixels that are both currently in the region and in the new definition).
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Region.prototype.setPixels = function(pixels) {
   /* transfer pixel attributes */
   if (this.px_attribs != null) {
      /* get size of pixel sets */
      var len_dst = pixels.length;
      var len_src = this.pixels.length;
      /* allocate index maps for attribute transfer */
      var dst = new Array(len_dst);
      var src = new Array(len_dst); /* at most one source per destination */
      /* compute index mapping for attribute transfer */
      var i = 0;
      var j = 0;
      var k = 0;
      while ((i < len_dst) && (j < len_src)) {
         /* advance through destination pixel set */
         while ((i < len_dst) && (pixels[i] < this.pixels[j])) { ++i; }
         if (i == len_dst) { break; }
         /* advance through source pixel set */
         while ((j < len_src) && (this.pixels[j] < pixels[i])) { ++j; }
         if (j == len_src) { break; }
         /* test potential match */
         if (pixels[i] == this.pixels[j]) {
            /* update index mapping */
            dst[k] = i;
            src[k] = j;
            /* increment position */
            ++i;
            ++j;
            ++k;
         }
      }
      /* trim index maps to correct size */
      dst.length = k;
      src.length = k;
      /* allocate attributes for destination pixel set */
      var px_attribs = new PixelAttributes(len_dst);
      /* transfer attributes */
      px_attribs.setAll(dst, src, this.px_attribs);
      /* steal attribute data structures */
      this.px_attribs.size       = px_attribs.size;
      this.px_attribs.attributes = px_attribs.attributes;
   }
   /* remove current pixels from segmentation region map */
   if (this.seg != null) {
      for (var n = 0; n < this.pixels.length; ++n) {
         /* get id and layer of pixel */
         var p_id  = this.pixels[n];
         var layer = this.layers[n];
         /* get regions containing pixel */
         var regs = this.seg.px_region_map[p_id];
         var inds = this.seg.px_index_map[p_id];
         /* get last region in list */
         var r = regs[regs.length - 1];
         var i = inds[inds.length - 1];
         /* move last region in list to current position */
         regs[layer] = r;
         inds[layer] = i;
         --(regs.length);
         --(inds.length);
         /* update layer within moved region */
         this.seg.regions[r].layers[i] = layer;
      }
   }
   /* replace pixel set */
   this.pixels        = ArrUtil.cloneAs(pixels, Array);
   this.layers.length = this.pixels.length;
   /* remove from covered list of covering regions */
   for (var n = 0; n < this.covering.length; ++n) {
      var r = this.covering[n];
      for (var c = 0; c < r.covered.length; ++c) {
         if (r.covered[c] == this) {
            r.covered[c] = r.covered[r.covered.length - 1];
            break;
         }
      }
      --(r.covered.length);
   }
   /* remove from covering list of covered regions */
   for (var n = 0; n < this.covered.length; ++n) {
      var r = this.covered[n];
      for (var c = 0; c < r.covering.length; ++c) {
         if (r.covering[c] == this) {
            r.covering[c] = r.covering[r.covering.length - 1];
            break;
         }
      }
      --(r.covering.length);
   }
   /* update segmentation region map and region containment relationships */
   if (this.seg != null) {
      /* initialize pixel overlap count */
      var n_regions = this.seg.regions.length;
      var overlap = new Array(n_regions);
      for (var n = 0; n < n_regions; ++n)
         overlap[n] = 0;
      /* examine pixels within region */
      for (var n = 0; n < this.pixels.length; ++n) {
         /* get id of pixel */
         var p_id = this.pixels[n];
         /* get regions containing pixel */
         var regs = this.seg.px_region_map[p_id];
         var inds = this.seg.px_index_map[p_id];
         /* update layer map */
         this.layers[n] = regs.length;
         /* add current region to containing regions */
         regs[regs.length] = this.id;
         inds[inds.length] = n;
         /* tally overlap */
         for (var o = 0; o < regs.length; ++o)
            ++(overlap[regs[o]]);
      }
      /* initialize covering and covered regions */
      this.covering = new Array(n_regions);
      this.covered  = new Array(n_regions);
      var n_covering = 0;
      var n_covered  = 0;
      /* determine covering and covered regions */
      for (var n = 0; n < n_regions; ++n) {
         if (n != this.id) {
            /* check if region covers current region */
            if (overlap[n] == this.pixels.length)
               this.covering[n_covering++] = this.seg.regions[n];
            /* check if region is covered by current region */
            if (overlap[n] == this.seg.regions[n].pixels.length)
               this.covered[n_covered++] = this.seg.regions[n];
         }
      }
      /* trim covering and covered lists to correct length */
      this.covering.length = n_covering;
      this.covered.length  = n_covered;
      /* update relationships with covering regions */
      for (var n = 0; n < n_covering; ++n) {
         var r = this.covering[n];
         r.covered[r.covered.length] = this;
      }
      /* update relationships with covered regions */
      for (var n = 0; n < n_covered; ++n) {
         var r = this.covered[n];
         r.covering[r.covering.length] = this;
      }
   } else {
      /* clear region containment lists */
      this.covering = [];
      this.covered  = [];
   }
   /* recompute bounding box */
   this.bbox = ImgUtil.bboxFromPixels(this.img.sizeY(), pixels);
   /* notify attached renderers of region update */
   Renderer.updateAll(this, { name: "set-pixels" });
}

/**
 * Add pixels to region.
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Region.prototype.addPixels = function(pixels) {
   var px = SetUtil.union(this.pixels, pixels);
   this.setPixels(px);
}

/**
 * Remove pixels from region.
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Region.prototype.removePixels = function(pixels) {
   var px = SetUtil.setdiff(this.pixels, pixels);
   this.setPixels(px);
}

/*****************************************************************************
 * Pixel attribute manipulation.
 *****************************************************************************/

/**
 * Enable storage of per-pixel attributes over the region.
 * If pixel attributes are already enabled, this method has no effect.
 */
Region.prototype.enablePixelAttributes = function() {
   /* check whether pixel attributes exist */
   if (this.px_attribs == null) {
      /* initialize pixel attributes */
      this.px_attribs = new PixelAttributes(this.pixels.length);
      /* update rendering of pixel attributes */
      Renderer.updateAll(this, { name: "enable-pixel-attributes" });
   }
}

/**
 * Disable storage of per-pixel attributes and wipe any existing attributes.
 * If pixel attributes are not currently stored, this method has no effect.
 */
Region.prototype.disablePixelAttributes = function() {
   /* check whether pixel attributes exist */
   if (this.px_attribs != null) {
      /* clear existing pixel attributes */
      this.px_attribs = null;
      /* update rendering of pixel attributes */
      Renderer.updateAll(this, { name: "disable-pixel-attributes" });
   }
}

/**
 * Get the region's pixel attribute data structure.
 * Return null if pixel attributes are not enabled.
 *
 * @returns {PixelAttributes} pixel attributes
 */
Region.prototype.getPixelAttributes = function() {
   return this.px_attribs;
}

/*****************************************************************************
 * Region attribute manipulation.
 *****************************************************************************/

/**
 * Enable storage of region attributes.
 * If region attributes are already enabled, this method has no effect.
 */
Region.prototype.enableRegionAttributes = function() {
   /* check whether region attributes exist */
   if (this.reg_attribs == null) {
      /* initialize region attributes */
      this.reg_attribs = new RegionAttributes();
      /* update rendering of region attributes */
      Renderer.updateAll(this, { name: "enable-region-attributes" });
   }
}

/**
 * Disable storage of region attributes and wipe any existing attributes.
 * If region attributes are not currently stored, this method has no effect.
 */
Region.prototype.disableRegionAttributes = function() {
   /* check whether region attributes exist */
   if (this.reg_attribs != null) {
      /* clear existing region attributes */
      this.reg_attribs = null;
      /* update rendering of region attributes */
      Renderer.updateAll(this, { name: "disable-region-attributes" });
   }
}

/**
 * Get the region attribute data structure.
 * Return null if region attributes are not enabled.
 *
 * @returns {RegionAttributes} region attributes
 */
Region.prototype.getRegionAttributes = function() {
   return this.reg_attribs;
}
