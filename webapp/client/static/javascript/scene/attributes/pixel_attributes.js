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
 * Pixel attributes.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Pixel attributes constructor.
 *
 * @class This class stores a set of binary attributes associated with each
 *        pixel within a {@link Region}.  Attributes are packed into the bits
 *        of texture arrays.
 *
 * @constructor
 * @param {int} size number of pixels
 */
function PixelAttributes(size) {
   /* allocate attribute texture array */
   this.size       = size;
   this.attributes = new Array(PixelAttributes.TEXTURES_PER_PIXEL);
   /* initialize attached renderers */
   this.renderers = {};
   /* initialize attribute textures */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      var txt = new Uint8Array(PixelAttributes.BYTES_PER_TEXTURE * size);
      for (var n = 0; n < txt.length; ++n)
         txt[n] = 0;
      this.attributes[t] = txt;
   }
}

/*****************************************************************************
 * Attribute lookup data structures.
 *****************************************************************************/

/**
 * Generate and return a mapping of (texture, offset) -> attribute id list.
 * This mapping describes the set of attributes stored in each byte addresss.
 *
 * @returns {array} map: (texture, offset) -> attribute id list.
 */
PixelAttributes.generateAttribLayoutMap = function() {
   /* initialize address map */
   var map = new Array(PixelAttributes.TEXTURES_PER_PIXEL);
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      map[t] = new Array(PixelAttributes.BYTES_PER_TEXTURE);
      for (var b = 0; b < PixelAttributes.BYTES_PER_TEXTURE; ++b)
         map[t][b] = [];
   }
   /* fill address map */
   for (var l = 0; l < PixelAttributes.LABELS.length; ++l) {
      var lbl  = PixelAttributes.LABELS[l];
      var list = map[lbl.texture][lbl.offset];
      list[list.length] = lbl.id;
   }
   return map;
}

/**
 * Generate and return a mapping of attribute names to attribute ids.
 *
 * @returns {object} map: attribute name -> attribute id
 */
PixelAttributes.generateAttribIdMap = function() {
   var map = {};
   for (var n = 0; n < PixelAttributes.LABELS.length; ++n)
      map[PixelAttributes.LABELS[n].name] = n;
   return map;
}

/**
 * Generate and return a mapping of group names to group ids.
 *
 * @returns {object} map: group name -> group id
 */
PixelAttributes.generateGroupIdMap = function() {
   var map = {};
   for (var n = 0; n < PixelAttributes.GROUPS.length; ++n)
      map[PixelAttributes.GROUPS[n].name] = n;
   return map;
}

/**
 * Generate and return a mapping of family names to family ids.
 *
 * @returns {object} map: family name -> family id
 */
PixelAttributes.generateFamilyIdMap = function() {
   var map = {};
   for (var n = 0; n < PixelAttributes.FAMILIES.length; ++n)
      map[PixelAttributes.FAMILIES[n].name] = n;
   return map;
}

/**
 * Generate and return a mapping of group ids to the set of attribute ids
 * belonging to each group.
 *
 * @returns {array} map: group id -> list of attribute ids
 */
PixelAttributes.generateGroupAttribLists = function() {
   /* count number of attributes in each group */
   var grp_size = new Array(PixelAttributes.GROUPS.length);
   for (var n = 0; n < PixelAttributes.GROUPS.length; ++n)
      grp_size[n] = 0;
   for (var n = 0; n < PixelAttributes.LABELS.length; ++n) {
      var grps = PixelAttributes.LABELS[n].groups;
      for (var g = 0; g < grps.length; ++g)
         ++grp_size[grps[g]];
   }
   /* initialize arrays of attribute id lists */
   var map     = new Array(PixelAttributes.GROUPS.length);
   var grp_pos = new Array(PixelAttributes.GROUPS.length);
   for (var n = 0; n < PixelAttributes.GROUPS.length; ++n) {
      map[n]     = new Array(grp_size[n]);
      grp_pos[n] = 0;
   }
   /* place attribute ids in groups */
   for (var n = 0; n < PixelAttributes.LABELS.length; ++n) {
      var grps = PixelAttributes.LABELS[n].groups;
      for (var g = 0; g < grps.length; ++g) {
         var grp  = grps[g];
         var list = map[grp];
         list[grp_pos[grp]++] = n;
      }
   }
   return map;
}

/**
 * Generate and return a mapping of family ids to the set of group ids
 * belonging to each family.
 *
 * @returns {array} map: family id -> list of group ids
 */
PixelAttributes.generateFamilyGroupLists = function() {
   /* count number of groups in each family */
   var fam_size = new Array(PixelAttributes.FAMILIES.length);
   for (var n = 0; n < PixelAttributes.FAMILIES.length; ++n)
      fam_size[n] = 0;
   for (var n = 0; n < PixelAttributes.GROUPS.length; ++n)
      ++fam_size[PixelAttributes.GROUPS[n].family];
   /* initialize arrays of group id lists */
   var map     = new Array(PixelAttributes.FAMILIES.length);
   var fam_pos = new Array(PixelAttributes.FAMILIES.length);
   for (var n = 0; n < PixelAttributes.FAMILIES.length; ++n) {
      map[n]     = new Array(fam_size[n]);
      fam_pos[n] = 0;
   }
   /* place group ids in families */
   for (var n = 0; n < PixelAttributes.GROUPS.length; ++n) {
      var fam  = PixelAttributes.GROUPS[n].family;
      var list = map[fam];
      list[fam_pos[fam]++] = n;
   }
   return map;
}

/**
 * Generate and return a mapping of family ids to the set of attribute ids
 * belonging to each family.
 *
 * @returns {array} map: family id -> list of attribute ids
 */
PixelAttributes.generateFamilyAttribLists = function() {
   /* count number of attributes in each family */
   var fam_size = new Array(PixelAttributes.FAMILIES.length);
   for (var n = 0; n < PixelAttributes.FAMILIES.length; ++n)
      fam_size[n] = 0;
   for (var n = 0; n < PixelAttributes.LABELS.length; ++n) {
      var grps = PixelAttributes.LABELS[n].groups;
      for (var g = 0; g < grps.length; ++g) {
         var grp = grps[g];
         var fam = PixelAttributes.GROUPS[grp].family;
         ++fam_size[fam];
      }
   }
   /* initialize arrays of attribute id lists */
   var map     = new Array(PixelAttributes.FAMILIES.length);
   var fam_pos = new Array(PixelAttributes.FAMILIES.length);
   for (var n = 0; n < PixelAttributes.FAMILIES.length; ++n) {
      map[n]     = new Array(fam_size[n]);
      fam_pos[n] = 0;
   }
   /* place attribute ids in families */
   for (var n = 0; n < PixelAttributes.LABELS.length; ++n) {
      var grps = PixelAttributes.LABELS[n].groups;
      for (var g = 0; g < grps.length; ++g) {
         var grp = grps[g];
         var fam = PixelAttributes.GROUPS[grp].family;
         var list = map[fam];
         list[fam_pos[fam]++] = n;
      }
   }
   return map;
}

