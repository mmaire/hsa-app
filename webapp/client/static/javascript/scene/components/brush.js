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
 * Brush.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Brush constructor.
 *
 * @class A brush facilitates user selection of a subset of image pixels.
 *
 * A brush selects pixels in a circle of specified radius around a center
 * point, that also satisfy the following conditions:
 *
 * (1) The pixels are within the (optional) containment region (subset of the
 *     image) specified by the user.
 *
 * (2) The pixels have the same type id as the center pixel of the circle
 *     (again, an optional requirement).
 *
 * By default, neither of the optional conditions is enforced.
 *
 * @constructor
 * @param {ImgData} img    containing image
 * @param {int}     x      x-coordinate of brush center (default: 0)
 * @param {int}     y      y-coordinate of brush center (default: 0)
 * @param {int}     radius brush radius (in pixels) (default: 1)
 */
function Brush(img, x, y, radius) {
   /* default arguments */
   x = (typeof(x) != "undefined") ? x : 0;
   y = (typeof(y) != "undefined") ? y : 0;
   radius = (typeof(radius) != "undefined") ? radius : 1;
   /* check radius */
   if (radius <= 0)
      throw ("attempt to set invalid brush radius (must be > 0)");
   /* store image */
   this.img = img;                  /* brush selects subset of this image */
   /* pixel containment mask */
   this.pixel_mask = null;          /* selection restricted to these pixels */
   /* pixel type masks */
   this.type_masks = {};            /* selection restricted to match type id */
   this.type = null;                /* name of active type mask (if any) */
   /* brush position and size */
   this.x = x;                      /* x-coordinate of brush center */
   this.y = y;                      /* y-coordinate of brush center */
   this.radius = radius;            /* radius of circular brush */
   /* renderers */
   this.renderers = {};             /* brush renderers */
   /* initialize pixel containment mask */
   this.initPixelMask();
}

/*****************************************************************************
 * Brush initialization.
 *****************************************************************************/

/**
 * Initialize brush pixel containment mask.
 */
Brush.prototype.initPixelMask = function() {
   /* get image size */
   var sx = this.img.sizeX();
   var sy = this.img.sizeY();
   /* allocate mask */
   this.pixel_mask = new Uint32Array(sx * sy);
   /* mark all image pixels as part of the brush range */
   for (var p = 0; p < this.pixel_mask.length; ++p)
      this.pixel_mask[p] = 1;
}

/*****************************************************************************
 * Brush containment.
 *****************************************************************************/

/**
 * Restrict the brush to be contained within the given set of pixels.
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Brush.prototype.setContainmentPixels = function(pixels) {
   /* clear pixel restriction mask */
   for (var p = 0; p < this.pixel_mask.length; ++p)
      this.pixel_mask[p] = 0;
   /* set restriction to specified pixels */
   for (var n = 0; n < pixels.length; ++n) {
      var p = pixels[n];
      this.pixel_mask[p] = 1;
   }
   /* notify attached renderers of containment update */
   Renderer.updateAll(this, { name: "set-containment" });
}

/**
 * Restrict the brush to be contained within the given region.
 *
 * @param {Region} reg containing region
 */
Brush.prototype.setContainmentRegion = function(reg) {
   this.setContainmentPixels(reg.getPixels());
}

/**
 * Clear any containment restriction, allowing the brush to select pixels
 * from the entire image.
 */
Brush.prototype.clearContainment = function() {
   /* set restriction to all pixels in image */
   for (var p = 0; p < this.pixel_mask.length; ++p)
      this.pixel_mask[p] = 1;
   /* notify attached renderers of containment update */
   Renderer.updateAll(this, { name: "set-containment" });
}

/*****************************************************************************
 * Brush type.
 *****************************************************************************/

/**
 * Add a pixel type mask.
 *
 * If the requested type mask already exists, overwrite it.
 *
 * @param {string} type type mask name
 * @param {array}  mask type mask
 */
Brush.prototype.addType = function(type, mask) {
   /* check arguments */
   if (type == null) {
      throw ("cannot overwrite the default circular brush type mask");
   } else {
      /* get image size */
      var sx = this.img.sizeX();
      var sy = this.img.sizeY();
      /* check mask size */
      if (mask.length != (sx * sy))
         throw ("attempt to add brush type with incorrect mask size");
      /* check if updating existing type */
      var is_update = (type in this.type_masks);
      /* allocate storage for mask */
      if (!is_update)
         this.type_masks[type] = new Uint32Array(sx * sy);
      /* copy type mask */
      var ty_mask = this.type_masks[type];
      for (var p = 0; p < ty_mask.length; ++p)
         ty_mask[p] = mask[p];
      /* update attached renderers */
      if (is_update)
         Renderer.updateAll(this, { name: "update-type", type: type });
      else
         Renderer.updateAll(this, { name: "add-type", type: type });
   }
}

/**
 * Remove a pixel type mask.
 *
 * If the active type mask is removed, disable filter by pixel type.
 * If the requested type mask does not exist, throw an error.
 *
 * @param {string} type type mask name
 */
