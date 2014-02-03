/*
 * Copyright (C) 2013-2014 Michael Maire <mmaire@gmail.com>
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
 * Scribble annotation.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Scribble constructor.
 *
 * @class A scribble records brush strokes made by a user during the process
 *        of defining a {@link Region} using machine-assisted segmentation.
 *
 * In addition to brush strokes, a scribble stores (hard and soft) inclusion
 * and exclusion constraints, as well as parameters governing assitance from
 * a precomputed machine segmentation ({@link UCM}) and areas inferred to
 * belong to the region as result of propagating brush strokes according to
 * the UCM.
 *
 * @constructor
 * @param {ImgData} img image being annotated
 */
function Scribble(img) {
   /* store reference to image */
   this.img = img;                                 /* underlying image */
   /* initialize pixel and mask flags */
   this.px_flags   = new Uint32Array(img.size());  /* pixel selection status */
   this.mask_flags = new Uint32Array(img.size());  /* constraint mask status */
   /* user strokes */
   this.stroke_id_curr = 1;                        /* current brush stroke */
   this.stroke_id_soft = 1;                        /* soft override stroke */
   this.stroke_log = new Int16Array(img.size());   /* record of all strokes */
   /* auto-fill threshold */
   this.fill_th = Scribble.DEFAULT_FILL_THRESHOLD; /* ucm boundary threshold */
   /* renderers */
   this.render_delay = false;                      /* is rendering delayed? */
   this.render_queue = {};                         /* rendering queue */
   this.renderers = {};                            /* rendering data */
}

/*****************************************************************************
 * Default parameters.
 *****************************************************************************/

Scribble.DEFAULT_FILL_THRESHOLD = 1.0; /* ucm threshold that stops auto-fill */

/*****************************************************************************
 * Stroke ID range.
 *****************************************************************************/

Scribble.STROKE_ID_MAX = 32000;  /* maximum stroke id (must fit in an Int16) */

/*****************************************************************************
 * Flag values.
 *****************************************************************************/

Scribble.FLAG_FALSE  = 0;   /* false status  (not present, non-propagating)  */
Scribble.FLAG_WEAK   = 63;  /* weak status   (present, weakly propagating)   */
Scribble.FLAG_STRONG = 127; /* strong status (present, strongly propagating) */
Scribble.FLAG_TRUE   = 255; /* true status   (present, non-propagating)      */

/*****************************************************************************
 * Pixel status channel layout.
 *
 * A pixel may be unmarked, marked by a negative or positive user stroke, or
 * inferred to be negative or positive via propagation in the UCM.  An
 * inference originating from a weak marking indicates that the pixel's state
 * is a consequence of strokes that should not override soft constraints.
 *****************************************************************************/

Scribble.PX_CH_NEG  = 0;   /* negative user-marked (false/weak/strong/true) */
Scribble.PX_CH_POS  = 1;   /* positive user-marked (false/weak/strong/true) */
Scribble.PX_CH_INEG = 2;   /* negative inferred (false/weak/strong) */
Scribble.PX_CH_IPOS = 3;   /* positive inferred (false/weak/strong) */

/*****************************************************************************
 * Constraint mask channel layout.
 *
 * The constraint mask permits specification of areas that must be excluded
 * (forbidden) or included (required) in the selected region.  Such hard
 * constraints also prevent contradictory user strokes.  For example, the
 * portion of a positive stroke over a hard negative area is deleted.
 *
 * Soft constraints override past user strokes, but may be overriden by future
 * strokes, where past and future are defined with respect to the absolute
 * value of a particular stroke id.
 *
 * User markings, constraints, and inference interact with the following
 * priority, from high to low, in order to determine a pixel's final label:
 *
 * (1) user markings (weak or strong or true)
 * (2) hard constraints (*)
 * (3) inference (strong)
 * (4) soft constraints (**)
 * (5) inference (weak)
 *
 * (*)  Hard constraints dynamically prevent any conflicting user markings
 *      from being declared on top of them.
 *
 * (**) Soft constraints are only created by softening hard constraints or
 *      by baking current inferences into soft constraints.  Both of these
 *      transformations preserve consistency of user markings with the new
 *      soft constraints.
 *****************************************************************************/

Scribble.MASK_CH_HNEG = 0; /* hard negative (false/true) */
Scribble.MASK_CH_HPOS = 1; /* hard positive (false/true) */
Scribble.MASK_CH_SNEG = 2; /* soft negative (false/true) */
Scribble.MASK_CH_SPOS = 3; /* soft positive (false/true) */

