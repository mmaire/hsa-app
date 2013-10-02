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

/**
 * @class Utilities for managing user interface panel elements.
 *
 * This class provides generic functions useful for multiple subtypes of panel.
 */
function Panel() { }

/*****************************************************************************
 * Panel display animations.
 *****************************************************************************/

/**
 * Hide the panel in the specified document div element.
 *
 * @param {object} div      DOM element for panel
 * @param {object} duration animation duration (optional)
 */
Panel.hide = function(div, duration) {
   /* determine animation to use */
   var effect = "slide";
   var effect_args = { };
   if (div.hasClass("panel-left"))
      effect_args = { direction: "right" };
   else if (div.hasClass("panel-right"))
      effect_args = { direction: "left" };
   else if (div.hasClass("panel-top"))
      effect_args = { direction: "down" };
   else if (div.hasClass("panel-bottom"))
      effect_args = { direction: "up" };
   /* run hide animation */
   if (typeof(duration) != "undefined")
      div.hide(effect, effect_args, duration);
   else
      div.hide(effect, effect_args);
}

/**
 * Hide the panel in the specified document div element.
 *
 * @param {object} div      DOM element for panel
 * @param {object} duration animation duration (optional)
 */
Panel.show = function(div, duration) {
   /* determine animation to use */
   var effect = "slide";
   var effect_args = { };
   if (div.hasClass("panel-left"))
      effect_args = { direction: "right" };
   else if (div.hasClass("panel-right"))
      effect_args = { direction: "left" };
   else if (div.hasClass("panel-top"))
      effect_args = { direction: "down" };
   else if (div.hasClass("panel-bottom"))
      effect_args = { direction: "up" };
   /* run show animation */
   if (typeof(duration) != "undefined")
      div.show(effect, effect_args, duration);
   else
      div.show(effect, effect_args);
}