/*****************************************************************************
 * Attribute information.
 *****************************************************************************/

/**
 * Return the id of the attribute with the given name.
 *
 * @param   {string} name attribute name
 * @returns {int}         attribute id
 */
PixelAttributes.getAttribId = function(name) {
   return PixelAttributes.LABEL_IDS[name];
}

/**
 * Return the name of the attribute with the given id.
 *
 * @param   {int}    attrib attribute id
 * @returns {string}        attribute name
 */
PixelAttributes.getAttribName = function(attrib) {
   return PixelAttributes.LABELS[attrib].name;
}

/**
 * Return the description of the attribute with the given id.
 *
 * @param   {int}    attrib attribute id
 * @returns {string}        attribute description
 */
PixelAttributes.getAttribDescription = function(attrib) {
   return PixelAttributes.LABELS[attrib].desc;
}

/**
 * Return the list of groups to which the given attribute belongs.
 *
 * @param   {int}   attrib attribute id
 * @returns {array}        list of group ids
 */
PixelAttributes.getAttribGroups = function(attrib) {
   return PixelAttributes.LABELS[attrib].groups;
}

/**
 * Return the edit flag for the given attribute.
 * This flag indicates whether users can change the attribute.
 *
 * @param   {int}  attrib attribute id
 * @returns {bool}        edit flag
 */
PixelAttributes.getAttribEdit = function(attrib) {
   return PixelAttributes.LABELS[attrib].edit;
}

/**
 * Return the visualization color for the given attribute.
 *
 * @param   {int}   attrib attribute id
 * @returns {array}        color as RGBA tuple with values in range [0, 255]
 */
PixelAttributes.getAttribColor = function(attrib) {
   return PixelAttributes.LABELS[attrib].color;
}

/**
 * Return the id of the group with the given name.
 *
 * @param   {string} name group name
 * @returns {int}         group id
 */
PixelAttributes.getGroupId = function(name) {
   return PixelAttributes.GROUP_IDS[name];
}

/**
 * Return the name of the group with the given id.
 *
 * @param   {int}    group group id
 * @returns {string}       group name
 */
PixelAttributes.getGroupName = function(group) {
   return PixelAttributes.GROUPS[group].name;
}

/**
 * Return the description of the group with the given id.
 *
 * @param   {int}    group group id
 * @returns {string}       group description
 */
PixelAttributes.getGroupDescription = function(group) {
   return PixelAttributes.GROUPS[group].desc;
}

/**
 * Return the family id to which the given group belongs.
 *
 * @param   {int}    group group id
 * @returns {int}          family id
 */
PixelAttributes.getGroupFamily = function(group) {
   return PixelAttributes.GROUPS[group].family;
}

/**
 * Return the list of attribute ids in the given group.
 *
 * @param   {int}   group group id
 * @returns {array}       list of attribute ids
 */
PixelAttributes.getGroupAttribs = function(group) {
   return PixelAttributes.GROUP_ATTRIBS[group];
}

/**
 * Return the id of the family with the given name.
 *
 * @param   {string} name family name
 * @returns {int}         family id
 */
PixelAttributes.getFamilyId = function(name) {
   return PixelAttributes.FAMILY_IDS[name];
}

/**
 * Return the name of the family with the given id.
 *
 * @param   {int}    family family id
 * @returns {string}        family name
 */
PixelAttributes.getFamilyName = function(family) {
   return PixelAttributes.FAMILIES[family].name;
}

/**
 * Return the description of the family with the given id.
 *
 * @param   {int}    family family id
 * @returns {string}        family description
 */
PixelAttributes.getFamilyDescription = function(family) {
   return PixelAttributes.FAMILIES[family].desc;
}

/**
 * Return the list of group ids in the given family.
 *
 * @param   {int}   family family id
 * @returns {array}        list of group ids
 */
PixelAttributes.getFamilyGroups = function(family) {
   return PixelAttributes.FAMILY_GROUPS[family];
}

/**
 * Return the list of attribute ids in the given family.
 *
 * @param   {int}   family family id
 * @returns {array}        list of attribute ids
 */
PixelAttributes.getFamilyAttribs = function(family) {
   return PixelAttributes.FAMILY_ATTRIBS[family];
}

/*****************************************************************************
 * Attribute state manipulation.
 *****************************************************************************/

/**
 * Get the value of the given attribute for the specified pixels.
 *
 * @param   {int}        attrib attribute id
 * @param   {array}      pixels pixel indices (optional: default all pixels)
 * @returns {Uint8Array}        value (true/false) of attribute at each pixel
 */
PixelAttributes.prototype.get = function(attrib, pixels) {
   /* retrieve texture index, offset, and mask for attribute */
   var texture = PixelAttributes.LABELS[attrib].texture;
   var offset  = PixelAttributes.LABELS[attrib].offset;
   var mask    = PixelAttributes.LABELS[attrib].mask;
   /* get attribute texture array */
   var txt = this.attributes[texture];
   /* get step size in texture array */
   var step = PixelAttributes.BYTES_PER_TEXTURE;
   /* check if setting values for all pixels */
   if (typeof(pixels) == "undefined") {
      /* allocate value array */
      var vals = new Uint8Array(this.size);
      /* get values for all pixels */
      var limit = txt.length;
      for (var n = 0, ind = offset; ind < limit; ind += step, ++n)
         vals[n] = ((txt[ind] & mask) > 0);
      return vals;
   } else {
      /* allocate value array */
      var vals = new Uint8Array(pixels.length);
      /* get values for specified pixels */
      for (var n = 0; n < pixels.length; ++n) {
         var ind = pixels[n] * step + offset;
         vals[n] = ((txt[ind] & mask) > 0);
      }
      return vals;
   }
}

/**
 * Set the value of the given attribute for the specified pixels.
 *
 * @param {int}   attrib attribute id
 * @param {array} vals   value (true/false) of attribute at each pixel
 * @param {array} pixels pixel indices (optional: default all pixels)
 */
