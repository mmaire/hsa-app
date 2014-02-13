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
 * @param {object} size_range { min, max, step, step_lg, default_val }
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
   /* get brush button containers */
   var shape_div = $("#" + prefix + "-brush-shapes", this.div);
   var ink_div   = $("#" + prefix + "-brush-inks",   this.div);
   var mode_div  = $("#" + prefix + "-brush-modes",  this.div);
   /* initialize brush buttonsets */
   shape_div.buttonset();
   ink_div.buttonset();
   mode_div.buttonset();
   /* correct brush icon display - remove corners */
   $(".brush-icon", shape_div)
      .removeClass("ui-corner-left")
      .removeClass("ui-corner-right");
   $(".brush-icon", ink_div)
      .removeClass("ui-corner-left")
      .removeClass("ui-corner-right");
   /* correct brush icon display - add starting corners */
   $(".brush-icon", $(":first-child", shape_div)).addClass("ui-corner-top");
   $(".brush-icon", $(":first-child", ink_div)).addClass("ui-corner-top");
   /* correct brush icon display - add ending corners */
   $(".brush-icon", $(":last-child", shape_div)).addClass("ui-corner-bottom");
   $(".brush-icon", $(":last-child", ink_div)).addClass("ui-corner-bottom");
   /* setup brush button event handlers */
   $("input", shape_div).click(
      $.proxy(this.handleBrushShapeChange, this)
   );
   $("input", ink_div).click(
      $.proxy(this.handleBrushInkChange, this)
   );
   $("input", mode_div).click(
      $.proxy(this.handleBrushModeChange, this)
   );
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
 * Set color of brush ink icon.
 *
 * @param   {string}     ink   brush ink
 * @param   {string}     color color for specified ink
 * @returns {BrushPanel}       brush panel (for chaining)
 */
BrushPanel.prototype.setInkColor = function(ink, color) {
   /* get brush mode button container */
   var prefix = this.div.data("prefix");
   var ink_div = $("#" + prefix + "-brush-inks", this.div);
   /* update button colors */
   $("#brush-" + ink + "-icon", ink_div).css("background-color", color);
   return this;
}

/*****************************************************************************
 * Brush control.
 *****************************************************************************/

/**
 * Get brush shape.
 *
 * @returns {string} brush shape
 */
BrushPanel.prototype.getBrushShape = function() {
   var prefix = this.div.data("prefix");
   var shape_div = $("#" + prefix + "-brush-shapes", this.div);
   var shape_button = $(
      "input:radio[name=" + prefix + "-brush-shapes]:checked", shape_div
   );
   return shape_button.val();
}

/**
 * Get brush ink.
 *
 * @returns {string} brush ink
 */
BrushPanel.prototype.getBrushInk = function() {
   var prefix = this.div.data("prefix");
   var ink_div = $("#" + prefix + "-brush-inks", this.div);
   var ink_button = $(
      "input:radio[name=" + prefix + "-brush-inks]:checked", ink_div
   );
   return ink_button.val();
}

/**
 * Get brush mode.
 *
 * @returns {string} brush mode
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
 * Get complete brush state.
 *
 * @returns {Array} brush state [shape, ink, mode, size]
 */
BrushPanel.prototype.getBrush = function() {
   return [
      this.getBrushShape(),
      this.getBrushInk(),
      this.getBrushMode(),
      this.getBrushSize()
   ];
}

/**
 * Set brush shape.
 *
 * @param   {string}     shape brush shape
 * @param   {bool}       defer skip user callback? (default: false)
 * @returns {BrushPanel}       brush panel (for chaining)
 */
BrushPanel.prototype.setBrushShape = function(shape, defer) {
   /* default arguments */
   defer = (typeof(defer) != "undefined") ? defer : false;
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush shape and ink button containers */
   var shape_div = $("#" + prefix + "-brush-shapes", this.div);
   var ink_div   = $("#" + prefix + "-brush-inks", this.div);
   /* switch shape selection */
   var shape_prev = $(
      "input:radio[name=" + prefix + "-brush-shapes]:checked", shape_div
   );
   var shape_curr = $(
      "#" + prefix + "-brush-" + shape, shape_div
   );
   shape_prev.prop("checked", false);
   shape_curr.prop("checked", true);
   /* update icons */
   var shape_name_prev = shape_prev.val();
   var shape_name_curr = shape_curr.val();
   if (shape_name_prev != shape_name_curr) {
      /* update shape icons */
      $("label", shape_div)
         .removeClass("active").addClass("inactive");
      $("#brush-" + shape_name_curr + "-icon", shape_div)
         .removeClass("inactive").addClass("active");
      /* update ink icons */
      $("label", ink_div)
         .removeClass("brush-" + shape_name_prev + "-img")
         .addClass("brush-" + shape_name_curr + "-img");
   }
   /* refresh shape button display */
   shape_prev.button("refresh");
   shape_curr.button("refresh");
   /* trigger user callback */
   if ((!defer) && (this.callback_brush != null))
      this.callback_brush.apply(undefined, this.getBrush());
   return this;
}