/*****************************************************************************
 * Scribble compression.
 *
 * The {@link ScribbleData} class provides a compressed storage format that
 * can be used for memory-efficient storage of inactive scribbles.  The save()
 * and load() methods below quickly convert to and from this compressed form.
 *****************************************************************************/

/**
 * Save scribble data in compressed form.
 *
 * @returns {ScribbleData} compressed scribble data
 */
Scribble.prototype.save = function() {
   return new ScribbleData(this);
}

/**
 * Load scribble data from compressed form.
 * Replace the currently active scribble with the one being loaded.
 *
 * @param {ScribbleData} data compressed scribble data
 */
Scribble.prototype.load = function(data) {
   data.loadInto(this);
}

/*****************************************************************************
 * Selected area extraction.
 *****************************************************************************/

/**
 * Extract the set of pixels currently selected by the scribble.
 *
 * @returns {array} ids of pixels in scribble region
 */
Scribble.prototype.grabSelectedPixels = function() {
   /* initialize selected pixel set */
   var pixels = new Array(this.px_flags.length);
   var len = 0;
   /* get byte-wise view of pixel and mask data */
   var px   = new Uint8Array(this.px_flags.buffer);
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* scan for selected pixels */
   for (var p = 0; p < pixels.length; ++p) {
      /* compute offset into flag arrays */
      var offset = 4*p;
      /* check direct user markings */
      var sval = /* is pixel selected? */
         (px[offset + Scribble.PX_CH_POS] != Scribble.FLAG_FALSE);
      var done = /* is selection decided? */
         (px[offset + Scribble.PX_CH_NEG] != Scribble.FLAG_FALSE) || sval;
      /* check hard constraints */
      if (!done) {
         var hneg = mask[offset + Scribble.MASK_CH_HNEG];
         var hpos = mask[offset + Scribble.MASK_CH_HPOS];
         sval = (hpos == Scribble.FLAG_TRUE);
         done = (hneg == Scribble.FLAG_TRUE) || sval;
      }
      /* check inference (strong) */
      if (!done) {
         var ineg = px[offset + Scribble.PX_CH_INEG];
         var ipos = px[offset + Scribble.PX_CH_IPOS];
         sval = (ipos == Scribble.FLAG_STRONG);
         done = (ineg == Scribble.FLAG_STRONG) || sval;
      }
      /* check soft constraints */
      if (!done) {
         var sneg = mask[offset + Scribble.MASK_CH_SNEG];
         var spos = mask[offset + Scribble.MASK_CH_SPOS];
         sval = (spos == Scribble.FLAG_TRUE);
         done = (sneg == Scribble.FLAG_TRUE) || sval;
      }
      /* check inference (weak) */
      if (!done)
         sval = (px[offset + Scribble.PX_CH_IPOS] == Scribble.FLAG_WEAK);
      /* store pixel if selected */
      if (sval)
         pixels[len++] = p;
   }
   /* trim selected pixel set */
   pixels.length = len;
   return pixels;
}

/*****************************************************************************
 * Rendering control.
 *****************************************************************************/

/**
 * Delay updating attached rendering targets until calling resumeRendering().
 */

Scribble.prototype.pauseRendering() {
   this.render_delay = true;
}

/**
 * Resume updating attached rendering targets and apply any delayed updates.
 */
Scribble.prototype.resumeRendering() {
   /* remove delay on future rendering requests */
   this.render_delay = false;
   /* process queued rendering events */
   for (action in this.render_queue) {
      if (this.render_queue[action]) {
         Renderer.updateAll(this, { name: action });
         this.render_queue[action] = false;
      }
   }
}

/**
 * Push rendering updates after applying a brush stroke.
 */
Scribble.prototype.renderUpdateStroke = function() {
   this.render_queue["update-px"] = true;
   if (!(this.render_delay)) { this.resumeRendering(); }
}

/**
 * Push rendering updates after completing changes to the inference state.
 */
Scribble.prototype.renderUpdateInference = function() {
   this.render_queue["update-px"] = true;
   if (!(this.render_delay)) { this.resumeRendering(); }
}

/**
 * Push rendering updates after completing changes to the constraint state.
 */
Scribble.prototype.renderUpdateConstraints = function() {
   this.render_queue["update-mask"] = true;
   if (!(this.render_delay)) { this.resumeRendering(); }
}

