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
 * @class Utilities for managing renderers associated with scene components.
 *
 * This class provides generic functions for linking and unlinking scene
 * components with renderers that display them.  When a component is connected
 * to one or more renderers, updates to that component's attributes should
 * automatically be reflected in the display output driven by the renderer(s).
 *
 * Compatibility with this functionality requires that component object
 * instances implement a field with the following functionality:
 *    .renderers     - object property initialized to {} and that serves as a
 *                     lookup map of associated renderers indexed by tag
 *
 * Renderers must implement the following methods:
 *    update(obj,ev) - update rendering to reflect changes to scene component
 *    draw()         - generate display output
 *    destroy()      - free graphics resources prior to deletion of renderer
 */
function Renderer() { }

/*****************************************************************************
 * Management of component <-> renderer association.
 *****************************************************************************/

/*
 * Default renderer tag.
 */
Renderer.TAG_DEFAULT = "default";

/**
 * Attach a renderer to a scene component.
 * Replace the existing renderer if one already exists for the specified tag.
 *
 * @param {object} obj scene component
 * @param {object} r   renderer for component
 * @param {string} tag renderer name (optional: TAG_DEFAULT if not specified)
 */
Renderer.attach = function(obj, r, tag) {
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   if (tag in obj.renderers) {
      var r_old = obj.renderers[tag];
      obj.renderers[tag] = r;
      r_old.destroy();
   } else {
      obj.renderers[tag] = r;
   }
}

/**
 * Check if the specified object has an attached renderer with the given tag.
 *
 * @param   {object} obj scene component
 * @param   {string} tag renderer name (optional: TAG_DEFAULT if not specified)
 * @returns {bool}       is renderer attached?
 */
Renderer.isAttached = function(obj, tag) {
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   return (tag in obj.renderers);
}

/**
 * Retrieve the attached renderer with the given tag.
 * Return null if no such renderer is attached.
 *
 * @param   {object} obj scene component
 * @param   {string} tag renderer name (optional: TAG_DEFAULT if not specified)
 * @returns {object}     attached renderer
 */
Renderer.lookup = function(obj, tag) {
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   return (tag in obj.renderers) ? obj.renderers[tag] : null;
}

/**
 * Change the tag of an attached renderer.
 * Throw an error if the specified renderer does not exist.
 *
 * Note: If another renderer is already attached with the new tag, the
 *       retagged renderer replaces it.
 *
 * @param {object} obj     scene component
 * @param {string} tag     current renderer name
 * @param {string} tag_new new renderer name
 */
Renderer.retag = function(obj, tag, tag_new) {
   if (tag in obj.renderers) {
      /* destroy any existing renderer with the new tag */
      if (tag_new in obj.renderers)
         obj.renderers[tag_new].destroy();
      /* rename the tag */
      var r = obj.renderers[tag];
      delete obj.renderers[tag];
      obj.renderers[tag_new] = r;
   } else {
      throw ("attempt to retag renderer with nonexistent tag: " + tag);
   }
}

/**
 * Detach and return the renderer with the given tag.
 * Return null if no such renderer is attached.
 *
 * @param   {object} obj scene component
 * @param   {string} tag renderer name (optional: TAG_DEFAULT if not specified)
 * @returns {object}     renderer
 */
Renderer.detach = function(obj, tag) {
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   if (tag in obj.renderers) {
      var r = obj.renderers[tag];
      delete obj.renderers[tag];
      return r;
   } else {
      return null;
   }
}

/**
 * Detach and return a list of all renderers associated with the component.
 * Return an empty list if no renderers are attached.
 *
 * @param   {object} obj scene component
 * @returns {array}      list of renderers
 */
Renderer.detachAll = function(obj) {
   /* count renderers */
   var n_render = 0;
   for (tag in obj.renderers)
      ++n_render;
   /* detach renderers */
   var rs = new Array(n_render);
   var n = 0;
   for (tag in obj.renderers) {
      rs[n++] = obj.renderers[tag];
      delete obj.renderers[tag];
   }
   return rs;
}

/**
 * Detach and destroy the renderer with the given tag.
 * Throw an error if no such renderer exists.
 *
 * @param {object} obj scene component
 * @param {string} tag renderer name (optional: TAG_DEFAULT if not specified)
 */
Renderer.destroy = function(obj, tag) {
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   if (tag in obj.renderers) {
      var r = obj.renderers[tag];
      delete obj.renderers[tag];
      r.destroy();
   } else {
      throw ("attempt to destroy renderer with nonexistent tag: " + tag);
   }
}

/**
 * Detach and destroy all renderers associated with the component.
 *
 * @param {object} obj scene component
 */
Renderer.destroyAll = function(obj) {
   for (tag in obj.renderers) {
      var r = obj.renderers[tag];
      delete obj.renderers[tag];
      r.destroy();
   }
}

/*****************************************************************************
 * Updating.
 *****************************************************************************/

/**
 * Update the object's attached renderer with the specified tag.
 * Optionally pass event data relevant to the update.
 * Throw an error if no such renderer exists.
 *
 * @param {object} obj scene component
 * @param {object} ev  event data (optional: {} if not specified)
 * @param {string} tag renderer name (optional: TAG_DEFAULT if not specified)
 */
Renderer.update = function(obj, ev, tag) {
   ev  = (typeof(ev)  != "undefined") ? ev : {};
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   if (tag in obj.renderers) {
      var r = obj.renderers[tag];
      r.update(obj, ev);
   } else {
      throw ("attempt to update renderer with nonexistent tag: " + tag);
   }
}

/**
 * Update all renderers attached to the object.
 * Optionally pass event data relevant to the update.
 *
 * @param {object} obj scene component
 * @param {object} ev  event data (optional: {} if not specified)
 */
Renderer.updateAll = function(obj, ev) {
   ev = (typeof(ev) != "undefined") ? ev : {};
   for (tag in obj.renderers) {
      var r = obj.renderers[tag];
      r.update(obj, ev);
   }
}

/*****************************************************************************
 * Drawing.
 *****************************************************************************/

/**
 * Draw the object using the attached renderer with the given tag.
 * Throw an error if no such renderer exists.
 *
 * @param {object} obj scene component
 * @param {string} tag renderer name (optional: TAG_DEFAULT if not specified)
 */
Renderer.draw = function(obj, tag) {
   tag = (typeof(tag) != "undefined") ? tag : Renderer.TAG_DEFAULT;
   if (tag in obj.renderers) {
      var r = obj.renderers[tag];
      r.draw();
   } else {
      throw ("attempt to draw using renderer with nonexistent tag: " + tag);
   }
}

/**
 * Draw the object using all attached renderers.
 *
 * @param {object} obj scene component
 */
Renderer.drawAll = function(obj) {
   for (tag in obj.renderers) {
      var r = obj.renderers[tag];
      r.draw();
   }
}
