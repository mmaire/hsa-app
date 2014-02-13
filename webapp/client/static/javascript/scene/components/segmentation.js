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
 * Segmentation.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Segmentation constructor.
 *
 * @class A segmentation consists of a set of possibly overlapping
 *        {@link Region}s organized into a hierarchy.
 *
 * @constructor
 * @param {ImgData} img image being segmented
 */
function Segmentation(img) {
   /* image data */
   this.img = img;                        /* image being segmented */
   /* region tree */
   this.regions = [];                     /* list of regions in segmentation */
   this.root    = new Region(img);        /* dummy root region of tree */
   /* pixel to region mapping */
   this.px_region_map =
      Segmentation.initPxListMap(img);    /* map: pixels -> region lists */
   this.px_index_map =
      Segmentation.initPxListMap(img);    /* map: pixels -> region indices */
   /* rendering data */
   this.renderers = {};
}

/*****************************************************************************
 * Initialization helper functions.
 *****************************************************************************/

/**
 * Initialization of pixel -> list mapping.
 * Allocate an empty list for each pixel in the segmentation.
 *
 * @param   {ImgData} img image being segmented
 * @returns {array}       map: pixel id -> (empty) list
 */
Segmentation.initPxListMap = function(img) {
   /* get image size */
   var sx = img.sizeX();
   var sy = img.sizeY();
   var n_pixels = sx * sy;
   /* initialize pixel to list mapping */
   var px_map = new Array(n_pixels);
   for (var n = 0; n < n_pixels; ++n)
      px_map[n] = [];
   return px_map;
}

/*****************************************************************************
 * Serialization and deserialization.
 *****************************************************************************/

/**
 * Serialize a segmentation to a datastream.
 *
 * @param {DataStream} ds datastream to which to write segmentation
 */
Segmentation.prototype.serialize = function(ds) {
   /* store number of regions */
   var n_regions = this.regions.length;
   ds.writeUint32(n_regions);
   /* store contents of each region */
   for (var r_id = 0; r_id < n_regions; ++r_id) {
      /* get region */
      var reg = this.regions[r_id];
      /* store id of parent region */
      var p_id =
         (reg.parent_region == this.root) ? (-1) : (reg.parent_region.id);
      ds.writeInt32(p_id);
      /* store rank */
      ds.writeFloat64(reg.rank);
      /* store pixels in region */
      var seq = ArrUtil.seqCompress(reg.pixels, 1, Uint32Array);
      ArrUtil.seqSerialize(ds, seq);
      /* store scribble data */
      if (reg.scrib_data != null) {
         ds.writeUint32(1);
         reg.scrib_data.serialize(ds);
      }
      /* store region attributes */
      var reg_attribs = reg.reg_attribs;
      if (reg_attribs != null) {
         /* write flag indicating attributes exist */
         ds.writeUint32(1);
         /* store region name */
         ds.writeUint32(reg_attribs.name.length);
         ds.writeString(reg_attribs.name, null, reg_attribs.name.length + 1);
         /* store region color */
         ds.writeFloat64Array(reg_attribs.color);
      } else {
         /* write flag indicating attributes do not exist */
         ds.writeUint32(0);
      }
      /* FIXME: store pixel attributes */
   }
}

/**
 * Deserialize a segmentation of the given image from a datastream.
 *
 * @param   {ImgData}      img image being segmented
 * @param   {DataStream}   ds  datastream from which to read segmentation
 * @returns {Segmentation}     segmentation created from datastream
 */
