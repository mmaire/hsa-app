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
 * Brush panel user interface.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Brush panel constructor.
 *
 * @class Brush panels provide interface functionality for brush controls.
 *
 * @constructor
 * @param {object} div        DOM element for brush panel
 * @param {object} size_range {min, max, step, step_lg, default_val }
 */
function BrushPanel(div, size_range) {
   /* default arguments */
   size_range = (typeof(size_range) != "undefined") ?
      size_range
    : { min: 1, max: 100, step: 1, step_lg: 5, default_val: 50 };
   /* store panel document element */
   this.div = div;
   /* store size slider range */
   this.size_range = {
      min         : size_range.min,          /* minimum brush size */
      max         : size_range.max,          /* maximum brush size */
      step        : size_range.step,         /* size slider step */
      step_lg     : size_range.step_lg,      /* size slider large step */
      default_val : size_range.default_val   /* default brush size */
   };
   /* initialize callbacks */
   this.callback_brush = null;   /* user callback for brush change event */
   /* initialize ui */
   this.initUI();
}

/*****************************************************************************
 * Brush panel initialization.
 *****************************************************************************/

/**
 * Initialize user interface elements.
 */
BrushPanel.prototype.initUI = function() {
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush type and mode button containers */
   var type_div = $("#" + prefix + "-brush-types", this.div);
   var mode_div = $("#" + prefix + "-brush-modes", this.div);
   /* initialize brush buttonsets */
   type_div.buttonset();
   mode_div.buttonset();
   /* correct brush icon display - remove corners */
   $(".brush-icon", type_div)
      .removeClass("ui-corner-left")
      .removeClass("ui-corner-right");
   $(".brush-icon", mode_div)
      .removeClass("ui-corner-left")
      .removeClass("ui-corner-right");
   /* correct brush icon display - add starting corners */
   $(".brush-icon", $(":first-child", type_div)).addClass("ui-corner-top");
   $(".brush-icon", $(":first-child", mode_div)).addClass("ui-corner-top");
   /* correct brush icon display - add ending corners */
   $(".brush-icon", $(":last-child", type_div)).addClass("ui-corner-bottom");
   $(".brush-icon", $(":last-child", mode_div)).addClass("ui-corner-bottom");
   /* setup brush type button event handlers */
   $("input", type_div).click($.proxy(this.handleBrushTypeChange, this));
   /* setup brush mode button event handlers */
   $("input", mode_div).click($.proxy(this.handleBrushModeChange, this));
   /* initialize brush size slider */
   var size_slider = $("#brush-size-slider", this.div);
   var size_text   = $("#brush-size-text", this.div);
   size_slider.slider(
      {
         animate:     false,
         orientation: "horizontal",
         min:         this.size_range.min,
         max:         this.size_range.max,
         step:        this.size_range.step,
         value:       this.size_range.default_val
      }
   );
   size_text.html(this.size_range.default_val + " px");
   /* setup brush size slider event handlers */
   size_slider.bind(
      "slide",
      function(event, ui) { size_text.html(ui.value + " px"); }
   );
   size_slider.bind(
      "slidechange",
      $.proxy(this.handleBrushSizeSlide, this)
   );
   /* initialize brush touchup button */
   var touchup_div = $("#" + prefix + "-brush-touchup", this.div);
   touchup_div.buttonset();
   /* setup brush touchup event handler */
   $("#" + prefix + "-touchup", touchup_div).click(
      $.proxy(this.handleBrushTouchupToggle, this)
   );
}

/*****************************************************************************
 * Brush panel control.
 *****************************************************************************/

/**
 * Hide the panel.
 *
 * @param {object} duration animation duration (optional)
 */