PixelAttributes.prototype.set = function(attrib, vals, pixels) {
   /* retrieve texture index, offset, and mask for attribute */
   var label_info = PixelAttributes.LABELS[attrib];
   var texture = label_info.texture;
   var offset  = label_info.offset;
   var mask    = label_info.mask;
   /* get attribute texture array */
   var txt = this.attributes[texture];
   /* get step size in texture array */
   var step = PixelAttributes.BYTES_PER_TEXTURE;
   /* check if setting values for all pixels */
   if (typeof(pixels) == "undefined") {
      /* set values for all pixels */
      var limit = txt.length;
      for (var n = 0, ind = offset; ind < limit; ind += step, ++n) {
         var a = txt[ind];
         var v = vals[n] * 0xFF;
         txt[ind] = (a & ~mask) | (v & mask);
      }
      /* notify attached renderers of attribute change */
      Renderer.updateAll(
         this, { name: "set", ids: [attrib], pixels: null }
      );
   } else {
      /* set values for specified pixels */
      for (var n = 0; n < pixels.length; ++n) {
         var ind = pixels[n] * step + offset;
         var a = txt[ind];
         var v = vals[n] * 0xFF;
         txt[ind] = (a & ~mask) | (v & mask);
      }
      /* notify attached renderers of attribute change */
      Renderer.updateAll(
         this, { name: "set", ids: [attrib], pixels : pixels }
      );
   }
}

/**
 * Set the given attribute to a single value for the specified pixels.
 *
 * @param {int}   attrib attribute id
 * @param {array} val    value (true/false) of attribute
 * @param {array} pixels pixel indices (optional: default all pixels)
 */
PixelAttributes.prototype.setValue = function(attrib, val, pixels) {
   /* retrieve texture index, offset, and mask for attribute */
   var label_info = PixelAttributes.LABELS[attrib];
   var texture = label_info.texture;
   var offset  = label_info.offset;
   var mask    = label_info.mask;
   /* get attribute texture array */
   var txt = this.attributes[texture];
   /* get step size in texture array */
   var step = PixelAttributes.BYTES_PER_TEXTURE;
   /* check if setting values for all pixels */
   if (typeof(pixels) == "undefined") {
      /* set value for all pixels */
      var limit = txt.length;
      for (var n = 0, ind = offset; ind < limit; ind += step, ++n) {
         var a = txt[ind];
         var v = val * 0xFF;
         txt[ind] = (a & ~mask) | (v & mask);
      }
      /* notify attached renderers of attribute change */
      Renderer.updateAll(
         this, { name: "set", ids: [attrib], pixels: null }
      );
   } else {
      /* set value for specified pixels */
      for (var n = 0; n < pixels.length; ++n) {
         var ind = pixels[n] * step + offset;
         var a = txt[ind];
         var v = val * 0xFF;
         txt[ind] = (a & ~mask) | (v & mask);
      }
      /* notify attached renderers of attribute change */
      Renderer.updateAll(
         this, { name: "set", ids: [attrib], pixels : pixels }
      );
   }
}

/**
 * Set all attributes for the specified pixels by copying them from existing
 * pixel attributes.  Abusing notation, this method sets:
 *
 *    this.attributes[dst] = px_attribs.attributes[src]
 *
 * where indexing through the attribute textures is automatically handled.
 *
 * @param {array}           dst        pixel indices in destination array
 * @param {array}           src        pixel indices in source array
 * @param {PixelAttributes} px_attribs source pixel attributes
 */
PixelAttributes.prototype.setAll = function(dst, src, px_attribs) {
   /* get step size in texture arrays */
   var step = PixelAttributes.BYTES_PER_TEXTURE;
   /* copy attributes for each texture */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      /* get destination and source textures */
      var txt_dst = this.attributes[t];
      var txt_src = px_attribs.attributes[t];
      /* copy attributes for corresponding pixels */
      for (var n = 0; n < dst.length; ++n) {
         var dst_ind = dst[n] * step;
         var src_ind = src[n] * step;
         for (var offset = 0; offset < step; ++offset)
            txt_dst[dst_ind + offset] = txt_src[src_ind + offset];
      }
   }
   /* notify attached renderers of attribute change */
   Renderer.updateAll(
      this, { name: "set", ids: null, pixels: dst }
   );
}

/**
 * Set all attributes for the specified pixels by copying them from existing
 * pixel attributes.  Differing from the above method, the copied attributes
 * must be densly packed (no source indices).  Abusing notation, this method
 * sets:
 *
 *    this.attributes[dst] = px_attribs.attributes
 *
 * where indexing through the attribute textures is automatically handled.
 *
 * @param {array}           dst        pixel indices in destination array
 * @param {PixelAttributes} px_attribs source pixel attributes
 */
PixelAttributes.prototype.setAllPacked = function(dst, px_attribs) {
   /* get step size in texture arrays */
   var step = PixelAttributes.BYTES_PER_TEXTURE;
   /* copy attributes for each texture */
   for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
      /* get destination and source textures */
      var txt_dst = this.attributes[t];
      var txt_src = px_attribs.attributes[t];
      /* copy attributes for corresponding pixels */
      for (var n = 0, src_ind = 0; n < dst.length; ++n, src_ind += step) {
         var dst_ind = dst[n] * step;
         for (var offset = 0; offset < step; ++offset)
            txt_dst[dst_ind + offset] = txt_src[src_ind + offset];
      }
   }
   /* notify attached renderers of attribute change */
   Renderer.updateAll(
      this, { name: "set", ids: null, pixels: dst }
   );
}

/*****************************************************************************
 * Attribute visualization.
 *****************************************************************************/

/**
 * Generate visualization texture colormap for pixel attributes.
 *
 * For each attribute byte index, specified as a (texture, offset) pair, the
 * visualization colormap is a list of 256 RGBA colors, one for every possible
 * value that byte may take.
 *
 * These colormaps are returned as a single array with linear row indices
 * corresponding to the (texture, offset) address.  Row indices increment with
 * offset, then texture.  The array has 256*4 = 1024 columns, corresponding to
 * 256 blocks of RGBA color.
 *
 * @returns {Uint8Array} RGBA colormap array of size BYTES_PER_PIXEL * 256 * 4
 */
