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
 * Segmentation renderer.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Segmentation renderer constructor.
 *
 * @class A segmentation renderer controls the display of the set of regions
 *        comprising a {@link Segmentation} object on the canvas within a
 *        {@link RenderContext}.
 *
 * This renderer draws either the entire region tree (the default) or a subtree
 * starting from a user-specified node.  The regions drawn are expanded to fill
 * a prespecified z-depth range, with z-ordering ordering determined by the
 * relative rank between siblings and the parent/child inclusion relationships
 * among regions.
 *
 * Additionally, users may individually specify whether each node encountered
 * in the region tree is to be expanded.  Subregions of unexpanded parents are
 * hidden from view.  All regions default to being expanded.
 *
 * This renderer shares resources with image and region renders associated with
 * the contents of the segmentation.  A user may specify tags to control which
 * region and image renderers are used.  If renderers with those tags do not
 * already exist, they are dynamically created as needed.
 *
 * @constructor
 * @param {RenderContext} ctxt    rendering context
 * @param {Segmentation}  seg     segmentation to display
 * @param {string}        tag     renderer name (optional)
 * @param {string}        tag_reg region renderer names (optional)
 * @param {string}        tag_img image renderer name (optional)
 */
function SegmentationRenderer(ctxt, seg, tag, tag_reg) {
   /* default arguments */
   tag     = (typeof(tag)     != "undefined") ? tag     : Renderer.TAG_DEFAULT;
   tag_reg = (typeof(tag_reg) != "undefined") ? tag_reg : Renderer.TAG_DEFAULT;
   tag_img = (typeof(tag_img) != "undefined") ? tag_img : Renderer.TAG_DEFAULT;
   /* store context and source segmentation */
   this.ctxt = ctxt;                         /* rendering context */
   this.seg  = seg;                          /* segmentation */
   /* store tags to use for region and image renderers */
   this.tag_reg = tag_reg;                   /* tag for region renderers */
   this.tag_img = tag_img;                   /* tag for image renderer */
   /* set default depth projection range */
   this.depth_min = 0.0;                     /* nearest draw depth */
   this.depth_max = 1.0;                     /* farthest draw depth */
   /* set default depth range cutoffs */
   this.fade_min = 0.0;                      /* fade near depth limit */
   this.fade_max = 1.0;                      /* fade far depth limit */
   /* set default transparency values */
   this.alpha = {
      normal   : 0.75,                       /* alpha of normal regions */
      selected : 0.95,                       /* alpha of selected regions */
      faded    : 0.25                        /* alpha of faded regions */
   };
   /* initialize region subtree selection */
   this.root = this.seg.root;                /* root of subtree to draw */
   /* initialize region display options */
   var n_regions = this.seg.countRegions();
   this.reg_expanded = new Array(n_regions); /* is region expanded? */
   this.reg_selected = new Array(n_regions); /* is region selected? */
   this.collapseAllRegions();                /* default: regions collapsed */
   this.deselectAllRegions();                /* default: regions deselected */
   /* attach renderer to segmentation */
   Renderer.attach(seg, this, tag);
}

/*****************************************************************************
 * Segmentation display options: depth rendering range.
 *****************************************************************************/

/**
 * Get the near boundary of the rendering depth range.
 *
 * @returns {float} rendering depth range minimum bound
 */
SegmentationRenderer.prototype.getDepthMin = function() {
   return this.depth_min;
}

/**
 * Get the far boundary of the rendering depth range.
 *
 * @returns {float} rendering depth range maximum bound
 */
SegmentationRenderer.prototype.getDepthMax = function() {
   return this.depth_max;
}

/**
 * Set the near boundary of the rendering depth range.
 *
 * @param {float} depth rendering depth range minimum bound
 */
SegmentationRenderer.prototype.setDepthMin = function(depth) {
   this.depth_min = depth;
}

/**
 * Set the far boundary of the rendering depth range.
 *
 * @returns {float} depth rendering depth range maximum bound
 */
SegmentationRenderer.prototype.setDepthMax = function(depth) {
   this.depth_max = depth;
}

/*****************************************************************************
 * Segmentation display options: region transparency.
 *****************************************************************************/

/**
 * Get near fade depth limit.
 * Regions closer than this depth are faded.
 *
 * @returns {float} near fade limit
 */
