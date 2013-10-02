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
 * Depth panel user interface.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Depth panel constructor.
 *
 * @class Depth panels provide interface functionality for depth layer
 *        visibility controls.
 *
 * @constructor
 * @param {object} div         DOM element for depth panel
 * @param {object} depth_range {min,max,step,step_lg,default_far,default_near}
 */
function DepthPanel(div, depth_range) {
   /* default arguments */
   depth_range = (typeof(depth_range) != "undefined") ?
      depth_range
    : {
         min:          -1.00,                   /* min depth (far) */
         max:           0.00,                   /* max depth (near) */
         step:          0.01,                   /* depth step for slider */
         step_lg:       0.05,                   /* depth step for buttons */
         default_far:  -1.00,                   /* default far depth */
         default_near:  0.00                    /* default near depth */
      };
   /* store panel document element */
   this.div = div;
   /* store depth slider range*/
   this.depth_range = {
      min          : depth_range.min,           /* min depth (far) */
      max          : depth_range.max,           /* max depth (near) */
      step         : depth_range.step,          /* depth step for slider */
      step_lg      : depth_range.step_lg,       /* depth step for buttons */
      default_far  : depth_range.default_far,   /* default far depth */
      default_near : depth_range.default_near   /* default near depth */
   };
   /* initialize callbacks */
   this.callback_depth = null;   /* user callback for depth change events */
   /* initialize ui */
   this.initUI();
}

/*****************************************************************************
 * Depth panel initialization.
 *****************************************************************************/

/**
 * Initialize user interface elements.
 */
DepthPanel.prototype.initUI = function() {
   /* initialize depth buttons */
   $("#depth-far-advance", this.div).button(
      { text: false, icons: { primary: "ui-icon-arrowthick-1-n" } }
   );
   $("#depth-far-retreat", this.div).button(
      { text: false, icons: { primary: "ui-icon-arrowthick-1-s" } }
   );
   $("#depth-near-advance", this.div).button(
      { text: false, icons: { primary: "ui-icon-arrowthick-1-n" } }
   );
   $("#depth-near-retreat", this.div).button(
      { text: false, icons: { primary: "ui-icon-arrowthick-1-s" } }
   );
   /* setup depth button event handlers */
   $("#depth-far-advance", this.div).click(
      $.proxy(this.handleDepthFarAdvance, this)
   );
   $("#depth-far-retreat", this.div).click(
      $.proxy(this.handleDepthFarRetreat, this)
   );
   $("#depth-near-advance", this.div).click(
      $.proxy(this.handleDepthNearAdvance, this)
   );
   $("#depth-near-retreat", this.div).click(
      $.proxy(this.handleDepthNearRetreat, this)
   );
   /* initialize depth slider */
   var d_slider = $("#depth-slider", this.div);
   d_slider.slider(
      {
         animate:     false,
         orientation: "vertical",
         range:       true,
         min:         this.depth_range.min,
         max:         this.depth_range.max,
         step:        this.depth_range.step,
         values:
            [this.depth_range.default_far, this.depth_range.default_near]
      }
   );
   /* setup depth slider event handler */
   d_slider.bind("slide", $.proxy(this.handleDepthSlide, this));
   d_slider.bind("slidechange", $.proxy(this.handleDepthSlide, this));
}

/*****************************************************************************
 * Depth panel control.
 *****************************************************************************/

/**
 * Hide the panel.
 *
 * @param {object} duration animation duration (optional)
 */
DepthPanel.prototype.hide = function(duration) {
   if (typeof(duration) != "undefined") {
      Panel.hide(this.div, duration);
   } else {
      Panel.hide(this.div);
   }
}

/**
 * Show the panel.
 *
 * @param {object} duration animation duration (optional)
 */
DepthPanel.prototype.show = function(duration) {
   if (typeof(duration) != "undefined") {
      Panel.show(this.div, duration);
   } else {
      Panel.show(this.div);
   }
}

/*****************************************************************************
 * Depth control.
 *****************************************************************************/

/**
 * Get minimum depth factor.
 *
 * @returns {float} minimum depth factor
 */
DepthPanel.prototype.getDepthMin = function() {
   return this.depth_range.min;
}

/**
 * Get maximum depth factor.
 *
 * @returns {float} maximum depth factor
 */
DepthPanel.prototype.getDepthMax = function() {
   return this.depth_range.max;
}

/**
 * Get depth factor step value.
 *
 * @returns {float} depth factor step
 */
DepthPanel.prototype.getDepthStep = function() {
   return this.depth_range.step;
}

/**
 * Get default far depth factor.
 *
 * @returns {float} default far depth factor.
 */