/**
 * Push rendering updates after changes to all internal state.
 */
Scribble.prototype.renderUpdateAll = function() {
   this.render_queue["update-px"]   = true;
   this.render_queue["update-mask"] = true;
   if (!(this.render_delay)) { this.resumeRendering(); }
}

/*****************************************************************************
 * Brush stroke actions.
 *****************************************************************************/

/**
 * Draw a negative brush stroke.
 *
 * @param {array} pixels ids of pixels to mark as negatives
 * @param {bool}  prop   propagate during inference? (default: false)
 */
Scribble.prototype.strokeDrawNegative = function(pixels, prop) {
   /* determine status flag according to propagation */
   prop = (typeof(prop) != "undefined") ? prop  : false;
   var flag = prop ? Scribble.FLAG_STRONG : Scribble.FLAG_TRUE;
   /* get byte-wise view of pixel and mask data */
   var px   = new Uint8Array(this.px_flags.buffer);
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* draw negative stroke */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* check that hard constraints permit drawing */
      if (mask[offset + Scribble.MASK_CH_HPOS] == Scribble.FLAG_FALSE) {
         px[offset + Scribble.PX_CH_NEG] = flag;
         px[offset + Scribble.PX_CH_POS] = Scribble.FLAG_FALSE; 
         this.stroke_log[p] = -(this.stroke_id_curr);
      }
   }
   /* update attached renderers */
   this.renderUpdateStroke();
}

/**
 * Draw a positive brush stroke.
 *
 * @param {array} pixels ids of pixels to mark as positives
 * @param {bool}  prop   propagate during inference? (default: false)
 */
Scribble.prototype.strokeDrawPositive = function(pixels, prop) {
   /* determine status flag according to propagation */
   prop = (typeof(prop) != "undefined") ? prop  : false;
   var flag = prop ? Scribble.FLAG_STRONG : Scribble.FLAG_TRUE;
   /* get byte-wise view of pixel and mask data */
   var px   = new Uint8Array(this.px_flags.buffer);
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* draw positive stroke */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* check that hard constraints permit drawing */
      if (mask[offset + Scribble.MASK_CH_HNEG] == Scribble.FLAG_FALSE) {
         px[offset + Scribble.PX_CH_NEG] = Scribble.FLAG_FALSE;
         px[offset + Scribble.PX_CH_POS] = flag;
         this.stroke_log[p] = this.stroke_id_curr;
      }
   }
   /* update attached renderers */
   this.renderUpdateStroke();
}

/**
 * Erase negative pixels beneath a brush stroke.
 *
 * @param {array} pixels ids of pixels to unmark as negatives
 */
Scribble.prototype.strokeEraseNegative = function(pixels) {
   /* get byte-wise view of pixel data */
   var px = new Uint8Array(this.px_flags.buffer);
   /* erase negative stroke */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* erase negative */
      px[offset + Scribble.PX_CH_NEG] = Scribble.FLAG_FALSE;
      this.stroke_log[p] = Math.max(this.stroke_log[p], 0);
   }
   /* update attached renderers */
   this.renderUpdateStroke();
}

/**
 * Erase positive pixels beneath a brush stroke.
 *
 * @param {array} pixels ids of pixels to unmark as positives
 */
Scribble.prototype.strokeErasePositive = function(pixels) {
   /* get byte-wise view of pixel data */
   var px = new Uint8Array(this.px_flags.buffer);
   /* erase positive stroke */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* erase positive */
      px[offset + Scribble.PX_CH_POS] = Scribble.FLAG_FALSE;
      this.stroke_log[p] = Math.min(this.stroke_log[p], 0);
   }
   /* update attached renderers */
   this.renderUpdateStroke();
}

/**
 * Erase all pixel markings beneath a brush stroke.
 *
 * @param {array} pixels ids of pixels to unmark
 */
Scribble.prototype.strokeErase = function(pixels) {
   /* get byte-wise view of pixel data */
   var px = new Uint8Array(this.px_flags.buffer);
   /* erase positive stroke */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* erase positive */
      px[offset + Scribble.PX_CH_NEG] = Scribble.FLAG_FALSE;
      px[offset + Scribble.PX_CH_POS] = Scribble.FLAG_FALSE;
      this.stroke_log[p] = 0;
   }
   /* update attached renderers */
   this.renderUpdateStroke();
}