SegmentationRenderer.prototype.getFadeNear = function() {
   return this.fade_min;
}

/**
 * Get far fade depth limit.
 * Regions farther than this depth are faded.
 *
 * @returns {float} far fade limit
 */
SegmentationRenderer.prototype.getFadeFar = function() {
   return this.fade_max;
}

/**
 * Set near fade depth limit.
 * Regions closer than this depth will be faded.
 *
 * @param {float} depth near fade limit
 */
SegmentationRenderer.prototype.setFadeNear = function(depth) {
   this.fade_min = depth;
}

/**
 * Set far fade depth limit.
 * Regions farther than this depth will be faded.
 *
 * @param {float} depth far fade limit
 */
SegmentationRenderer.prototype.setFadeFar = function(depth) {
   this.fade_max = depth;
}

/**
 * Get transparency value for specified region display mode.
 * If no mode is specified, return the normal transparency.
 *
 * @param   {string} mode display mode ("normal", "selected", or "faded")
 * @returns {float}       transparency of regions in specified mode
 */
SegmentationRenderer.prototype.getAlpha = function(mode) {
   /* default arguments */
   mode = (typeof(mode) != "undefined") ? mode : "normal";
   /* get mode alpha */
   if (mode in this.alpha) {
      return this.alpha[mode];
   } else {
      throw ("attempt to get transparency of invalid region mode: " + mode);
   }
}

/**
 * Set transparency value for specified region display mode.
 * If no mode is specified, set the normal transparency.
 *
 * @param {float}  alpha transparency of regions in specified mode
 * @param {string} mode  display mode ("normal", "selected", or "faded")
 */
SegmentationRenderer.prototype.setAlpha = function(alpha, mode) {
   /* default arguments */
   mode = (typeof(mode) != "undefined") ? mode : "normal";
   /* set mode color */
   if (mode in this.alpha) {
      this.alpha[mode] = alpha;
   } else {
      throw ("attempt to set transparency of invalid region mode: " + mode);
   }
}

/*****************************************************************************
 * Segmentation display options: subtree restriction.
 *****************************************************************************/

/**
 * Get the root region of the subtree being displayed.
 * If the entire segmentation is displayed, return the dummy root region.
 *
 * @returns {Region} root region
 */
SegmentationRenderer.prototype.getRoot = function() {
   return this.root;
}

/**
 * Set the root region of the displayed subtree.
 *
 * @param {int} r_id root region id (or null for entire segmentation)
 */
SegmentationRenderer.prototype.setRoot = function(r_id) {
   if (r_id == null) {
      /* reset root to entire segmentation */
      this.root = this.seg.root;
   } else {
      /* select subtree */
      this.root = this.seg.regions[r_id];
   }
}

/*****************************************************************************
 * Segmentation display options: region expansion.
 *****************************************************************************/

/**
 * Check whether the region with the specified id is expanded.
 *
 * @param   {int}  r_id region id
 * @returns {bool}      is region expanded?
 */
SegmentationRenderer.prototype.isRegionExpanded = function(r_id) {
   return this.reg_expanded[r_id];
}

/**
 * Expand region with the specified id.
 *
 * @param {int} r_id region id
 */
SegmentationRenderer.prototype.expandRegion = function(r_id) {
   this.setExpansionState([r_id], true);
}

/**
 * Expand regions with the specified ids.
 *
 * @param {array} r_ids region ids
 */
SegmentationRenderer.prototype.expandRegions = function(r_ids) {
   this.setExpansionState(r_ids, true);
}

/**
 * Expand all regions in the segmentation.
 */
SegmentationRenderer.prototype.expandAllRegions = function() {
   for (var n = 0; n < this.reg_expanded.length; ++n)
      this.reg_expanded[n] = true;
}

/**
 * Expand regions in the subtree rooted at the specified region.
 *
 * @param {int} r_id region id of subtree root
 */
SegmentationRenderer.prototype.expandSubtree = function(r_id) {
   /* expand subtree root region */
   this.reg_expanded[r_id] = true;
   /* recursively expand children */
   var child_regions = this.seg.regions[r_id].child_regions;
   for (var n = 0; n < child_regions.length; ++n)
      this.expandSubtree(child_regions[n].id);
}