PixelAttributes.generateColorMap = function() {
   /* allocate colormap */
   var cmap = new Uint8Array(PixelAttributes.BYTES_PER_PIXEL * 256 * 4);
   var pos = 0;
   /* iterate over 256 possible byte values */
   for (var bval = 0; bval < 256; ++bval) {
      /* iterate over (texture, offset) coordinates */
      for (var t = 0; t < PixelAttributes.TEXTURES_PER_PIXEL; ++t) {
         for (var o = 0; o < PixelAttributes.BYTES_PER_TEXTURE; ++o) {
            /* lookup attributes stored in byte at (t,o) coordinate */
            var attr_list = PixelAttributes.LABEL_LAYOUT[t][o];
            /* initialize color */
            var c_red   = 0;
            var c_green = 0;
            var c_blue  = 0;
            var c_alpha = 0;
            /* add contribution of each attribute */
            for (var a = 0; a < attr_list.length; ++a) {
               /* lookup attribute info */
               var id    = attr_list[a];
               var mask  = PixelAttributes.LABELS[id].mask;
               var color = PixelAttributes.LABELS[id].color;
               /* compute mixing weight of attribute */
               var weight = ((mask & bval) > 0) * color[3];
               /* mix into active color */
               c_red   += weight * color[0];
               c_green += weight * color[1];
               c_blue  += weight * color[2];
               c_alpha += weight;
            }
            /* normalize active color */
            if (c_alpha > 0) {
               c_red   /= c_alpha;
               c_green /= c_alpha;
               c_blue  /= c_alpha;
            }
            /* rescale total relative mixing weight */
            c_alpha /= 8;
            if (c_alpha > 255)
               c_alpha = 255;
            /* store color */
            cmap[pos++] = Math.floor(c_red);
            cmap[pos++] = Math.floor(c_green);
            cmap[pos++] = Math.floor(c_blue);
            cmap[pos++] = Math.floor(c_alpha);
         }
      }
   }
   return cmap;
}

/**
 * Generate a mapping of (view bitmask, attribute bitmask) -> display bitmask,
 * where each mask is a single byte indicating which corresponding attribute
 * bits are being viewed, are active, and should be displayed.
 *
 * This map is a simple bitwise AND operation, but is neccessary for use as a
 * WebGL texture since WebGL shaders do not support bitwise logic operators.
 * Instead, WebGL can utilize this lookup table.
 *
 * @returns {Uint8Array} 256 x 256 texture map for bitmask AND operation.
 */
PixelAttributes.generateBitmaskMap = function() {
   var mask_map = new Uint8Array(256*256*4);
   var pos = 0;
   for (var vmask = 0; vmask < 256; ++vmask) {
      for (var amask = 0; amask < 256; ++amask) {
         mask_map[pos]     = vmask & amask;
         mask_map[pos + 1] = 0;
         mask_map[pos + 2] = 0;
         mask_map[pos + 3] = 0;
         pos += 4;
      }
   }
   return mask_map;
}

/*****************************************************************************
 * Global properties.
 *****************************************************************************/

/*
 * Pixel attribute memory layout.
 *
 * Each attribute is a single bit flag.  Attributes are packed into bytes and
 * then packed into texture arrays in order to enable efficient rendering.
 *
 * Looking up the value of a particular attribute for a pixel requires:
 *    (1) accessing the texture in which the attribute is stored
 *    (2) accessing the byte in that texture at the correct position for
 *        the pixel and offset for the attribute within that pixel
 *    (3) applying the appropriate bitmask to that byte
 */
PixelAttributes.TEXTURES_PER_PIXEL = 4;   /* 4 texture arrays at top level */
PixelAttributes.BYTES_PER_TEXTURE  = 4;   /* 4 bytes fit into RGBA texture */
PixelAttributes.BYTES_PER_PIXEL =         /* 128 bit (16 byte) attributes */
   PixelAttributes.BYTES_PER_TEXTURE * PixelAttributes.TEXTURES_PER_PIXEL;

/*
 * Pixel attribute labels.
 * 
 * Attributes are per-pixel binary variables.  They are addressed according
 * to their texture, offset, and bitmask, as described above and specified
 * below.
 *
 * Related attributes are organized into numbered groups.
 *
 * The edit flag indicates whether an attribute is user-accessible or is a
 * automatically defined quantity.
 *
 * For visualization purposes each attribute is assigned a display color
 * represented as an RGBA tuple, where the alpha channel is the relative
 * weight of the color with respect to those of other active attributes.
 */
