/*
 * Copyright (C) 2012-2014 Michael Maire <mmaire@gmail.com>
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
 *        It manages interaction between user scribbles and UCM inference.
 *
 * @constructor
 * @param {ImgData} img image being annotated
 * @param {UCM}     ucm ultrametric contour map for image
 */
function Slate(img, ucm) {
   /* store image and ucm */
   this.img = img;
   this.ucm = ucm;
   /* create active scribble */
   this.scrib = new Scribble(img);
   /* initialize inferred region labels */
   this.ucm_labels_base = ucm.labelsCreate(); /* base labels from user marks */
   this.ucm_labels_pred = ucm.labelsCreate(); /* predicted labels via ucm */
   /* initialize counts of user markings within ucm leaf regions */
   this.reg_cnt_neg  = new Uint32Array(ucm.countLeaves());
   this.reg_cnt_pos  = new Uint32Array(ucm.countLeaves());
   this.reg_cnt_sneg = new Uint32Array(ucm.countLeaves());
   this.reg_cnt_spos = new Uint32Array(ucm.countLeaves());
}

/*****************************************************************************
 * Slate region label values for UCM inference.
 *****************************************************************************/

Slate.UCM_NEG  = -1.0;  /* negative */
Slate.UCM_SNEG = -0.5;  /* soft negative */
Slate.UCM_NONE =  0.0;  /* unlabeled region */
Slate.UCM_SPOS =  0.5;  /* soft positive */
Slate.UCM_POS  =  1.0;  /* positive */

/*****************************************************************************
 * Slate reset.
 *****************************************************************************/

/**
 * Clear all user scribbles and selection constraints.
 */
Slate.prototype.clear = function() {
   /* reset scribble */
   this.scrib.clear();
   /* reset inferred region labels */
   this.ucm_labels_base = this.ucm.labelsCreate();
   this.ucm_labels_pred = this.ucm.labelsCreate();
   /* reset ucm region counts */
   this.reg_cnt_neg  = new Uint32Array(this.ucm.countLeaves());
   this.reg_cnt_pos  = new Uint32Array(this.ucm.countLeaves());
   this.reg_cnt_sneg = new Uint32Array(this.ucm.countLeaves());
   this.reg_cnt_spos = new Uint32Array(this.ucm.countLeaves());
}

/*****************************************************************************
 * Region load.
 *****************************************************************************/

/**
 * Load a region into the slate for editing.
 *
 * @param {Region} r region to load
 */