/**
 * Complete the current brush stroke.
 * Increment the stroke id used for logging future strokes.
 *
 * If the stroke log becomes full (stroke id exceeds maximum allowed value),
 * compress the log to consume half the maximum brush stroke id range.
 */
Scribble.prototype.strokeComplete = function() {
   /* check if log compression required */
   if (this.stroke_id_curr == Scribble.STROKE_ID_MAX) {
      /* compute offset to preserve soft override id consistency */
      var offset = ((this.stroke_id_soft % 2) == 0) ? 1 : 0;
      /* compress log */
      for (var n = 0; n < this.stroke_log.length; ++n) {
         /* get stroke id */
         var id = this.stroke_log[n];
         /* extract sign and magnitude */
         var s = Math.sign(id);
         var m = Math.abs(id);
         /* shift magnitude on or after soft override stroke */
         if (m >= this.stroke_id_soft) { m += offset; }
         /* compress magnitude */
         m = Math.floor((m + 1) / 2);
         /* store compressed id */
         this.stroke_log[n] = s * m;
      }
      /* update current and soft override stroke ids */
      this.stroke_id_curr = Math.floor((this.stroke_id_curr + offset + 1) / 2);
      this.stroke_id_soft = Math.floor((this.stroke_id_soft + offset + 1) / 2);
   }
   /* increment current stroke id */
   ++(this.stroke_id_curr);
}

/*****************************************************************************
 * Inference manipulation.
 *****************************************************************************/

/**
 * Clear all current inference state.
 */
Scribble.prototype.inferenceClear = function() {
   /* get byte-wise view of pixel data */
   var px = new Uint8Array(this.px_flags.buffer);
   /* clear negative and postive inference channels */
   for (var p = 0; p < this.px_flags.length; ++p) {
      /* compute offset into flag arrays */
      var offset = 4*p;
      /* erase inferences */
      px[offset + Scribble.PX_CH_INEG] = Scribble.FLAG_FALSE;
      px[offset + Scribble.PX_CH_IPOS] = Scribble.FLAG_FALSE;
   }
   /* update attached renderers */
   this.renderUpdateInference();
}

/**
 * Update the inference state for the specified pixels.
 *
 * @param {array} pixels ids of pixels to update
 * @param {int}   val    state    (-1 = negative, 0 = none, +1 = positive)
 * @param {int}   type   strength (Scribble.FLAG_WEAK or Scribble.FLAG_STRONG)
 */
Scribble.prototype.inferenceUpdate = function(pixels, val, type) {
   /* determine values to assign to each inference channel */
   var nval = (val == -1) ? type : Scribble.FLAG_FALSE;
   var pval = (val ==  1) ? type : Scribble.FLAG_FALSE;
   /* get byte-wise view of pixel data */
   var px = new Uint8Array(this.px_flags.buffer);
   /* update pixel inference */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* update inference channels */
      px[offset + Scribble.PX_CH_INEG] = nval;
      px[offset + Scribble.PX_CH_IPOS] = pval;
   }
   /* update attached renderers */
   this.renderUpdateInference();
}

/*****************************************************************************
 * Constraint manipulation.
 *****************************************************************************/

/**
 * Forbid selection of the specified pixels.
 * Remove any positive user markings covering them.
 *
 * @param {array} pixels ids of pixels to forbid
 */
Scribble.prototype.constrainForbidden = function(pixels) {
   /* get byte-wise view of pixel and mask data */
   var px   = new Uint8Array(this.px_flags.buffer);
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* forbid pixel selection */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* update user markings */
      px[offset + Scribble.PX_CH_POS] = Scribble.FLAG_FALSE;
      /* update constraints */
      mask[offset + Scribble.MASK_CH_HNEG] = Scribble.FLAG_TRUE;
      mark[offset + Scribble.MASK_CH_HPOS] = Scribble.FLAG_FALSE;
   }
   /* update attached renderers */
   this.renderUpdateAll();
}

/**
 * Require selection of the specified pixels.
 * Remove any negative user markings covering them.
 *
 * @param {array} pixels ids of pixels to require
 */
Scribble.prototype.constrainRequired = function(pixels) {
   /* get byte-wise view of pixel and mask data */
   var px   = new Uint8Array(this.px_flags.buffer);
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* require pixel selection */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* update user markings */
      px[offset + Scribble.PX_CH_NEG] = Scribble.FLAG_FALSE;
      /* update constraints */
      mask[offset + Scribble.MASK_CH_HNEG] = Scribble.FLAG_FALSE;
      mark[offset + Scribble.MASK_CH_HPOS] = Scribble.FLAG_TRUE;
   }
   /* update attached renderers */
   this.renderUpdateAll();
}

