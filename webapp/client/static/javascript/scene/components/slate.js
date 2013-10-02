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
 * Drawing slate.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Slate constructor.
 *
 * @class A slate provides a drawing area for selecting a region from an image.
 *
 * Specifically, a slate manages selection of a subset of pixels, optionally
 * subject to constraints that some pixels must be included in the selection
 * (required) and others must be excluded (not allowed).
 *
 * By default, the selection can be any subset of the image (all pixels are
 * allowed and none are required).
 *
 * In the event that constraints conflict (a required pixel is not allowed),
 * the most recently activated constraint is enforced.
 *
 * @constructor
 * @param {ImgData} img image being annotated
 */
function Slate(img) {
   this.img  = img;                   /* image from which to select pixels */
   this.mask = Slate.createMask(img); /* select, allow, require status mask */
   this.renderers = {};               /* slate renderers */
}

/*****************************************************************************
 * Slate mask layout.
 *****************************************************************************/

Slate.MASK_OFFSET_SELECT  = 0;   /* byte offset for selection flag */
Slate.MASK_OFFSET_ALLOW   = 1;   /* byte offset for allow flag */
Slate.MASK_OFFSET_REQUIRE = 2;   /* byte offset for require flag */

/*****************************************************************************
 * Slate mask values.
 *****************************************************************************/

Slate.MASK_VAL_FALSE =   0;      /* constant value for false in mask */
Slate.MASK_VAL_TRUE  = 255;      /* constant value for true in mask */

/*****************************************************************************
 * Slate mask creation.
 *****************************************************************************/

/**
 * Create a pixel selection mask for the given image.
 *
 * Initialize the mask so that:
 *    (1) no pixels are selected
 *    (2) all pixels are allowed
 *    (3) no pixels are required
 *
 * @param   {ImgData}     img image
 * @returns {Uint32Array}     pixel selection status mask
 */
Slate.createMask = function(img) {
   /* get image size */
   var sx = img.sizeX();
   var sy = img.sizeY();
   /* allocate mask */
   var mask = new Uint32Array(sx * sy);
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(mask.buffer);
   /* initialize mask */
   for (var n = 0; n < mdata.length; n += 4) {
      mdata[n + Slate.MASK_OFFSET_SELECT]  = Slate.MASK_VAL_FALSE;
      mdata[n + Slate.MASK_OFFSET_ALLOW]   = Slate.MASK_VAL_TRUE;
      mdata[n + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_FALSE;
   }
   return mask;
}

/*****************************************************************************
 * Slate reset.
 *****************************************************************************/

/**
 * Clear selected pixels as well as allowed and required constraints.
 * This results in a blank slate with no selection constraints.
 */
Slate.prototype.clear = function() {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* reinitialize mask */
   for (var n = 0; n < mdata.length; n += 4) {
      mdata[n + Slate.MASK_OFFSET_SELECT]  = Slate.MASK_VAL_FALSE;
      mdata[n + Slate.MASK_OFFSET_ALLOW]   = Slate.MASK_VAL_TRUE;
      mdata[n + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_FALSE;
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "clear" });
}

/*****************************************************************************
 * Pixel constraints: allowable selection area.
 *****************************************************************************/

/**
 * Constrain the selection to be a subset of the specified pixels.
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Slate.prototype.setAllowedPixels = function(pixels) {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* clear allowed flags */
   for (var n = 0; n < mdata.length; n += 4)
      mdata[n + Slate.MASK_OFFSET_ALLOW] = Slate.MASK_VAL_FALSE;
   /* update allowed pixel set */
   for (var p = 0; p < pixels.length; ++p)
      mdata[4*pixels[p] + Slate.MASK_OFFSET_ALLOW] = Slate.MASK_VAL_TRUE;
   /* clear selected and required flags on any pixel not allowed */
   for (var n = 0; n < mdata.length; n += 4) {
      if (mdata[n + Slate.MASK_OFFSET_ALLOW] == Slate.MASK_VAL_FALSE) {
         mdata[n + Slate.MASK_OFFSET_SELECT]  = Slate.MASK_VAL_FALSE;
         mdata[n + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_FALSE;
      }
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "set-allowed" });
}