Slate.prototype.regionLoad = function(r) {
   /* pause scribble rendering */
   this.scrib.pauseRendering();
   /* check for associated scribble data */
   if (r.scrib_data != null) {
      /* load scribble data */
      this.scrib.load(r.scrib_data);
      /* soften constraints of previous scribble annotation */
      this.scrib.softenConstraints();
   } else {
      /* reset scribble data */
      this.scrib.clear();
   }
   /* restrict scribble to parent region */
   var rp = r.getParentRegion();
   if ((rp != null) && ((r.seg == null) || (rp != r.seg.root)))
      this.scrib.constrainSubset(rp.getPixels());
   /* require scribble to include child regions */
   var rc = r.getChildRegions();
   for (var n = 0; n < rc.length; ++n)
      this.scrib.constrainRequired(rc[n].getPixels());
   /* bake currently selected region into soft constraints */
   this.scrib.bakeConstraints();
   /* reset ucm region counts */
   this.reg_cnt_neg  = new Uint32Array(this.ucm.countLeaves());
   this.reg_cnt_pos  = new Uint32Array(this.ucm.countLeaves());
   this.reg_cnt_sneg = new Uint32Array(this.ucm.countLeaves());
   this.reg_cnt_spos = new Uint32Array(this.ucm.countLeaves());
   /* recompute ucm region counts from scribble */
   var px = new Uint8Array(this.scrib.px_flags.buffer);
   var px_rid_map = this.ucm.px_rid_map;
   for (var p = 0; p < px_rid_map.length; ++p) {
      /* get id of ucm leaf region */
      var r_id = px_rid_map[p];
      /* lookup user marks */
      var offset = 4*p;
      var val_neg = px[offset + Scribble.PX_CH_NEG];
      var val_pos = px[offset + Scribble.PX_CH_POS];
      /* update counts */
      this.reg_cnt_neg[r_id]  += (val_neg == Scribble.FLAG_STRONG);
      this.reg_cnt_pos[r_id]  += (val_pos == Scribble.FLAG_STRONG);
      this.reg_cnt_sneg[r_id] += (val_neg == Scribble.FLAG_WEAK);
      this.reg_cnt_spos[r_id] += (val_pos == Scribble.FLAG_WEAK);
   }
   /* construct base region labels */
   this.ucm_labels_base = this.ucm.labelsCreate();
   for (var n = 0; n < this.ucm.n_regions_leaf; ++n) {
      /* get positive / negative label differences */
      var diff  = this.reg_cnt_pos[n]  - this.reg_cnt_neg[n];
      var sdiff = this.reg_cnt_spos[n] - this.reg_cnt_sneg[n];
      /* choose region label */
      if (Math.abs(diff) > 0) {
         this.ucm_labels_base[n] = Math.sign(diff);
      } else if (Math.abs(sdiff) > 0) {
         this.ucm_labels_base[n] = 0.5 * Math.sign(diff);
      }
   }
   /* recompute ucm inference */
   this.ucm_labels_pred = new Float32Array(this.ucm_labels_base);
   this.ucm.labelsPropagate(this.ucm_labels_pred);
   /* update scribble inference */
   for (var n = 0; n < this.ucm.n_regions_leaf; ++n) {
      /* get inferred region label */
      var lbl  = this.ucm_labels_pred[n];
      var val  = Math.sign(lbl);
      var type =
         (Math.abs(lbl) > 0.5) ? Scribble.FLAG_STRONG : Scribble.FLAG_WEAK;
      /* set inference flags for all pixels in region */
      this.scrib.inferenceUpdate(this.ucm.reg_info[n].pixels, val, type);
   }
   /* resume scribble rendering */
   this.scrib.resumeRendering();
}

/*****************************************************************************
 * Region save.
 *****************************************************************************/

/**
 * Save current selection into the specified region.
 *
 * @param {Region} r region to save
 */
Slate.prototype.regionSave = function(r) {
   /* grab selected pixels from scribble */
   var pixels = this.scrib.grabSelectedPixels();
   /* update region contents */
   r.setPixels(pixels);
   /* store compressed scribble data in region */
   r.scrib_data = this.scrib.save();
}


/*****************************************************************************
 * Region label counting.
 *****************************************************************************/

/**
 * Remove the specified pixels from the region label tally.
 *
 * @param {array} pixels ids of pixels to remove
 */
Slate.prototype.regionCountRemove = function(pixels) {
   /* get pixel status flags and pixel -> region map */
   var px = new Uint8Array(this.scrib.px_flags.buffer);
   var px_rid_map = this.ucm.px_rid_map;
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* get id of ucm leaf region */
      var r_id = px_rid_map[p];
      /* lookup user marks */
      var val_neg = px[offset + Scribble.PX_CH_NEG];
      var val_pos = px[offset + Scribble.PX_CH_POS];
      /* update counts */
      this.reg_cnt_neg[r_id]  -= (val_neg == Scribble.FLAG_STRONG);
      this.reg_cnt_pos[r_id]  -= (val_pos == Scribble.FLAG_STRONG);
      this.reg_cnt_sneg[r_id] -= (val_neg == Scribble.FLAG_WEAK);
      this.reg_cnt_spos[r_id] -= (val_pos == Scribble.FLAG_WEAK);
   }
}

/**
 * Add the specified pixels from the region label tally.
 *
 * @param {array} pixels ids of pixels to add
 */
Slate.prototype.regionCountAdd = function(pixels) {
   /* get pixel status flags and pixel -> region map */
   var px = new Uint8Array(this.scrib.px_flags.buffer);
   var px_rid_map = this.ucm.px_rid_map;
   for (var n = 0; n < pixels.length; ++n) {
      /* get pixel and offset */
      var p = pixels[n];
      var offset = 4*p;
      /* get id of ucm leaf region */
      var r_id = px_rid_map[p];
      /* lookup user marks */
      var val_neg = px[offset + Scribble.PX_CH_NEG];
      var val_pos = px[offset + Scribble.PX_CH_POS];
      /* update counts */
      this.reg_cnt_neg[r_id]  += (val_neg == Scribble.FLAG_STRONG);
      this.reg_cnt_pos[r_id]  += (val_pos == Scribble.FLAG_STRONG);
      this.reg_cnt_sneg[r_id] += (val_neg == Scribble.FLAG_WEAK);
      this.reg_cnt_spos[r_id] += (val_pos == Scribble.FLAG_WEAK);
   }
}