/**
 * Allow selection of the specified pixels according to user preference.
 * Remove any existing hard constraints governing their selection.
 *
 * @param {array} pixels ids of pixels on which to lift constraints
 */
Scribble.prototype.constrainOptional = function(pixels) {
   /* get byte-wise view of mask data */
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* require pixel selection */
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel id and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* update constraints */
      mask[offset + Scribble.MASK_CH_HNEG] = Scribble.FLAG_FALSE;
      mark[offset + Scribble.MASK_CH_HPOS] = Scribble.FLAG_FALSE;
   }
   /* update attached renderers */
   this.renderUpdateConstraints();
}

/**
 * Clear all existing hard constraints.
 */
Scribble.prototype.clearConstraints = function() {
   /* get byte-wise view of mask data */
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* require pixel selection */
   for (var p = 0; p < this.px_flags.length; ++p) {
      /* compute offset into flag arrays */
      var offset = 4*p;
      /* update constraints */
      mask[offset + Scribble.MASK_CH_HNEG] = Scribble.FLAG_FALSE;
      mark[offset + Scribble.MASK_CH_HPOS] = Scribble.FLAG_FALSE;
   }
   /* update attached renderers */
   this.renderUpdateConstraints();
}

/*****************************************************************************
 * Constraint transformation.
 *****************************************************************************/

/**
 * Transform all hard constraints into soft constraints that produce the same
 * region selection result.  Weaken all existing user markings so that they do
 * not override soft constraints.
 *
 * This transformation allows all future brush strokes to override existing
 * constraints, while preventing deformation of the currently selected region
 * as a result of constraint removal.
 *
 * WARNING: Any active brush stroke must be completed (via strokeComplete()),
 *          and the machine inference data must be up-to-date prior to
 *          softening constraints.
 */
Scribble.prototype.softenConstraints = function() {
   /* get byte-wise view of pixel and mask data */
   var px   = new Uint8Array(this.px_flags.buffer);
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* soften constraints */
   for (var p = 0; p < this.px_flags.length; ++p) {
      /* compute offset into flag arrays */
      var offset = 4*p;
      /* get pixel status flags */
      var neg  = px[offset + Scribble.PX_CH_NEG];
      var pos  = px[offset + Scribble.PX_CH_POS];
      var ineg = px[offset + Scribble.PX_CH_INEG];
      var ipos = px[offset + Scribble.PX_CH_IPOS];
      /* erase contradictory soft constraints on strong marks or inferences */
      if ((neg == Scribble.FLAG_STRONG) || (ineg == Scribble.FLAG_STRONG))
         mask[offset + Scribble.MASK_CH_SPOS] = Scribble.FLAG_FALSE;
      if ((pos == Scribble.FLAG_STRONG) || (ipos == Scribble.FLAG_STRONG))
         mask[offset + Scribble.MASK_CH_SNEG] = Scribble.FLAG_FALSE;
      /* fade: strong user markings -> weak user markings */
      if (neg == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_NEG] = Scribble.FLAG_WEAK;
      if (pos == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_POS] = Scribble.FLAG_WEAK;
      /* fade: strong inferences -> weak inferences */
      if (ineg == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_INEG] = Scribble.FLAG_WEAK;
      if (ipos == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_IPOS] = Scribble.FLAG_WEAK;
      /* get hard constraint flags */
      var hneg = mask[offset + Scribble.MASK_CH_HNEG];
      var hpos = mask[offset + Scribble.MASK_CH_HPOS];
      /* fade: hard constraints -> soft constraints */
      if (hneg == Scribble.FLAG_TRUE) {
         mask[offset + Scribble.MASK_CH_HNEG] = Scribble.FLAG_FALSE;
         mask[offset + Scribble.MASK_CH_SNEG] = Scribble.FLAG_TRUE;
         mask[offset + Scribble.MASK_CH_SPOS] = Scribble.FLAG_FALSE;
      }
      if (hpos == Scribble.FLAG_TRUE) {
         mask[offset + Scribble.MASK_CH_HPOS] = Scribble.FLAG_FALSE;
         mask[offset + Scribble.MASK_CH_SNEG] = Scribble.FLAG_FALSE;
         mask[offset + Scribble.MASK_CH_SPOS] = Scribble.FLAG_TRUE;
      }
   }
   /* update attached renderers */
   this.renderUpdateAll();
}