Segmentation.deserialize = function(img, ds) {
   /* create empty segmentation for image */
   var seg = new Segmentation(img);
   /* load number of regions */
   var n_regions = ds.readUint32();
   /* allocate arrays for storing region parents and ranks */
   var parents = new Array(n_regions);
   var ranks   = new Array(n_regions);
   /* load contents of each region */
   for (var r_id = 0; r_id < n_regions; ++r_id) {
      /* load id of parent region */
      var p_id = ds.readInt32();
      parents[r_id] = p_id;
      /* load rank of region */
      var rank = ds.readFloat64();
      ranks[r_id] = rank;
      /* load pixels in region */
      var seq = ArrUtil.seqDeserialize(ds);
      var pixels = ArrUtil.seqDecompress(seq);
      /* create region from pixels and add to segmentation */
      var reg = seg.createRegion(pixels);
      /* check if region has scribble data */
      var has_scrib_data = ds.readUint32();
      if (has_scrib_data != 0) {
         /* load scribble data */
         reg.scrib_data = ScribbleData.deserialize(ds);
      }
      /* check if region attributes exist in datastream */
      var has_reg_attribs = ds.readUint32();
      if (has_reg_attribs != 0) {
         /* enable region attributes */
         reg.enableRegionAttributes();
         var reg_attribs = reg.reg_attribs;
         /* load region attributes */
         var name_length = ds.readUint32();
         var name = ds.readString(name_length + 1);
         name = name.substring(0, name_length);
         reg_attribs.setName(name);
         /* load region color */
         var color = ds.readFloat64Array(4);
         reg_attribs.setColor(color);
      }
      /* FIXME: load pixel attributes */
   }
   /* reassign region parents */
   for (var r_id = 0; r_id < n_regions; ++r_id) {
      var p_id = parents[r_id];
      var p = (p_id < 0) ? (seg.root) : (seg.regions[p_id]);
      seg.regions[r_id].setParentRegion(p);
   }
   /* reassign region ranks */
   for (var r_id = 0; r_id < n_regions; ++r_id) {
      var rank = ranks[r_id];
      seg.regions[r_id].setRank(rank);
   }
   return seg;
}

/*****************************************************************************
 * Image access.
 *****************************************************************************/

/**
 * Get image being segmented.
 *
 * @returns {ImgData} image
 */
Segmentation.prototype.getImage = function() {
   return this.img;
}

/*****************************************************************************
 * Segmentation region access.
 *****************************************************************************/

/**
 * Get number of regions in segmentation.
 *
 * @returns {int} number of regions
 */
Segmentation.prototype.countRegions = function() {
   return this.regions.length;
}

/**
 * Get number of base regions in segmentation.
 *
 * @returns {int} number of regions at top level of hierarchy
 */
Segmentation.prototype.countBaseRegions = function() {
   return this.root.child_regions.length;
}

/**
 * Get the root region of the hiearchical region tree.
 *
 * @returns {Region} root region
 */
Segmentation.prototype.getRootRegion = function() {
   return this.root;
}

/**
 * Get list of base regions in segmentation.
 *
 * @returns {array} regions at top level of hierarchy
 */
Segmentation.prototype.getBaseRegions = function() {
   return this.root.child_regions;
}

/**
 * Get list of regions in segmentation.
 *
 * @returns {array} regions in segmentation
 */
Segmentation.prototype.getRegions = function() {
   return this.regions;
}

/**
 * Get region by id.
 *
 * @param   {int}    id region id in segmentation
 * @returns {Region}    region with given id
 */
Segmentation.prototype.getRegion = function(id) {
   return this.regions[id];
}

/**
 * Check whether specified region is the dummy root region.
 *
 * @param   {Region} r region
 * @returns {bool}     is region the root of the hierarchy?
 */
Segmentation.prototype.isRootRegion = function(r) {
   return (r == this.root);
}

/*****************************************************************************
 * Segmentation region manipulation.
 *****************************************************************************/

/**
 * Create a region containing the specified pixels and add it as a base region
 * in the segmentation.  If no pixels are given, create an empty region.
 *
 * Return the created region.
 *
 * @param   {array}  pixels ids of pixels in region (default: [])
 * @returns {Region}        region in segmentation
 */
Segmentation.prototype.createRegion = function(pixels) {
   pixels = (typeof(pixels) != "undefined") ? pixels : [];
   var r = new Region(this, pixels);
   return r;
}

/**
 * Create a region containing the specified pixels and add it as a child of
 * an existing region in the segmentation.   If no pixels are given, create an
 * empty region.
 *
 * Return the created region.
 *
 * @param   {int}    r_parent_id id of parent region in segmentation
 * @param   {array}  pixels      ids of pixels in region (default: [])
 * @returns {Region}             region in segmentation
 */
Segmentation.prototype.createChildRegion = function(r_parent_id, pixels) {
   pixels = (typeof(pixels) != "undefined") ? pixels : [];
   var r = new Region(this.img, pixels);
   r.connectSegmentation(this, this.regions[r_parent_id]);
   return r;
}

/**
 * Remove the specified region from the segmentation.
 * Reorder regions by replacing the removed region with the last region.
 *
 * Return the removed region.
 *
 * @param   {int}    r_id id of region to remove
 * @returns {Region}      removed region
 */
Segmentation.prototype.removeRegion = function(r_id) {
   var r = this.regions[r_id];
   r.removeFromSegmentation();
   return r;
}