BrushPanel.prototype.hide = function(duration) {
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
BrushPanel.prototype.show = function(duration) {
   if (typeof(duration) != "undefined") {
      Panel.show(this.div, duration);
   } else {
      Panel.show(this.div);
   }
}

/*****************************************************************************
 * Brush panel appearance.
 *****************************************************************************/

/**
 * Set color of brush mode icon.
 *
 * @param   {string}     mode  brush mode
 * @param   {string}     color color for mode
 * @returns {BrushPanel}       brush panel (for chaining)
 */
BrushPanel.prototype.setModeIconColor = function(mode, color) {
   /* get brush mode button container */
   var prefix = this.div.data("prefix");
   var mode_div = $("#" + prefix + "-brush-modes", this.div);
   /* update button colors */
   $("#brush-" + mode + "-icon", mode_div).css("background-color", color);
   return this;
}

/*****************************************************************************
 * Brush control.
 *****************************************************************************/

/**
 * Get brush type.
 *
 * @returns {string} brush type
 */
BrushPanel.prototype.getBrushType = function() {
   var prefix = this.div.data("prefix");
   var type_div = $("#" + prefix + "-brush-types", this.div);
   var type_button = $(
      "input:radio[name=" + prefix + "-brush-types]:checked", type_div
   );
   return type_button.val();
}

/**
 * Get brush mode.
 *
 * @returns {string} brush mode.
 */
BrushPanel.prototype.getBrushMode = function() {
   var prefix = this.div.data("prefix");
   var mode_div = $("#" + prefix + "-brush-modes", this.div);
   var mode_button = $(
      "input:radio[name=" + prefix + "-brush-modes]:checked", mode_div
   );
   return mode_button.val();
}

/**
 * Get brush size.
 *
 * @returns {float} brush size
 */
BrushPanel.prototype.getBrushSize = function() {
   return $("#brush-size-slider", this.div).slider("option", "value");
}

/**
 * Get brush touch-up option.
 *
 * @returns {bool} is touch-up enabled?
 */
BrushPanel.prototype.getBrushTouchup = function() {
   var prefix = this.div.data("prefix");
   var touchup_button = $("#" + prefix + "-touchup", this.div);
   return touchup_button.prop("checked");
}

/**
 * Get complete brush state.
 *
 * @returns {Array} brush state [type, mode, size, touchup]
 */
BrushPanel.prototype.getBrush = function() {
   return [
      this.getBrushType(),
      this.getBrushMode(),
      this.getBrushSize(),
      this.getBrushTouchup()
   ];
}

/**
 * Set brush type
 *
 * @param   {string}     type  brush type
 * @param   {bool}       defer skip user callback? (default: false)
 * @returns {BrushPanel}       brush panel (for chaining)
 */
BrushPanel.prototype.setBrushType = function(type, defer) {
   /* default arguments */
   defer = (typeof(defer) != "undefined") ? defer : false;
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush type and mode button containers */
   var type_div = $("#" + prefix + "-brush-types", this.div);
   var mode_div = $("#" + prefix + "-brush-modes", this.div);
   /* switch type selection */
   var type_prev = $(
      "input:radio[name=" + prefix + "-brush-types]:checked", type_div
   );
   var type_curr = $(
      "#" + prefix + "-brush-" + type, type_div
   );
   type_prev.prop("checked", false);
   type_curr.prop("checked", true);
   /* update mode icons */
   var type_name_prev = type_prev.val();
   var type_name_curr = type_curr.val();
   if (type_name_prev != type_name_curr) {
      $("label", mode_div)
         .removeClass("brush-" + type_name_prev + "-icon-bg")
         .addClass("brush-" + type_name_curr + "-icon-bg");
   }
   /* refresh type button display */
   type_prev.button("refresh");
   type_curr.button("refresh");
   /* trigger user callback */
   if ((!defer) && (this.callback_brush != null))
      this.callback_brush.apply(undefined, this.getBrush());
   return this;
}

/**
 * Set brush mode.
 *
 * @param   {string}     mode  brush mode
 * @param   {bool}       defer skip user callback? (default: false)
 * @returns {BrushPanel}       brush panel (for chaining)
 */
BrushPanel.prototype.setBrushMode = function(mode, defer) {
   /* default arguments */
   defer = (typeof(defer) != "undefined") ? defer : false;
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush mode button container */
   var mode_div = $("#" + prefix + "-brush-modes", this.div);
   /* swith mode selection */
   var mode_prev = $(
      "input:radio[name=" + prefix + "-brush-modes]:checked", mode_div
   );
   var mode_curr = $(
      "#" + prefix + "-brush-" + mode, mode_div
   );
   mode_prev.prop("checked", false);
   mode_curr.prop("checked", true);
   /* refresh mode button display */
   mode_prev.button("refresh");
   mode_curr.button("refresh");
   /* trigger user callback */
   if ((!defer) && (this.callback_brush != null))
      this.callback_brush.apply(undefined, this.getBrush());
   return this;
}

/**
 * Set brush size.
 *
 * @param   {float}      size brush size
 * @returns {BrushPanel}      brush panel (for chaining)
 */
BrushPanel.prototype.setBrushSize = function(size) {
   /* get size slider and text */
   var size_slider = $("#brush-size-slider", this.div);
   var size_text   = $("#brush-size-text", this.div);
   /* check that requested size is within range */
   if ((size < this.size_range.min) || (size > this.size_range.max))
      throw ("attempt to set out-of-range brush size");
   /* change the size text */
   size_text.html(size + " px");
   /* change the slider value (will also trigger user callback) */
   size_slider.slider("option", "value", size);
   return this;
}

/**
 * Increase brush size, limited by the maximum allowed size.
 *
 * @param {bool} large_step take large step in size? (default: false)
 */
BrushPanel.prototype.increaseBrushSize = function(large_step) {
   /* default arguments */
   large_step = (typeof(large_step) != "undefined") ? large_step : false;
   /* compute increased size */
   var size = this.getBrushSize();
   size += (large_step ? this.size_range.step_lg : this.size_range.step);
   /* check limit */
   if (size > this.size_range.max)
      size = this.size_range.max;
   /* update brush size */
   this.setBrushSize(size);
}

/**
 * Decrease brush size, limited by the minimum allowed size.
 *
 * @param {bool} large_step take large step in size? (default: false)
 */
BrushPanel.prototype.decreaseBrushSize = function(large_step) {
   /* default arguments */
   large_step = (typeof(large_step) != "undefined") ? large_step : false;
   /* compute decreased size */
   var size = this.getBrushSize();
   size -= (large_step ? this.size_range.step_lg : this.size_range.step);
   /* check limit */
   if (size < this.size_range.min)
      size = this.size_range.min;
   /* update brush size */
   this.setBrushSize(size);
}

/**
 * Set brush touch-up option.
 *
 * @param   {bool}       touchup touchup state (on/off)
 * @param   {bool}       defer   skip user callback? (default: false)
 * @returns {BrushPanel}         brush panel (for chaining)
 */
BrushPanel.prototype.setBrushTouchup = function(touchup, defer) {
   /* default arguments */
   defer = (typeof(defer) != "undefined") ? defer : false;
   /* update touchup state */
   var prefix = this.div.data("prefix");
   var touchup_button = $("#" + prefix + "-touchup", this.div);
   touchup_button.prop("checked", touchup);
   /* update touchup button display */
   touchup_button.button("refresh");
   /* trigger user callback */
   if ((!defer) && (this.callback_brush != null))
      this.callback_brush.apply(undefined, this.getBrush());
   return this;
}

/**
 * Set complete brush state.
 *
 * @param   {string}     type    brush type
 * @param   {string}     mode    brush mode
 * @param   {float}      size    brush size
 * @param   {bool}       touchup touchup state (on/off)
 * @returns {BrushPanel}         brush panel (for chaining)
 */
BrushPanel.prototype.setBrush = function(type, mode, size, touchup) {
   /* set brush type, mode, touchup (defering callback) */
   this.setBrushType(type, true);
   this.setBrushMode(mode, true);
   this.setBrushTouchup(touchup, true);
   /* set brush size (will also trigger user callback) */
   return this.setBrushSize(size);
}

/*****************************************************************************
 * Event callback binding.
 *****************************************************************************/

/**
 * Bind callback function for brush change events.
 *
 * This function must take the following form:
 *    callback(type, mode, size, touchup) { ... }
 * where:
 *    {string} type    is the brush type
 *    {string} mode    is the brush mode
 *    {int}    size    is the brush size
 *    {bool}   touchup indicates touchup state
 *
 * @param   {function}   callback brush event callback
 * @returns {BrushPanel}          brush panel (for chaining)
 */
BrushPanel.prototype.bindBrush = function(callback) {
   this.callback_brush = callback;
   return this;
}

/*****************************************************************************
 * Event handlers.
 *****************************************************************************/

/**
 * Handle brush type change event.
 */
BrushPanel.prototype.handleBrushTypeChange = function() {
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush type and mode button containers */
   var type_div = $("#" + prefix + "-brush-types", this.div);
   var mode_div = $("#" + prefix + "-brush-modes", this.div);
   /* get selected type */
   var type_curr =  $(
      "input:radio[name=" + prefix + "-brush-types]:checked", type_div
   );
   var type_name_curr = type_curr.val();
   /* update mode icons */
   var labels = $("label", mode_div);
   var classes = $("label:first", mode_div).prop("class").split(" ");
   for (var n = 0; n < classes.length; ++n) {
      if (classes[n].indexOf("-icon-bg") != -1)
         labels.removeClass(classes[n]);
   }
   labels.addClass("brush-" + type_name_curr + "-icon-bg");
   /* trigger user callback */
   if (this.callback_brush != null)
      this.callback_brush.apply(undefined, this.getBrush());
}

/**
 * Handle brush mode change event.
 */
BrushPanel.prototype.handleBrushModeChange = function() {
   if (this.callback_brush != null)
      this.callback_brush.apply(undefined, this.getBrush());
}

/**
 * Handle brush size slider change event.
 */
BrushPanel.prototype.handleBrushSizeSlide = function() {
   if (this.callback_brush != null)
      this.callback_brush.apply(undefined, this.getBrush());
}

/**
 * Handle brush touch-up option toggle event.
 */
BrushPanel.prototype.handleBrushTouchupToggle = function() {
   if (this.callback_brush != null)
      this.callback_brush.apply(undefined, this.getBrush());
}