/**
 * Bake the currently selected region into the soft constraints.  Weaken all
 * existing user markings so that they do not override soft constraints.
 *
 * This transformation enables the possibility of switching the UCM (thereby
 * changing weakly inferred regions) while preventing deformation of the
 * currently selected region.
 *
 * WARNING: Any active brush stroke must be completed (via strokeComplete()),
 *          and the machine inference data must be up-to-date prior to
 *          softening constraints.
 */
Scribble.prototype.bakeConstraints = function() {
   /* get byte-wise view of pixel and mask data */
   var px   = new Uint8Array(this.px_flags.buffer);
   var mask = new Uint8Array(this.mask_flags.buffer);
   /* soften user markings */
   for (var p = 0; p < this.px_flags.length; ++p) {
      /* compute offset into flag arrays */
      var offset = 4*p;
      /* get pixel status flags */
      var neg  = px[offset + Scribble.PX_CH_NEG];
      var pos  = px[offset + Scribble.PX_CH_POS];
      var ineg = px[offset + Scribble.PX_CH_INEG];
      var ipos = px[offset + Scribble.PX_CH_IPOS];
      /* erase contradictory soft constraints on strong marks or inferences */
      if ((neg == Scribble.FLAG_STRONG) || (ineg == Scribble.FLAG_STRONG))
         mask[offset + Scribble.MASK_CH_SPOS] = Scribble.FLAG_FALSE;
      if ((pos == Scribble.FLAG_STRONG) || (ipos == Scribble.FLAG_STRONG))
         mask[offset + Scribble.MASK_CH_SNEG] = Scribble.FLAG_FALSE;
      /* fade: strong user markings -> weak user markings */
      if (neg == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_NEG] = Scribble.FLAG_WEAK;
      if (pos == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_POS] = Scribble.FLAG_WEAK;
      /* fade: strong inferences -> weak inferences */
      if (ineg == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_INEG] = Scribble.FLAG_WEAK;
      if (ipos == Scribble.FLAG_STRONG)
         px[offset + Scribble.PX_CH_IPOS] = Scribble.FLAG_WEAK;
   }
   /* bake current selection into soft constraints */
   for (var p = 0; p < this.px_flags.length; ++p) {
      /* compute offset into flag arrays */
      var offset = 4*p;
      /* check direct user markings */
      var sval = /* is pixel selected? */
         (px[offset + Scribble.PX_CH_POS] != Scribble.FLAG_FALSE);
      var done = /* is selection decided? */
         (px[offset + Scribble.PX_CH_NEG] != Scribble.FLAG_FALSE) || sval;
      /* check hard constraints */
      if (!done) {
         var hneg = mask[offset + Scribble.MASK_CH_HNEG];
         var hpos = mask[offset + Scribble.MASK_CH_HPOS];
         sval = (hpos == Scribble.FLAG_TRUE);
         done = (hneg == Scribble.FLAG_TRUE) || sval;
      }
      /* check inference (strong) */
      if (!done) {
         var ineg = px[offset + Scribble.PX_CH_INEG];
         var ipos = px[offset + Scribble.PX_CH_IPOS];
         sval = (ipos == Scribble.FLAG_STRONG);
         done = (ineg == Scribble.FLAG_STRONG) || sval;
      }
      /* check soft constraints */
      if (!done) {
         var sneg = mask[offset + Scribble.MASK_CH_SNEG];
         var spos = mask[offset + Scribble.MASK_CH_SPOS];
         sval = (spos == Scribble.FLAG_TRUE);
         done = (sneg == Scribble.FLAG_TRUE) || sval;
      }
      /* check inference (weak) */
      if (!done)
         sval = (px[offset + Scribble.PX_CH_IPOS] == Scribble.FLAG_WEAK);
      /* set soft constraints */
      mask[offset + Scribble.MASK_CH_SNEG] =
         (sval) ? Scribble.FLAG_FALSE : Scribble.FLAG_TRUE;
      mask[offset + Scribble.MASK_CH_SPOS] =
         (sval) ? Scribble.FLAG_TRUE : Scribble.FLAG_FALSE;
   }
   /* update attached renderers */
   this.renderUpdateAll();
}