DepthPanel.prototype.getDepthFarDefault = function() {
   return this.depth_range.default_far;
}

/**
 * Get default near depth factor.
 *
 * @returns {float} default near depth factor.
 */
DepthPanel.prototype.getDepthNearDefault = function() {
   return this.depth_range.default_near;
}

/**
 * Get far depth factor.
 *
 * @returns {float} far depth factor
 */
DepthPanel.prototype.getDepthFar = function() {
   var vals = $("#depth-slider", this.div).slider("option", "values");
   return vals[0];
}

/**
 * Get near depth factor.
 *
 * @returns {float} near depth factor
 */
DepthPanel.prototype.getDepthNear = function() {
   var vals = $("#depth-slider", this.div).slider("option", "values");
   return vals[1];
}

/**
 * Set far depth factor.
 *
 * @param   {float}      d_far far depth factor
 * @returns {DepthPanel}       depth panel (for chaining)
 */
DepthPanel.prototype.setDepthFar = function(d_far) {
   var d_near = this.getDepthNear();
   return this.setDepth(d_far, d_near);
}

/**
 * Set near depth factor.
 *
 * @param   {float}      d_near near depth factor
 * @returns {DepthPanel}        depth panel (for chaining)
 */
DepthPanel.prototype.setDepthNear = function(d_near) {
   var d_far = this.getDepthFar();
   return this.setDepth(d_far, d_near);
}

/**
 * Set both far and near depth factors.
 *
 * @param   {float}      d_far  far depth factor
 * @param   {float}      d_near near depth factor
 * @returns {DepthPanel}        depth panel (for chaining)
 */
DepthPanel.prototype.setDepth = function(d_far, d_near) {
   /* get depth slider element */
   var d_slider = $("#depth-slider", this.div);
   /* check that requested factor is within range */
   if ((d_far  < this.depth_range.min) ||
       (d_near > this.depth_range.max) ||
       (d_far > d_near))
      throw ("attempt to set out-of-range depth factor");
   /* change the slider value (will also trigger user callback) */
   d_slider.slider("option", "values", [d_far, d_near]);
   return this;
}

/*****************************************************************************
 * Event callback binding.
 *****************************************************************************/

/**
 * Bind callback function for depth factor change event.
 *
 * This function must take the following form:
 *    callback(d_far, d_near) { ... }
 * where:
 *    {float} d_far  is the far depth factor
 *    {float} d_near is the near depth factor
 *
 * @param   {function}   callback depth change event callback
 * @returns {DepthPanel}          depth panel (for chaining)
 */
DepthPanel.prototype.bindDepth = function(callback) {
   this.callback_depth = callback;
   return this;
}

/*****************************************************************************
 * Event handlers.
 *****************************************************************************/

/**
 * Hande depth far advance event.
 */
DepthPanel.prototype.handleDepthFarAdvance = function() {
   /* get current depth setting */
   var d_far  = this.getDepthFar();
   var d_near = this.getDepthNear();
   /* advance far depth */
   d_far += this.depth_range.step_lg;
   if (d_far > d_near) { d_far = d_near; }
   /* update depth setting (will also trigger user callback) */
   this.setDepth(d_far, d_near);
}

/**
 * Hande depth far retreat event.
 */
DepthPanel.prototype.handleDepthFarRetreat = function() {
   /* get current depth setting */
   var d_far = this.getDepthFar();
   /* retreat far depth */
   d_far -= this.depth_range.step_lg;
   if (d_far < this.depth_range.min) { d_far = this.depth_range.min; }
   /* update depth setting (will also trigger user callback) */
   this.setDepthFar(d_far);
}

/**
 * Hande depth near advance event.
 */
DepthPanel.prototype.handleDepthNearAdvance = function() {
   /* get current depth setting */
   var d_near = this.getDepthNear();
   /* advance near depth */
   d_near += this.depth_range.step_lg;
   if (d_near > this.depth_range.max) { d_near = this.depth_range.max; }
   /* update depth setting (will also trigger user callback) */
   this.setDepthNear(d_near);
}

/**
 * Hande depth near retreat event.
 */
DepthPanel.prototype.handleDepthNearRetreat = function() {
   /* get current depth setting */
   var d_far  = this.getDepthFar();
   var d_near = this.getDepthNear();
   /* retreat near depth */
   d_near -= this.depth_range.step_lg;
   if (d_near < d_far) { d_near = d_far; }
   /* update depth setting (will also trigger user callback) */
   this.setDepth(d_far, d_near);
}

/**
 * Handle depth slider change event.
 */
DepthPanel.prototype.handleDepthSlide = function() {
   if (this.callback_depth != null)
      this.callback_depth(this.getDepthFar(), this.getDepthNear());
}