/**
 * Set brush ink.
 *
 * @param   {string}     ink   brush ink
 * @param   {bool}       defer skip user callback? (default: false)
 * @returns {BrushPanel}       brush panel (for chaining)
 */
BrushPanel.prototype.setBrushInk = function(ink, defer) {
   /* default arguments */
   defer = (typeof(defer) != "undefined") ? defer : false;
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush ink button container */
   var ink_div = $("#" + prefix + "-brush-inks", this.div);
   /* switch ink selection */
   var ink_prev = $(
      "input:radio[name=" + prefix + "-brush-inks]:checked", ink_div
   );
   var ink_curr = $(
      "#" + prefix + "-brush-" + ink, ink_div
   );
   ink_prev.prop("checked", false);
   ink_curr.prop("checked", true);
   /* update ink icons */
   var ink_name_curr = ink_curr.val();
   $("label", ink_div)
      .removeClass("active").addClass("inactive");
   $("#brush-" + ink_name_curr + "-icon", ink_div)
      .removeClass("inactive").addClass("active");
   /* refresh ink button display */
   ink_prev.button("refresh");
   ink_curr.button("refresh");
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
   /* switch mode selection */
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
 * Set complete brush state.
 *
 * @param   {string}     shape brush shape
 * @param   {string}     ink   brush ink
 * @param   {string}     mode  brush mode
 * @param   {float}      size  brush size
 * @returns {BrushPanel}       brush panel (for chaining)
 */
BrushPanel.prototype.setBrush = function(shape, ink, mode, size) {
   /* set brush type, mode, touchup (defering callback) */
   this.setBrushShape(shape, true);
   this.setBrushInk(ink, true);
   this.setBrushMode(mode, true);
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
 *    callback(shape, ink, mode, size) { ... }
 * where:
 *    {string} shape   is the brush shape
 *    {string} ink     is the brush ink
 *    {string} mode    is the brush mode
 *    {float}  size    is the brush size
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
 * Handle brush shape change event.
 */
BrushPanel.prototype.handleBrushShapeChange = function() {
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush shape and ink button containers */
   var shape_div = $("#" + prefix + "-brush-shapes", this.div);
   var ink_div   = $("#" + prefix + "-brush-inks", this.div);
   /* get selected shape */
   var shape_curr =  $(
      "input:radio[name=" + prefix + "-brush-shapes]:checked", shape_div
   );
   var shape_name_curr = shape_curr.val();
   /* update shape icons */
   $("label", shape_div)
      .removeClass("active").addClass("inactive");
   $("#brush-" + shape_name_curr + "-icon", shape_div)
      .removeClass("inactive").addClass("active");
   /* update ink icons */
   var labels = $("label", ink_div);
   var classes = $("label:first", ink_div).prop("class").split(" ");
   for (var n = 0; n < classes.length; ++n) {
      if (classes[n].indexOf("-img") != -1)
         labels.removeClass(classes[n]);
   }
   labels.addClass("brush-" + shape_name_curr + "-img");
   /* trigger user callback */
   if (this.callback_brush != null)
      this.callback_brush.apply(undefined, this.getBrush());
}

/**
 * Handle brush ink change event.
 */
BrushPanel.prototype.handleBrushInkChange = function() {
   /* get brush name prefix */
   var prefix = this.div.data("prefix");
   /* get brush ink button container */
   var ink_div = $("#" + prefix + "-brush-inks", this.div);
   /* get selected ink */
   var ink_curr = $(
      "input:radio[name=" + prefix + "-brush-inks]:checked", ink_div
   );
   var ink_name_curr = ink_curr.val();
   /* update ink icons */
   $("label", ink_div)
      .removeClass("active").addClass("inactive");
   $("#brush-" + ink_name_curr + "-icon", ink_div)
      .removeClass("inactive").addClass("active");
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