/**
 * Constrain the selection to be a subset of the pixels in the given region.
 *
 * @param {Region} reg containing region
 */
Slate.prototype.setAllowedRegion = function(reg) {
   this.setAllowedPixels(reg.getPixels());
}

/**
 * Constrain the selection to be a subset of the pixels in the given regions.
 *
 * @param {array} regs containing regions
 */
Slate.prototype.setAllowedRegions = function(regs) {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* clear allowed flags */
   for (var n = 0; n < mdata.length; n += 4)
      mdata[n + Slate.MASK_OFFSET_ALLOW] = Slate.MASK_VAL_FALSE;
   /* update allowed pixel set */
   for (var r = 0; r < regs.length; ++r) {
      /* get pixels for region */
      var pixels = regs[r].getPixels();
      /* add pixels to allowed set */
      for (var p = 0; p < pixels.length; ++p)
         mdata[4*pixels[p] + Slate.MASK_OFFSET_ALLOW] = Slate.MASK_VAL_TRUE;
   }
   /* clear selected and required flags on any pixel not allowed */
   for (var n = 0; n < mdata.length; n += 4) {
      if (mdata[n + Slate.MASK_OFFSET_ALLOW] == Slate.MASK_VAL_FALSE) {
         mdata[n + Slate.MASK_OFFSET_SELECT]  = Slate.MASK_VAL_FALSE;
         mdata[n + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_FALSE;
      }
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "set-allowed" });
}

/**
 * Allow all pixels in the image to be selected.
 */
Slate.prototype.allowAll = function() {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* set allowed flags */
   for (var n = 0; n < mdata.length; n += 4)
      mdata[n + Slate.MASK_OFFSET_ALLOW] = Slate.MASK_VAL_TRUE;
   /* update attached renderers */
   Renderer.updateAll(this, { name: "set-allowed" });
}

/*****************************************************************************
 * Pixel constraints: required selection area.
 *****************************************************************************/

/**
 * Constrain the selection to include the specified pixels.
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Slate.prototype.setRequiredPixels = function(pixels) {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* clear required flags */
   for (var n = 0; n < mdata.length; n += 4)
      mdata[n + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_FALSE;
   /* update required pixel set */
   for (var p = 0; p < pixels.length; ++p) {
      var ind = 4*pixels[p];
      mdata[ind + Slate.MASK_OFFSET_SELECT]  = Slate.MASK_VAL_TRUE;
      mdata[ind + Slate.MASK_OFFSET_ALLOW]   = Slate.MASK_VAL_TRUE;
      mdata[ind + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_TRUE;
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "set-required" });
}

/**
 * Constrain the selection to include the pixels in the given region.
 *
 * @param {Region} reg required region
 */
Slate.prototype.setRequiredRegion = function(reg) {
   this.setRequiredPixels(reg.getPixels());
}

/**
 * Constrain the selection to include the pixels in the given regions.
 *
 * @param {array} regs required regions
 */