/*****************************************************************************
 * Drawing.
 *****************************************************************************/



/**
 * Draw a negative brush stroke on the slate.
 * Update the scribble and the region counts for UCM inference.
 *
 * @param {array} pixels ids of pixels to mark as negatives
 * @param {bool}  prop   propagate during inference? (default: false)
 */
Slate.prototype.strokeDrawNegative = function(pixels, prop) {
   this.regionCountRemove(pixels);
   this.scrib.strokeDrawNegative(pixels, prop);
   this.regionCountAdd(pixels);
   this.strokeComplete();
}

/**
 * Draw a positive brush stroke on the slate.
 * Update the scribble and the region counts for UCM inference.
 *
 * @param {array} pixels ids of pixels to mark as negatives
 * @param {bool}  prop   propagate during inference? (default: false)
 */
Slate.prototype.strokeDrawPositive = function(pixels, prop) {
   this.regionCountRemove(pixels);
   this.scrib.strokeDrawPositive(pixels, prop);
   this.regionCountAdd(pixels);
   this.strokeComplete();
}

/**
 * Erase a negative area on the slate.
 * Update the scribble and the region counts for UCM inference.
 *
 * @param {array} pixels ids of pixels to mark as negatives
 */
Slate.prototype.strokeEraseNegative = function(pixels) {
   this.regionCountRemove(pixels);
   this.scrib.strokeEraseNegative(pixels);
   this.regionCountAdd(pixels);
}

/**
 * Erase a positive area on the slate.
 * Update the scribble and the region counts for UCM inference.
 *
 * @param {array} pixels ids of pixels to mark as negatives
 */
Slate.prototype.strokeErasePostive = function(pixels) {
   this.regionCountRemove(pixels);
   this.scrib.strokeErasePositive(pixels);
   this.regionCountAdd(pixels);
}

/**
 * Complete a stroke, recompute UCM inference, and update the scribble.
 */
Slate.prototype.strokeComplete = function() {
   /* pause scribble rendering */
   this.scrib.pauseRendering();
   /* tell scribble to complete the stroke */
   this.scrib.strokeComplete();
   /* construct base region labels */
   this.ucm_labels_base = this.ucm.labelsCreate();
   for (var n = 0; n < this.ucm.n_regions_leaf; ++n) {
      /* get positive / negative label differences */
      var diff  = this.reg_cnt_pos[n]  - this.reg_cnt_neg[n];
      var sdiff = this.reg_cnt_spos[n] - this.reg_cnt_sneg[n];
      /* choose region label */
      if (Math.abs(diff) > 0) {
         this.ucm_labels_base[n] = Math.sign(diff);
      } else if (Math.abs(sdiff) > 0) {
         this.ucm_labels_base[n] = 0.5 * Math.sign(diff);
      }
   }
   /* recompute ucm inference */
   var labels_pred = new Float32Array(this.ucm_labels_base);
   this.ucm.labelsPropagate(labels_pred);
   /* update inference flags for changed predictions */
   for (var n = 0; n < this.ucm.n_regions_leaf; ++n) {
      /* get inferred region label, check if changed */
      var lbl = labels_pred[n];
      if (lbl != this.ucm_labels_pred[n]) {
         /* get inference value and type */
         var val  = Math.sign(lbl);
         var type =
            (Math.abs(lbl) > 0.5) ? Scribble.FLAG_STRONG : Scribble.FLAG_WEAK;
         /* set inference flags for all pixels in region */
         this.scrib.inferenceUpdate(this.ucm.reg_info[n].pixels, val, type);
      }
   }
   /* store latest predictions */
   this.ucm_labels_pred = labels_pred;
   /* resume scribble rendering */
   this.scrib.resumeRendering();
}