/**
 * Remove a set of regions from the segmentation.
 *
 * Regions are removed in order of largest id to smallest, and the ids of the
 * remaining regions are adjusted accordingly.
 *
 * Return a list of the removed regions.
 *
 * @param   {array} r_ids ids of regions to remove
 * @returns {array}       list of removed regions
 */
Segmentation.prototype.removeRegions = function(r_ids) {
   /* sort region ids */
   r_ids_sorted = ArrUtil.clone(r_ids);
   ArrUtil.sort(r_ids_sorted, function(a,b){return b-a;});
   /* remove regions */
   var rs = new Array(r_ids_sorted.length);
   for (var n = 0; n < r_ids_sorted.length; ++n)
      rs[n] = this.removeRegion(r_ids_sorted[n]);
   return rs;
}

/**
 * Merge multiple regions in the segmentation.
 *
 * Merge all regions in the given list into the first region and reassign
 * children of the merged regions to be children of the first region.
 *
 * Return the merged region and destroy the leftover ones.
 * Return null if the set of regions to merge is empty.
 *
 * @param   {array} r_ids ids of regions to merge
 * @returns {Region}      merged region
 */
Segmentation.prototype.mergeRegions = function(r_ids) {
   /* get list of regions to merge */
   var r_list = new Array(r_ids.length);
   for (var n = 0; n < r_ids.length; ++n)
      r_list[n] = this.regions[r_ids[n]];
   /* check that merge involves at least two regions */
   if (r_list.length == 0)
      return null;
   else if (r_list.length == 1)
      return r_list[0];
   /* count total number of pixels in regions */
   var count = 0;
   for (var n = 0; n < r_list.length; ++n)
      count += r_list[n].pixels.length;
   /* compute union of pixel sets */
   var pixels = new Array(count);
   for (var n = 0, pos = 0; n < r_list.length; ++n) {
      var r = r_list[n];
      for (var p = 0; p < r.pixels.length; ++p)
         pixels[pos++] = r.pixels[p];
   }
   pixels = SetUtil.unique(pixels);
   /* determine whether attributes are active in combined region */
   var px_attribs = null;
   for (var n = 0; n < r_list.length; ++n) {
      var r = r_list[n];
      if (r.px_attribs != null) {
         /* allocate attributes for merged region */
         px_attribs = new PixelAttributes(pixels.length);
         break;
      }
   }
   /* copy attributes from component regions */
   if (px_attribs != null) {
      for (var n = r_list.length - 1; n >= 0; --n) {
         /* get region data */
         var r     = r_list[n];
         var r_px  = r.pixels;
         var r_att = r.px_attribs;
         /* process attributes */
         if (r_att != null) {
            /* compute destination indices for source pixels in region */
            var dst = new Array(r_px.length);
            for (var i = 0, j = 0; (i < pixels.length) && (j < r_px.length);
                 ++i)
            {
               if (pixels[i] == r_px[j])
                  dst[j++] = i;
            }
            /* copy attributes into merged region */
            px_attribs.setAllPacked(dst, r_att);
         }
      }
   }
   /* get region to preserve as merged region */
   var r_merge = r_list[0];
   /* temporarily disconnect pixel attributes and renderers */
   var temp_px_attribs = r_merge.px_attribs;
   var temp_renderers  = r_merge.renderers;
   r_merge.px_attribs = null;
   r_merge.renderers  = null;
   /* update contents of merged region */
   r_merge.setPixels(pixels);
   /* reconnect pixel attributes and renderers */
   r_merge.px_attribs = temp_px_attribs;
   r_merge.renderers  = temp_renderers;
   /* update attributes of merged region */
   if (r_merge.px_attribs != null) {
      /* set fields of merged pixel attributes */
      r_merge.px_attribs.size       = px_attribs.size;
      r_merge.px_attribs.attributes = px_attribs.attributes;
   } else if (px_attribs != null) {
      /* set pixel attributes */
      r_merge.px_attribs = px_attribs;
      /* attach attribute renderers to pixel attributes */
      Renderer.updateAll(r_merge, { name: "attach-pixel-attributes" });
   }
   /* update attached renderers */
   Renderer.updateAll(r_merge, { name: "set-pixels" });
   /* remove and destroy leftover regions */
   for (var n = 1; n < r_list.length; ++n) {
      var r = r_list[n];
      r.removeFromSegmentation(r_merge, true); /* children linked to r_merge */
      Renderer.destroyAll(r);
   }
   return r_merge;
}