Brush.prototype.removeType = function(type) {
   /* check arguments */
   if (type == null) {
      throw ("cannot remove the default circular brush type");
   } else if (type in this.type_masks) {
      /* disable type filter if removing active type */
      if (type == this.type)
         this.type = null;
      /* remove the type filter */
      delete this.type_mask[type];
      Renderer.updateAll(this, { name: "remove-type", type: type });
   } else {
      throw ("attempt to remove nonexistent brush type");
   }
}

/**
 * Check whether a type mask with the given name exists.
 *
 * Return true if the type exists or is null (referring to the default mask).
 *
 * @param   {string} type type mask name
 * @returns {bool}        does type mask exist?
 */
Brush.prototype.hasType = function(type) {
   return ((type == null) || (type in this.type_masks));
}

/**
 * Get the name of the pixel type mask in use.
 *
 * Return null if no type mask is in use.
 *
 * @returns {string} type mask name
 */
Brush.prototype.getType = function() {
   return this.type;
}

/**
 * Set the active pixel type mask.
 *
 * If the mask name is null, disable filtering by pixel type.
 * If the name is not null and no such type mask exists, throw an error.
 *
 * @param {string} type type mask name
 */
Brush.prototype.setType = function(type) {
   if (this.hasType(type)) {
      this.type = type;
   } else {
      throw ("attempt to use nonexistent brush type: " + type);
   }
}

/*****************************************************************************
 * Brush control.
 *****************************************************************************/

/**
 * Get x-coordinate of brush center.
 *
 * @returns {int} center x-coordinate
 */
Brush.prototype.getX = function() {
   return this.x;
}

/**
 * Get y-coordinate of brush center.
 *
 * @returns {int} center y-coordinate
 */
Brush.prototype.getY = function() {
   return this.y;
}

/**
 * Get brush radius.
 *
 * @returns {int} brush radius
 */
Brush.prototype.getRadius = function() {
   return this.radius;
}

/**
 * Set position of brush center.
 *
 * @param {int} x center x-coordinate
 * @param {int} y center y-coordinate
 */
Brush.prototype.setPosition = function(x, y) {
   this.x = x;
   this.y = y;
}

/**
 * Set x-coordinate of brush center.
 *
 * @param {int} center x-coordinate
 */
Brush.prototype.setX = function(x) {
   this.x = x;
}

/**
 * Set y-coordinate of brush center.
 *
 * @param {int} center y-coordinate
 */
Brush.prototype.setY = function(y) {
   this.y = y;
}

/**
 * Set brush radius (in pixels).
 * The radius must be > 0 pixels.
 *
 * @param {int} radius brush radius
 */
Brush.prototype.setRadius = function(radius) {
   /* check arguments */
   if (radius <= 0)
      throw ("attempt to set invalid brush radius (must be > 0)");
   /* update radius */
   this.radius = radius;
}

/*****************************************************************************
 * Brush application.
 *****************************************************************************/

/**
 * Retrieve the pixels captured by applying the brush at its current location.
 *
 * Brush application grabs pixels inside the circular radius of the brush that
 * are both within the containment region and that match the type of the pixel
 * located at the brush center.
 *
 * @returns {array} pixel ids (linear image coordinates)
 */
Brush.prototype.grabPixels = function() {
   /* get image size */
   var sx = this.img.sizeX();
   var sy = this.img.sizeY();
   /* compute brush bounding box */
   var xmin = Math.floor(this.x - this.radius);
   var ymin = Math.floor(this.y - this.radius);
   var xlim = Math.ceil(this.x + this.radius) + 1;
   var ylim = Math.ceil(this.y + this.radius) + 1;
   /* restrict bounding box to image */
   if (xmin < 0)  { xmin = 0; }
   if (ymin < 0)  { ymin = 0; }
   if (xlim > sx) { xlim = sx; }
   if (ylim > sy) { ylim = sy; }
   /* initialize captured pixel list */
   var nx = xlim - xmin;
   var ny = ylim - ymin;
   var pixels = new Array(nx * ny);
   var np = 0;
   /* get pixel and type id masks */
   var px_mask = this.pixel_mask;
   var ty_mask = (this.type == null) ? px_mask : this.type_masks[this.type];
   /* get brush type id */
   var brush_ty = (this.type == null) ? 1 : ty_mask[(this.x)*sy + (this.y)];
   /* compute square of brush radius */
   var r_sq = (this.radius) * (this.radius);
   /* scan window */
   for (var x = xmin; x < xlim; ++x) {
      var dx = x - this.x;
      var dx_sq = dx * dx;
      for (var y = ymin, ind = x*sy + ymin; y < ylim; ++y, ++ind) {
         /* check pixel distance from center */
         var dy = y - this.y;
         var dy_sq = dy * dy;
         var in_selection = ((dx_sq + dy_sq) < r_sq);
         /* check pixel containment */
         var in_region = (px_mask[ind] != 0);
         /* check pixel type id */
         var ty_match = (ty_mask[ind] == brush_ty);
         /* determine whether to grab pixel */
         if (in_selection && in_region && ty_match)
            pixels[np++] = ind;
      }
   }
   /* truncate captured pixel list */
   pixels.length = np;
   return pixels;
}