Slate.prototype.setRequiredRegions = function(regs) {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* clear required flags */
   for (var n = 0; n < mdata.length; n += 4)
      mdata[n + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_FALSE;
   /* update required pixel set */
   for (var r = 0; r < regs.length; ++r) {
      /* get pixels for region */
      var pixels = regs[r].getPixels();
      /* add pixels to required set */
      for (var p = 0; p < pixels.length; ++p) {
         var ind = 4*pixels[p];
         mdata[ind + Slate.MASK_OFFSET_SELECT]  = Slate.MASK_VAL_TRUE;
         mdata[ind + Slate.MASK_OFFSET_ALLOW]   = Slate.MASK_VAL_TRUE;
         mdata[ind + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_TRUE;
      }
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "set-required" });
}

/**
 * Clear any required selection constraints.
 */
Slate.prototype.requireNone = function() {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* clear required flags */
   for (var n = 0; n < mdata.length; n += 4)
      mdata[n + Slate.MASK_OFFSET_REQUIRE] = Slate.MASK_VAL_FALSE;
   /* update attached renderers */
   Renderer.updateAll(this, { name: "set-required" });
}

/*****************************************************************************
 * Pixel selection.
 *****************************************************************************/

/**
 * Add pixels to selection, subject to the allowed selection constraints.
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Slate.prototype.selectPixels = function(pixels) {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* add pixels to selection */
   for (var p = 0; p < pixels.length; ++p) {
      var ind = 4*pixels[p];
      if (mdata[ind + Slate.MASK_OFFSET_ALLOW] == Slate.MASK_VAL_TRUE)
         mdata[ind + Slate.MASK_OFFSET_SELECT] = Slate.MASK_VAL_TRUE;
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "pixel-select" });
}

/**
 * Add region to selection, subject to the allowed selection constraints.
 *
 * @param {Region} reg region
 */
Slate.prototype.selectRegion = function(reg) {
   this.selectPixels(reg.getPixels());
}

/**
 * Select all allowable pixels in image.
 */
Slate.prototype.selectAll = function() {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* add pixels to selection */
   for (var n = 0; n < mdata.length; n += 4) {
      if (mdata[n + Slate.MASK_OFFSET_ALLOW] == Slate.MASK_VAL_TRUE)
         mdata[n + Slate.MASK_OFFSET_SELECT] = Slate.MASK_VAL_TRUE;
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "pixel-select" });
}

/**
 * Remove pixels from selection, subject to the required selection contraints.
 *
 * @param {array} pixels pixel ids (linear image coordinates)
 */
Slate.prototype.deselectPixels = function(pixels) {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* remove pixels from selection */
   for (var p = 0; p < pixels.length; ++p) {
      var ind = 4*pixels[p];
      if (mdata[ind + Slate.MASK_OFFSET_REQUIRE] == Slate.MASK_VAL_FALSE)
         mdata[ind + Slate.MASK_OFFSET_SELECT] = Slate.MASK_VAL_FALSE;
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "pixel-select" });
}

/**
 * Remove region from selection, subject to the required selection constraints.
 *
 * @param {Region} reg region
 */
Slate.prototype.deselectRegion = function(reg) {
   this.deselectPixels(reg.getPixels());
}

/**
 * Deselect all pixels that are not required to be selected.
 */
Slate.prototype.deselectAll = function() {
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* add pixels to selection */
   for (var n = 0; n < mdata.length; n += 4) {
      if (mdata[n + Slate.MASK_OFFSET_REQUIRE] == Slate.MASK_VAL_FALSE)
         mdata[n + Slate.MASK_OFFSET_SELECT] = Slate.MASK_VAL_FALSE;
   }
   /* update attached renderers */
   Renderer.updateAll(this, { name: "pixel-select" });
}

/*****************************************************************************
 * Selection retrieval.
 *****************************************************************************/

/**
 * Retrieve the pixels captured in the current selection.
 *
 * @returns {array} pixel ids (linear image coordinates)
 */
Slate.prototype.grabPixels = function() {
   /* initialize captured pixel list */
   var pixels = new Array(this.mask.length);
   var n_capture = 0;
   /* grab byte-wise view of mask data */
   var mdata = new Uint8Array(this.mask.buffer);
   /* scan image for captured pixels */
   for (var p = 0; p < pixels.length; ++p) {
      if (mdata[4*p + Slate.MASK_OFFSET_SELECT] == Slate.MASK_VAL_TRUE)
         pixels[n_capture++] = p;
   }
   /* trim captured pixel list to correct length */
   pixels.length = n_capture;
   return pixels;
}