PixelAttributes.LABELS = ArrUtil.sort([
   /* regions - boundaries and occlusion */
   {
      name:    "touch",
      desc:    "surface touches parent or supporting object",
      id:      0,
      groups:  [0],
      texture: 0,
      offset:  0,
      mask:    0x01,
      edit:    false,
      color:   [0, 255, 0, 64]      /* 2D boundaries shown in green */
   },
   {
      name:    "join",
      desc:    "surface joins with parent surface",
      id:      1,
      groups:  [0],
      texture: 0,
      offset:  0,
      mask:    0x02,
      edit:    false,
      color:   [255, 0, 0, 255]     /* figure side of boundary in red */
   },
   {
      name:    "occlusion boundary",
      desc:    "boundary at which parent region ends due to occlusion",
      id:      2,
      groups:  [0],
      texture: 0,
      offset:  0,
      mask:    0x04,
      edit:    false,
      color:   [0, 0, 255, 255]     /* ground side of boundary in blue */
   },
   {
      name:    "occluded",
      desc:    "location occluded by another region",
      id:      3,
      groups:  [0],
      texture: 0,
      offset:  0,
      mask:    0x08,
      edit:    false,
      color:   [0, 96, 255, 255]    /* occluded region in light blue */
   },
   /* regions - surface contact */
   {
      name:    "contact rest point",
      desc:    "resting on a supporting surface",
      id:      4,
      groups:  [1],
      texture: 0,
      offset:  0,
      mask:    0x10,
      edit:    false,
      color:   [192, 64, 128, 255]  /* supported area in pink */
   },
   {
      name:    "contact support point",
      desc:    "supporting a resting surface",
      id:      5,
      groups:  [1],
      texture: 0,
      offset:  0,
      mask:    0x20,
      edit:    false,
      color:   [128, 64, 192, 255]  /* supporting area in purple */
   },
   {
      name:    "attachment rest point",
      desc:    "attached to a supporting surface",
      id:      6,
      groups:  [1],
      texture: 0,
      offset:  0,
      mask:    0x40,
      edit:    false,
      color:   [192, 128, 64, 255]  /* attached area in orange */
   },
   {
      name:    "attachment support point",
      desc:    "supporting an attached surface",
      id:      7,
      groups:  [1],
      texture: 0,
      offset:  0,
      mask:    0x80,
      edit:    false,
      color:   [128, 192, 64, 255]  /* attachment supporting area in lime */
   },
   /* appearance - lighting and shadows */
   {
      name:    "light source",
      desc:    "primary light source (not a reflection or specularity)",
      id:      8,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x01,
      edit:    true,
      color:   [255, 255, 0, 255]   /* light sources in yellow */
   },
   {
      name:    "display screen",
      desc:    "region of light actively generated by CRT, LCD, or projector",
      id:      9,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x02,
      edit:    true,
      color:   [192, 192, 96, 255]  /* display screens in dark yellow */
   },
   {
      name:    "transparency",
      desc:    "mostly or fully transparent surface",
      id:      10,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x04,
      edit:    true,
      color:   [128, 128, 128, 255] /* transparency in gray */
   },
   {
      name:    "translucency",
      desc:    "translucent surface",
      id:      11,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x08,
      edit:    true,
      color:   [128, 160, 192, 255] /* translucency in blue-gray */
   },
   {
      name:    "mirror",
      desc:    "mirror surface",
      id:      12,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x10,
      edit:    true,
      color:   [224, 160, 96, 255]  /* mirror in peach */
   },
   {
      name:    "reflection",
      desc:    "visible reflection of other scene elements",
      id:      13,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x20,
      edit:    true,
      color:   [224, 96, 160, 255]  /* reflection in pink */
   },
   {
      name:    "specularity",
      desc:    "specular highlight",
      id:      14,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x40,
      edit:    true,
      color:   [160, 96, 224, 255]  /* specularity in purple */
   },
   {
      name:    "shadow",
      desc:    "cast shadow",
      id:      15,
      groups:  [2],
      texture: 0,
      offset:  1,
      mask:    0x80,
      edit:    true,
      color:   [255, 32, 32, 255]   /* shadow in off-red */
   },
   /* appearance - surface reflectance */
   {
      name:    "shiny",
      desc:    "shiny, reflective surface",
      id:      16,
      groups:  [3],
      texture: 0,
      offset:  2,
      mask:    0x01,
      edit:    true,
      color:   [64, 255, 64, 255]   /* shiny surface in bright green */
   },
   {
      name:    "matte",
      desc:    "matte surface",
      id:      17,
      groups:  [3],
      texture: 0,
      offset:  2,
      mask:    0x02,
      edit:    true,
      color:   [64, 64, 128, 255]   /* matte surface in dark blue */
   },
   /* appearance - surface texture */
   {
      name:    "smooth",
      desc:    "smooth surface",
      id:      18,
      groups:  [4],
      texture: 0,
      offset:  2,
      mask:    0x04,
      edit:    true,
      color:   [0, 224, 224, 255]   /* smooth surface in bright blue-green */
   },
   {
      name:    "rough",
      desc:    "rough surface",
      id:      19,
      groups:  [4],
      texture: 0,
      offset:  2,
      mask:    0x08,
      edit:    true,
      color:   [96, 32, 0, 255]     /* rough surface in brown */
   },
   {
      name:    "grainy",
      desc:    "grainy surface",
      id:      20,
      groups:  [4],
      texture: 0,
      offset:  2,
      mask:    0x10,
      edit:    true,
      color:   [224, 128, 0, 255]   /* grainy surface in orange-brown */
   },
   {
      name:    "bumpy",
      desc:    "bumpy surface",
      id:      21,
      groups:  [4],
      texture: 0,
      offset:  2,
      mask:    0x20,
      edit:    true,
      color:   [96, 32, 96, 255]    /* bumpy surface in purple */
   },
   /* appearance - surface coating */
   {
      name:    "bare",
      desc:    "underlying material type exposed and visible",
      id:      22,
      groups:  [5],
      texture: 0,
      offset:  3,
      mask:    0x01,
      edit:    true,
      color:   [255, 96, 0, 255]    /* bare surface in orange */
   },
   {
      name:    "painted",
      desc:    "underlying material painted over",
      id:      23,
      groups:  [5],
      texture: 0,
      offset:  3,
      mask:    0x02,
      edit:    true,
      color:   [96, 0, 96, 255]     /* painted surface in dark purple */
   },
   {
      name:    "printed",
      desc:    "ink or dye applied to create pattern or text",
      id:      24,
      groups:  [5],
      texture: 0,
      offset:  3,
      mask:    0x04,
      edit:    true,
      color:   [0, 96, 96, 255]     /* printed surface in dark blue-green */
   },
   {
      name:    "dirty",
      desc:    "surface partially or fully coated with dirt",
      id:      25,
      groups:  [5],
      texture: 0,
      offset:  3,
      mask:    0x08,
      edit:    true,
      color:   [128, 64, 32, 255]   /* dirty surface in brown */
   },
   {
      name:    "dusty",
      desc:    "surface partially or fully coated with dust",
      id:      26,
      groups:  [5],
      texture: 0,
      offset:  3,
      mask:    0x10,
      edit:    true,
      color:   [80, 80, 80, 255]    /* dusty surface in gray */
   },
   {
      name:    "oily",
      desc:    "surface partially or fully coated with oil",
      id:      27,
      groups:  [5],
      texture: 0,
      offset:  3,
      mask:    0x20,
      edit:    true,
      color:   [192, 224, 0, 255]   /* oily surface in yellow-green */
   },
   {
      name:    "wet",
      desc:    "surface covered with liquid",
      id:      28,
      groups:  [5],
      texture: 0,
      offset:  3,
      mask:    0x40,
      edit:    true,
      color:   [0, 176, 255, 255]   /* wet surface in off-blue */
   },
   /* material - physical state */
   {
      name:    "solid",
      desc:    "solid object",
      id:      29,
      groups:  [6],
      texture: 1,
      offset:  0,
      mask:    0x01,
      edit:    true,
      color:   [255, 0, 0, 255]     /* solid object in red */
   },
   {
      name:    "solid aggregate",
      desc:    "loose collection of solid objects",
      id:      30,
      groups:  [6],
      texture: 1,
      offset:  0,
      mask:    0x02,
      edit:    true,
      color:   [255, 255, 0, 255]   /* solid aggregate in yellow */
   },
   {
      name:    "solid/liquid mixture",
      desc:    "collection of solids suspended in a liquid",
      id:      31,
      groups:  [6],
      texture: 1,
      offset:  0,
      mask:    0x04,
      edit:    true,
      color:   [0, 255, 0, 255]     /* solid/liquid mixture in green */
   },
   {
      name:    "liquid",
      desc:    "liquid or mixture of multiple liquids",
      id:      32,
      groups:  [6],
      texture: 1,
      offset:  0,
      mask:    0x08,
      edit:    true,
      color:   [0, 0, 255, 255]     /* liquid in blue */
   },
   {
      name:    "gas",
      desc:    "visible gas",
      id:      33,
      groups:  [6],
      texture: 1,
      offset:  0,
      mask:    0x10,
      edit:    true,
      color:   [255, 0, 255, 255]   /* gas in purple */
   },
   {
      name:    "void",
      desc:    "empty space occupied by neither visible nor invisible matter",
      id:      34,
      groups:  [6],
      texture: 1,
      offset:  0,
      mask:    0x20,
      edit:    true,
      color:   [192, 192, 192, 255] /* void in gray */
   },
   /* material - man-made categories */
   {
      name:    "glass",
      desc:    "clear or colored glass",
      id:      35,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x01,
      edit:    true,
      color:   [192, 255, 192, 255] /* glass in pale green */
   },
   {
      name:    "plastic",
      desc:    "clear or colored plastic",
      id:      36,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x02,
      edit:    true,
      color:   [192, 192, 255, 255] /* plastic in pale blue */
   },
   {
      name:    "ceramic",
      desc:    "any type of ceramic",
      id:      37,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x04,
      edit:    true,
      color:   [255, 192, 192, 255] /* ceramic in pale red*/
   },
   {
      name:    "rubber",
      desc:    "any type of rubber",
      id:      38,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x08,
      edit:    true,
      color:   [176, 128, 96, 255]  /* rubber in pale brown */
   },
   {
      name:    "foam",
      desc:    "insulation, packing foam, padding, ...",
      id:      39,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x10,
      edit:    true,
      color:   [176, 176, 96, 255]  /* foam in pale yellow */
   },
   {
      name:    "metal",
      desc:    "any type of metal",
      id:      40,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x20,
      edit:    true,
      color:   [160, 160, 160, 255] /* metal in gray */
   },
   {
      name:    "wire",
      desc:    "bare or enclosed wire",
      id:      41,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x40,
      edit:    true,
      color:   [32, 32, 32, 255]    /* wire in dark gray */
   },
   {
      name:    "marble",
      desc:    "marble surface, object, or structure",
      id:      42,
      groups:  [7],
      texture: 1,
      offset:  1,
      mask:    0x80,
      edit:    true,
      color:   [32, 96, 32, 255]    /* marble in dark green */
   },
   {
      name:    "stone",
      desc:    "stone surface, object, or structure",
      id:      43,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x01,
      edit:    true,
      color:   [32, 32, 96, 255]    /* stone in dark blue */
   },
   {
      name:    "clay",
      desc:    "clay surface, object, or structure",
      id:      44,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x02,
      edit:    true,
      color:   [96, 32, 32, 255]    /* clay in dark red */
   },
   {
      name:    "brick",
      desc:    "brick surface, object or structure",
      id:      45,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x04,
      edit:    true,
      color:   [224, 32, 32, 255]   /* brick in bright red */
   },
   {
      name:    "concrete",
      desc:    "concerete surface, object, or structure",
      id:      46,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x08,
      edit:    true,
      color:   [128, 96, 96, 255]   /* concrete in pink-gray */
   },
   {
      name:    "asphalt",
      desc:    "asphalt surface",
      id:      47,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x10,
      edit:    true,
      color:   [128, 128, 96, 255] /* asphalt in yellow-gray */
   },
   {
      name:    "wood",
      desc:    "wood surface, object, or structure",
      id:      48,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x20,
      edit:    true,
      color:   [128, 80, 32, 255]   /* wood in brown */
   },
   {
      name:    "cork",
      desc:    "cork surface or object",
      id:      49,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x40,
      edit:    true,
      color:   [224, 160, 112, 255] /* cork in light brown */
   },
   {
      name:    "cardboard",
      desc:    "cardboard surface or object",
      id:      50,
      groups:  [7],
      texture: 1,
      offset:  2,
      mask:    0x80,
      edit:    true,
      color:   [224, 112, 32, 255]  /* cardboard in orange-brown */
   },
   {
      name:    "paper",
      desc:    "paper sheets, posters, newspaper, books, ...",
      id:      51,
      groups:  [7],
      texture: 1,
      offset:  3,
      mask:    0x01,
      edit:    true,
      color:   [208, 208, 192, 255] /* paper in off-white */
   },
   {
      name:    "leather",
      desc:    "processed or imitation animal hide",
      id:      52,
      groups:  [7],
      texture: 1,
      offset:  3,
      mask:    0x02,
      edit:    true,
      color:   [216, 48, 64, 255]   /* leather in pink */
   },
   {
      name:    "fabric",
      desc:    "woven or knit materials, such as clothing",
      id:      53,
      groups:  [7],
      texture: 1,
      offset:  3,
      mask:    0x04,
      edit:    true,
      color:   [48, 112, 216, 255]  /* fabric in medium blue */
   },
   {
      name:    "carpet",
      desc:    "rugs or similar heavy textiles",
      id:      54,
      groups:  [7],
      texture: 1,
      offset:  3,
      mask:    0x08,
      edit:    true,
      color:   [112, 48, 216, 255]  /* carpet in medium purple */
   },
   /* material - natural categories */
   {
      name:    "water",
      desc:    "liquid water",
      id:      55,
      groups:  [8],
      texture: 2,
      offset:  0,
      mask:    0x01,
      edit:    true,
      color:   [64, 64, 255, 255]   /* liquid water in blue */
   },
   {
      name:    "ice",
      desc:    "frozen water",
      id:      56,
      groups:  [8],
      texture: 2,
      offset:  0,
      mask:    0x02,
      edit:    true,
      color:   [64, 224, 255, 255]  /* ice in cyan */
   },
   {
      name:    "snow",
      desc:    "accumulated snow (use snowing for falling snow)",
      id:      57,
      groups:  [8],
      texture: 2,
      offset:  0,
      mask:    0x04,
      edit:    true,
      color:   [208, 208, 255, 255] /* snow in blue-white */
   },
   {
      name:    "rock",
      desc:    "naturally occuring solid rock",
      id:      58,
      groups:  [8],
      texture: 2,
      offset:  0,
      mask:    0x08,
      edit:    true,
      color:   [176, 80, 80, 255]   /* rock in maroon */
   },
   {
      name:    "sand",
      desc:    "granular material composed of fine rock particles",
      id:      59,
      groups:  [8],
      texture: 2,
      offset:  0,
      mask:    0x10,
      edit:    true,
      color:   [176, 176, 80, 255]  /* sand in golden brown */
   },
   {
      name:    "soil",
      desc:    "dry soil",
      id:      60,
      groups:  [8],
      texture: 2,
      offset:  0,
      mask:    0x20,
      edit:    true,
      color:   [96, 96, 96, 255]    /* soil in dark gray */
   },
   {
      name:    "mud",
      desc:    "wet soil",
      id:      61,
      groups:  [8],
      texture: 2,
      offset:  0,
      mask:    0x40,
      edit:    true,
      color:   [96, 80, 0, 255]     /* mud in brown */
   },
   /* material - plants */
   {
      name:    "flower",
      desc:    "flower or petal",
      id:      62,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x01,
      edit:    true,
      color:   [224, 0, 224, 255]   /* flower in pink */
   },
   {
      name:    "seed",
      desc:    "any type of seed",
      id:      63,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x02,
      edit:    true,
      color:   [108, 96, 176, 255]  /* seed in lavender */
   },
   {
      name:    "fruit",
      desc:    "any type of fruit",
      id:      64,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x04,
      edit:    true,
      color:   [255, 196, 0, 255]   /* fruit in orange */
   },
   {
      name:    "leaf",
      desc:    "leaf or leaves",
      id:      65,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x08,
      edit:    true,
      color:   [0, 160, 64, 255]    /* leaf in dark green */
   },
   {
      name:    "stem",
      desc:    "plant stem",
      id:      66,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x10,
      edit:    true,
      color:   [176, 255, 108, 255] /* stem in neon green */
   },
   {
      name:    "trunk",
      desc:    "trunk of tree, bush, or other plant",
      id:      67,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x20,
      edit:    true,
      color:   [128, 64, 0, 255]    /* trunk in brown */
   },
   {
      name:    "bark",
      desc:    "bark on a tree or bush trunk",
      id:      68,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x40,
      edit:    true,
      color:   [80, 64, 64, 255]    /* bark in gray */
   },
   {
      name:    "roots",
      desc:    "plant roots",
      id:      69,
      groups:  [9],
      texture: 2,
      offset:  1,
      mask:    0x80,
      edit:    true,
      color:   [176, 24, 0, 255]    /* roots in reddish brown */
   },
   /* material - animals */
   {
      name:    "eye",
      desc:    "eye of a human or animal",
      id:      70,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x01,
      edit:    true,
      color:   [24, 108, 96, 255]   /* eye in green */
   },
   {
      name:    "tongue",
      desc:    "tongue of a human or animal",
      id:      71,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x02,
      edit:    true,
      color:   [255, 108, 96, 255]  /* tongue in pink */
   },
   {
      name:    "skin",
      desc:    "human or animal skin",
      id:      72,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x04,
      edit:    true,
      color:   [255, 204, 204, 255] /* skin in peach */
   },
   {
      name:    "hair",
      desc:    "hair on human or animal, excluding fur",
      id:      73,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x08,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "fur",
      desc:    "animal fur",
      id:      74,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x10,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "feathers",
      desc:    "animal feathers",
      id:      75,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x20,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "scales",
      desc:    "scales on a reptile or other animal",
      id:      76,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x40,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "bone",
      desc:    "visible bone",
      id:      77,
      groups:  [10],
      texture: 2,
      offset:  2,
      mask:    0x80,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "cartilage",
      desc:    "visible cartilage",
      id:      78,
      groups:  [10],
      texture: 2,
      offset:  3,
      mask:    0x01,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "shell",
      desc:    "animal shell",
      id:      79,
      groups:  [10],
      texture: 2,
      offset:  3,
      mask:    0x02,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "nail",
      desc:    "fingernail or toenail",
      id:      80,
      groups:  [10],
      texture: 2,
      offset:  3,
      mask:    0x04,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "claw",
      desc:    "animal claw",
      id:      81,
      groups:  [10],
      texture: 2,
      offset:  3,
      mask:    0x08,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "hoof",
      desc:    "animal hoof",
      id:      82,
      groups:  [10],
      texture: 2,
      offset:  3,
      mask:    0x10,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "horns",
      desc:    "animal horns",
      id:      83,
      groups:  [10],
      texture: 2,
      offset:  3,
      mask:    0x20,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   /* environmental effects - weather */
   {
      name:    "foggy",
      desc:    "haze or fog partially or fully occludes region",
      id:      84,
      groups:  [11],
      texture: 3,
      offset:  0,
      mask:    0x01,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "raining",
      desc:    "falling rain partially occludes region",
      id:      85,
      groups:  [11],
      texture: 3,
      offset:  0,
      mask:    0x02,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "snowing",
      desc:    "falling snow partially occludes region",
      id:      86,
      groups:  [11],
      texture: 3,
      offset:  0,
      mask:    0x04,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "underwater",
      desc:    "liquid surface partially occludes region",
      id:      87,
      groups:  [11],
      texture: 3,
      offset:  0,
      mask:    0x08,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   /* environmental effects - additional */
   {
      name:    "fire",
      desc:    "flame partially or fully occupies region",
      id:      88,
      groups:  [12],
      texture: 3,
      offset:  0,
      mask:    0x10,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "smoke",
      desc:    "smoke partially or fully occludes region",
      id:      89,
      groups:  [12],
      texture: 3,
      offset:  0,
      mask:    0x20,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   /* scene layout - outdoor */
   {
      name:    "ground",
      desc:    "ground plane",
      id:      90,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x01,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "sky",
      desc:    "sky region (including clouds, sun, moon, stars, ...)",
      id:      91,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x02,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "cloud",
      desc:    "cloud in the sky",
      id:      92,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x04,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "hill",
      desc:    "elevated terrain corresponding to a hill",
      id:      93,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x08,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "mountain",
      desc:    "highly elevated terrain or mountain viewed at distance",
      id:      94,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x10,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "river",
      desc:    "portion of river covered by flowing or standing water",
      id:      95,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x20,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "lake",
      desc:    "large body of water appearing to be a lake",
      id:      96,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x40,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "ocean",
      desc:    "large body of water appearing to be an ocean",
      id:      97,
      groups:  [13],
      texture: 3,
      offset:  1,
      mask:    0x80,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "road",
      desc:    "paved, brick, stone, gravel, or dirt road",
      id:      98,
      groups:  [13],
      texture: 3,
      offset:  2,
      mask:    0x01,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "sidewalk",
      desc:    "paved, brick, stone, gravel, or dirt sidewalk",
      id:      99,
      groups:  [13],
      texture: 3,
      offset:  2,
      mask:    0x02,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "grass",
      desc:    "short vegetation covering the ground",
      id:      100,
      groups:  [9, 13],    /* both plants and outdoor scene layout groups */
      texture: 3,
      offset:  2,
      mask:    0x04,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "bush",
      desc:    "bush or similar vegetation",
      id:      101,
      groups:  [9, 13],    /* both plants and outdoor scene layout groups */
      texture: 3,
      offset:  2,
      mask:    0x08,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "tree",
      desc:    "any type of tree",
      id:      102,
      groups:  [9, 13],    /* both plants and outdoor scene layout groups */
      texture: 3,
      offset:  2,
      mask:    0x10,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "wall",
      desc:    "indoor or outdoor wall",
      id:      103,
      groups:  [13, 14],   /* both outdoor and indoor scene layout groups */
      texture: 3,
      offset:  2,
      mask:    0x20,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "building",
      desc:    "any type of building",
      id:      104,
      groups:  [13],
      texture: 3,
      offset:  2,
      mask:    0x40,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "roof",
      desc:    "roof of a building",
      id:      105,
      groups:  [13],
      texture: 3,
      offset:  2,
      mask:    0x80,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   /* scene layout - indoor */
   {
      name:    "floor",
      desc:    "indoor floor",
      id:      106,
      groups:  [14],
      texture: 3,
      offset:  3,
      mask:    0x01,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "ceiling",
      desc:    "indoor ceiling",
      id:      107,
      groups:  [14],
      texture: 3,
      offset:  3,
      mask:    0x02,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "door",
      desc:    "door itself, excluding doorway",
      id:      108,
      groups:  [13, 14],   /* both indoor and outdoor scene layout */
      texture: 3,
      offset:  3,
      mask:    0x04,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "doorway",
      desc:    "doorway surrounding open, closed, or missing door",
      id:      109,
      groups:  [13, 14],   /* both indoor and outdoor scene layout */
      texture: 3,
      offset:  3,
      mask:    0x08,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "window",
      desc:    "window",
      id:      110,
      groups:  [13, 14],   /* both indoor and outdoor scene layout */
      texture: 3,
      offset:  3,
      mask:    0x10,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   },
   {
      name:    "stairs",
      desc:    "stairs",
      id:      111,
      groups:  [13, 14],   /* both indoor and outdoor scene layout */
      texture: 3,
      offset:  3,
      mask:    0x20,
      edit:    true,
      color:   [255, 255, 255, 255] /* FIXME */
   }
   /* FIXME: add lense effect */
],function(a,b){return a.id - b.id;});

/*
 * Memory layout map of (texture, offset) -> attribute list.
 */
PixelAttributes.LABEL_LAYOUT = PixelAttributes.generateAttribLayoutMap();

/*
 * Map of attribute label name -> attribute id.
 */
PixelAttributes.LABEL_IDS = PixelAttributes.generateAttribIdMap();

/*
 * Pixel attribute groups.
 * Attributes are organized into groups with name and description given below.
 */
PixelAttributes.GROUPS = [
   {
      name:   "Surface Contact",
      desc:   "region boundaries and occlusion relationships",
      family: 0   /* group 0 */
   },
   {
      name:   "surface contact",
      desc:   "surface contact, attachment, and support points",
      family: 0   /* group 1 */
   },
   {
      name:   "lighting & shadows",
      desc:   "lighting, transparency, reflections, and shadows",
      family: 1   /* group 2 */
   },
   {
      name:   "surface reflectance",
      desc:   "surface reflectance characteristics",
      family: 1   /* group 3 */
   },
   {
      name:   "surface texture",
      desc:   "surface texture characteristics",
      family: 1   /* group 4 */
   },
   {
      name:   "surface coatings",
      desc:   "surface coating characteristics",
      family: 1   /* group 5 */
   },
   {
      name:   "physical state",
      desc:   "physical state of material",
      family: 2   /* group 6 */
   },
   {
      name:   "man-made",
      desc:   "common manufactured materials",
      family: 2   /* group 7 */
   },
   {
      name:   "natural",
      desc:   "common naturally occuring materials",
      family: 2   /* group 8 */
   },
   {
      name:   "plants",
      desc:   "materials composing plants",
      family: 2   /* group 9 */
   },
   {
      name:   "animals",
      desc:   "materials composing animals",
      family: 2   /* group 10 */
   },
   {
      name:   "weather",
      desc:   "visible weather effects",
      family: 3   /* group 11 */
   },
   {
      name:   "additional effects",
      desc:   "additional visible effects, such as chemical reactions",
      family: 3   /* group 12 */
   },
   {
      name:   "outdoor layout",
      desc:   "common elements of outdoor scenes",
      family: 4   /* group 13 */
   },
   {
      name:   "indoor layout",
      desc:   "common elements of indoor scenes",
      family: 4   /* group 14 */
   }
];

/*
 * Map of group name -> group id.
 */
PixelAttributes.GROUP_IDS = PixelAttributes.generateGroupIdMap();

/*
 * Map of group id -> list of attribute ids.
 */
PixelAttributes.GROUP_ATTRIBS = PixelAttributes.generateGroupAttribLists();

/*
 * Pixel attribute families.
 * Attribute groups are organized into larger families of related groups.
 */
PixelAttributes.FAMILIES = [
   {
      name: "region",
      desc: "region boundary labeling, occlusions, and surface contacts"
   },
   {
      name: "appearance",
      desc: "lighting, shadows, and surface characteristics"
   },
   {
      name: "material",
      desc: "material characteristics and categories"
   },
   {
      name: "environmental",
      desc: "environmental effects such as weather, fire, smoke"
   },
   {
      name: "scene",
      desc: "indoor and outdoor scene layout classes"
   }
];

/*
 * Map of family name -> family id.
 */
PixelAttributes.FAMILY_IDS = PixelAttributes.generateFamilyIdMap();

/*
 * Map of family id -> list of group ids.
 */
PixelAttributes.FAMILY_GROUPS = PixelAttributes.generateFamilyGroupLists();

/*
 * Map of family id -> list of attribute ids.
 */
PixelAttributes.FAMILY_ATTRIBS = PixelAttributes.generateFamilyAttribLists();
