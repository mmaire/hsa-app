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
 * View panel user interface.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * View panel constructor.
 *
 * @class View panels provide interface functionality for pan and zoom
 *        controls.
 *
 * @constructor
 * @param {object} div        DOM element for view panel
 * @param {object} zoom_range zoom slider { min, max, step, default_val }
 */
function ViewPanel(div, zoom_range) {
   /* default arguments */
   zoom_range = (typeof(zoom_range) != "undefined") ?
      zoom_range
    : { min: -1.0, max: 1.0, step: 0.1, default_val: 0.0 };
   /* store panel document element */
   this.div = div;
   /* store zoom slider range*/
   this.zoom_range = {
      min         : zoom_range.min,          /* minimum zoom factor */
      max         : zoom_range.max,          /* maximum zoom factor */
      step        : zoom_range.step,         /* zoom slider step */
      default_val : zoom_range.default_val   /* default zoom factor */
   };
   /* initialize callbacks */
   this.callback_reset = null;   /* user callback for view reset events */
   this.callback_pan   = null;   /* user callback for pan events */
   this.callback_zoom  = null;   /* user callback for zoom change events */
   /* initialize ui */
   this.initUI();
}

/*****************************************************************************
 * View panel initialization.
 *****************************************************************************/

/**
 * Initialize user interface elements.
 */
ViewPanel.prototype.initUI = function() {
   /* initialize pan buttons */
   $("#pan-center", this.div).button(
      { text: false, icons: { primary: "ui-icon-bullet" } }
   );
   $("#pan-n", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-n" } }
   );
   $("#pan-s", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-s" } }
   );
   $("#pan-e", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-e" } }
   );
   $("#pan-w", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-w" } }
   );
   $("#pan-ne", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-ne" } }
   );
   $("#pan-nw", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-nw" } }
   );
   $("#pan-se", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-se" } }
   );
   $("#pan-sw", this.div).button(
      { text: false, icons: { primary: "ui-icon-triangle-1-sw" } }
   );
   /* setup pan button event handlers */
   $("#pan-center", this.div).click($.proxy(this.handleReset, this));
   $("#pan-n", this.div).click(
      $.proxy(function() { this.handlePan(0, 1); }, this)
   );
   $("#pan-s", this.div).click(
      $.proxy(function() { this.handlePan(0, -1); }, this)
   );
   $("#pan-e", this.div).click(
      $.proxy(function() { this.handlePan(1, 0); }, this)
   );
   $("#pan-w", this.div).click(
      $.proxy(function() { this.handlePan(-1, 0); }, this)
   );
   $("#pan-ne", this.div).click(
      $.proxy(function() { this.handlePan(1, 1); }, this)
   );
   $("#pan-nw", this.div).click(
      $.proxy(function() { this.handlePan(-1, 1); }, this)
   );
   $("#pan-se", this.div).click(
      $.proxy(function() { this.handlePan(1, -1); }, this)
   );
   $("#pan-sw", this.div).click(
      $.proxy(function() { this.handlePan(-1, -1); }, this)
   );
   /* initialize zoom buttons */
   $("#zoom-in", this.div).button(
      { text: false, icons: { primary: "ui-icon-zoomin" } }
   );
   $("#zoom-out", this.div).button(
      { text: false, icons: { primary: "ui-icon-zoomout" } }
   );
   $("#zoom-fit", this.div).button(
      { text: false, icons: { primary: "ui-icon-arrow-4-diag" } }
   );
   /* setup zoom button event handlers */
   $("#zoom-in",  this.div).click($.proxy(this.handleZoomIn,  this));
   $("#zoom-out", this.div).click($.proxy(this.handleZoomOut, this));
   /* initialize zoom slider */
   var z_slider = $("#zoom-slider", this.div);
   z_slider.slider(
      {
         animate:     false,
         orientation: "vertical",
         min:         this.zoom_range.min,
         max:         this.zoom_range.max,
         step:        this.zoom_range.step,
         value:       this.zoom_range.default_val
      }
   );
   /* setup zoom slider event handler */
   z_slider.bind("slidechange", $.proxy(this.handleZoomSlide, this));
}

/*****************************************************************************
 * View panel control.
 *****************************************************************************/

/**
 * Hide the panel.
 *
 * @param {object} duration animation duration (optional)
 */