/**
 * Collapse region with the specified id.
 *
 * @param {int} r_id region id
 */
SegmentationRenderer.prototype.collapseRegion = function(r_ids) {
   this.setExpansionState([r_id], false);
}

/**
 * Collapse regions with the specified ids.
 *
 * @param {array} r_ids region ids
 */
SegmentationRenderer.prototype.collapseRegions = function(r_ids) {
   this.setExpansionState(r_ids, false);
}

/**
 * Collapse all regions in the segmentation.
 */
SegmentationRenderer.prototype.collapseAllRegions = function(r_ids) {
   for (var n = 0; n < this.reg_expanded.length; ++n)
      this.reg_expanded[n] = false;
}

/**
 * Collapse regions in the subtree rooted at the specified region.
 *
 * @param {int} r_id region id of subtree root
 */
SegmentationRenderer.prototype.collapseSubtree = function(r_id) {
   /* collapse subtree root region */
   this.reg_expanded[r_id] = false;
   /* recursively collapse children */
   var child_regions = this.seg.regions[r_id].child_regions;
   for (var n = 0; n < child_regions.length; ++n)
      this.collapseSubtree(child_regions[n].id);
}

/**
 * Modify the expandion state of the specified regions.
 *
 * @param {array} r_ids region ids
 * @param {bool}  state expand (true) or collapse (false) regions?
 */
SegmentationRenderer.prototype.setExpansionState = function(r_ids, state) {
   for (var n = 0; n < r_ids.length; ++n)
      this.reg_expanded[r_ids[n]] = state;
}

/*****************************************************************************
 * Segmentation display options: region selection.
 *****************************************************************************/

/**
 * Check whether the region with the specified id is selected.
 *
 * @param   {int}  r_id region id
 * @returns {bool}      is region selected?
 */
SegmentationRenderer.prototype.isRegionSelected = function(r_id) {
   return this.reg_selected[r_id];
}

/**
 * Select region with the specified id.
 *
 * @param {int} r_id region id
 */
SegmentationRenderer.prototype.selectRegion = function(r_id) {
   this.setSelectionState([r_id], true);
}

/**
 * Select regions with the specified ids.
 *
 * @param {array} r_ids region ids
 */
SegmentationRenderer.prototype.selectRegions = function(r_ids) {
   this.setSelectionState(r_ids, true);
}

/**
 * Select all regions in the segmentation.
 */
SegmentationRenderer.prototype.selectAllRegions = function() {
   for (var n = 0; n < this.reg_selected.length; ++n)
      this.reg_selected[n] = true;
}

/**
 * Select regions in the subtree rooted at the specified region.
 *
 * @param {int} r_id region id of subtree root
 */
SegmentationRenderer.prototype.selectSubtree = function(r_id) {
   /* select subtree root region */
   this.reg_selected[r_id] = true;
   /* recursively select children */
   var child_regions = this.seg.regions[r_id].child_regions;
   for (var n = 0; n < child_regions.length; ++n)
      this.selectSubtree(child_regions[n].id);
}

/**
 * Deselect region with the specified id.
 *
 * @param {int} r_id region id
 */
SegmentationRenderer.prototype.deselectRegion = function(r_ids) {
   this.setSelectionState([r_id], false);
}

/**
 * Deselect regions with the specified ids.
 *
 * @param {array} r_ids region ids
 */
SegmentationRenderer.prototype.deselectRegions = function(r_ids) {
   this.setSelectionState(r_ids, false);
}

/**
 * Deselect all regions in the segmentation.
 */
SegmentationRenderer.prototype.deselectAllRegions = function(r_ids) {
   for (var n = 0; n < this.reg_selected.length; ++n)
      this.reg_selected[n] = false;
}

/**
 * Deselect regions in the subtree rooted at the specified region.
 *
 * @param {int} r_id region id of subtree root
 */
SegmentationRenderer.prototype.deselectSubtree = function(r_id) {
   /* deselect subtree root region */
   this.reg_selected[r_id] = false;
   /* recursively deselect children */
   var child_regions = this.seg.regions[r_id].child_regions;
   for (var n = 0; n < child_regions.length; ++n)
      this.deselectSubtree(child_regions[n].id);
}