ViewPanel.prototype.hide = function(duration) {
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
ViewPanel.prototype.show = function(duration) {
   if (typeof(duration) != "undefined") {
      Panel.show(this.div, duration);
   } else {
      Panel.show(this.div);
   }
}

/*****************************************************************************
 * Zoom control.
 *****************************************************************************/

/**
 * Get minimum zoom factor.
 *
 * @returns {float} minimum zoom factor
 */
ViewPanel.prototype.getZoomMin = function() {
   return this.zoom_range.min;
}

/**
 * Get maximum zoom factor.
 *
 * @returns {float} maximum zoom factor
 */
ViewPanel.prototype.getZoomMax = function() {
   return this.zoom_range.max;
}

/**
 * Get zoom factor step value.
 *
 * @returns {float} zoom factor step
 */
ViewPanel.prototype.getZoomStep = function() {
   return this.zoom_range.step;
}

/**
 * Get default zoom factor.
 *
 * @returns {float} default zoom factor
 */
ViewPanel.prototype.getZoomDefault = function() {
   return this.zoom_range.default_val;
}

/**
 * Get zoom factor.
 *
 * @returns {float} zoom factor
 */
ViewPanel.prototype.getZoom = function() {
   return $("#zoom-slider", this.div).slider("option", "value");
}

/**
 * Set zoom factor.
 *
 * @param   {float}     z zoom factor
 * @returns {ViewPanel}   view panel (for chaining)
 */
ViewPanel.prototype.setZoom = function(z) {
   /* get zoom slider element */
   var z_slider = $("#zoom-slider", this.div);
   /* check that requested factor is within range */
   if ((z < this.zoom_range.min) || (z > this.zoom_range.max))
      throw ("attempt to set out-of-range zoom factor");
   /* change the slider value (will also trigger user callback) */
   z_slider.slider("option", "value", z);
   return this;
}

/**
 * Zoom in.
 * Increase zoom factor by step, limited by zoom range.
 *
 * @param   {float}     step zoom step (default: use zoom slider step)
 * @returns {ViewPanel}      view panel (for chaining)
 */
ViewPanel.prototype.zoomIn = function(step) {
   /* default arguments */
   step = (typeof(step) != "undefined") ? step : this.zoom_range.step;
   /* get zoom factor */
   var z_slider = $("#zoom-slider", this.div);
   var z = z_slider.slider("option", "value");
   /* increment zoom */
   z += step;
   /* enforce zoom bounds */
   if (z < this.zoom_range.min) { z = this.zoom_range.min; }
   if (z > this.zoom_range.max) { z = this.zoom_range.max; }
   /* update zoom slider (will also trigger user callback) */
   z_slider.slider("option", "value", z);
   return this;
}
/**
 * Zoom out.
 * Decrease zoom factor by step, limited by zoom range.
 *
 * @param   {float}     step zoom step (default: use zoom slider step)
 * @returns {ViewPanel}      view panel (for chaining)
 */
ViewPanel.prototype.zoomOut = function(step) {
   /* default arguments */
   step = (typeof(step) != "undefined") ? step : this.zoom_range.step;
   /* zoom in by negative step */
   return this.zoomIn(-step);
}

/*****************************************************************************
 * Event callback binding.
 *****************************************************************************/

/**
 * Bind callback function for the reset event.
 *
 * This function must take the following form:
 *    callback() { ... }
 *
 * @param   {function}  callback reset event callback
 * @returns {ViewPanel}          view panel (for chaining)
 */
ViewPanel.prototype.bindReset = function(callback) {
   this.callback_reset = callback;
   return this;
}

/**
 * Bind callback function for pan events.
 *
 * This function must take the following form:
 *    callback(offset_x, offset_y) { ... }
 * where:
 *    {int} offset_x in {-1, 0, 1}
 *    {int} offset_y in {-1, 0, 1}
 * represent the (x,y) direction of pan movement.
 *
 * @param   {function}  callback pan event callback
 * @returns {ViewPanel}          view panel (for chaining)
 */
ViewPanel.prototype.bindPan = function(callback) {
   this.callback_pan = callback;
   return this;
}

/**
 * Bind callback function for zoom change events.
 *
 * This function must take the following form:
 *    callback(zoom) { ... }
 * where:
 *    {float} zoom is the new zoom factor.
 *
 * @param   {function}  callback zoom event callback
 * @returns {ViewPanel}          view panel (for chaining)
 */
ViewPanel.prototype.bindZoom = function(callback) {
   this.callback_zoom = callback;
   return this;
}

/*****************************************************************************
 * Event handlers.
 *****************************************************************************/

/**
 * Handle view reset event.
 */
ViewPanel.prototype.handleReset = function() {
   if (this.callback_reset != null)
      this.callback_reset();
}

/**
 * Handle pan event.
 *
 * @param {int} offset_x pan offset in x-direction (east-west)
 * @param {int} offset_y pan offset in y-direction (north-south)
 */
ViewPanel.prototype.handlePan = function(offset_x, offset_y) {
   if (this.callback_pan != null)
      this.callback_pan(offset_x, offset_y);
}

/**
 * Handle zoom-in event.
 */
ViewPanel.prototype.handleZoomIn = function() {
   /* call zoom-in method (will also trigger user callback) */
   this.zoomIn();
}


/**
 * Handle zoom-out event.
 */
ViewPanel.prototype.handleZoomOut = function() {
   /* call zoom-out method (will also trigger user callback) */
   this.zoomOut();
}

/**
 * Handle zoom slider change event.
 */
ViewPanel.prototype.handleZoomSlide = function() {
   if (this.callback_zoom != null)
      this.callback_zoom(this.getZoom());
}