/**
 * Modify the selection state of the specified regions.
 *
 * @param {array} r_ids region ids
 * @param {bool}  state select (true) or deselect (false) regions?
 */
SegmentationRenderer.prototype.setSelectionState = function(r_ids, state) {
   for (var n = 0; n < r_ids.length; ++n)
      this.reg_selected[r_ids[n]] = state;
}

/*****************************************************************************
 * Segmentation rendering event interface.
 *****************************************************************************/

/**
 * Update rendering to reflect changes in segmentation.
 *
 * @param {Segmentation} obj segmentation object being updated
 * @param {object}       ev  event data
 */
SegmentationRenderer.prototype.update = function(obj, ev) {
   /* determine event type */
   if (ev.name == "region-add") {
      /* initialize display options for additional region */
      this.reg_expanded[this.reg_expanded.length] = false;
      this.reg_selected[this.reg_selected.length] = false;
   } else if (ev.name == "region-remove") {
      /* replace options for removed region with those of last region */
      this.reg_expanded[ev.id] = this.reg_expanded[this.reg_expanded.length];
      this.reg_selected[ev.id] = this.reg_selected[this.reg_selected.length];
      /* shorten arrays for region display options */
      --(this.reg_expanded.length);
      --(this.reg_selected.length);
   } else {
      throw ("invalid SegmentationRenderer update event: " + ev.name);
   }
}

/**
 * Draw segmentation.
 */
SegmentationRenderer.prototype.draw = function() {
   /* draw a region within the segmentation at the specified depth */
   function drawRegion(reg, depth) {
      /* lookup or create region renderer */
      var rndr = Renderer.lookup(reg, this.tag_reg);
      if (rndr == null)
         rndr = new RegionRenderer(this.ctxt, reg, this.tag_reg, this.tag_img);
      /* determine region transparency */
      var is_faded = (depth <= this.fade_min) || (depth >= this.fade_max);
      var alpha =
         (this.reg_selected[reg.id]) ?
            (this.alpha.selected)
          : (is_faded ? this.alpha.faded : this.alpha.normal);
      /* set region display properties */
      rndr.setDepth(depth);
      rndr.setAlpha(alpha);
      /* draw region */
      rndr.draw();
   }
   /* draw branch of region tree */
   function drawBranch(reg, d_min, d_max) {
      /* extract child region (id, rank) pairs */
      var n_children = reg.child_regions.length;
      var child_info = new Array(n_children);
      for (var n = 0; n < n_children; ++n) {
         var r = reg.child_regions[n];
         child_info[n] = { id: r.id, rank: r.rank };
      }
      /* sort child regions in descending order by rank */
      ArrUtil.sort(child_info, function(a,b){return b.rank - a.rank;});
      /* compute depth width and depth block step size */
      var d_width  = d_max - d_min;
      var d_step   = (n_children > 0) ? (d_width / n_children) : 0;
      var d_offset = d_step / 2.0;
      /* recursively draw child regions from back to front */
      var d_lim = d_max;
      for (var n = 0; n < n_children; ++n) {
         /* get child region */
         var id = child_info[n].id;
         var r = seg.regions[id];
         /* compute depth at which to display region */
         var depth = d_lim - d_offset;
         /* draw region */
         drawRegion.call(this, r, depth);
         /* recurse on subregions */
         if (this.reg_expanded[id])
            drawBranch.call(this, r, d_lim - d_step, depth);
         /* increment depth block */
         d_lim -= d_step;
      }
   }
   /* check if restricted to subtree */
   if (this.root != this.seg.root) {
      /* compute depth at which to draw root region */
      var depth_root = (this.depth_min + this.depth_max) / 2.0;
      /* draw subtree root */
      drawRegion.call(this, this.root, depth_root);
      /* recursively draw subtree */
      if (this.reg_expanded[this.root.id])
         drawBranch.call(this, this.root, this.depth_min, depth_root);
   } else {
      /* draw entire segmentation */
      drawBranch.call(this, this.root, this.depth_min, this.depth_max);
   }
}

/**
 * Deallocate segmentation rendering resources.
 * Do nothing as all rendering resources are owned by the underlying regions.
 */
SegmentationRenderer.prototype.destroy = function() { }
