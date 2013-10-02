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
 * Region attributes.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Region attributes constructor.
 *
 * @class This class stores an attribute set associated with a {@link Region}.
 *
 * @constructor
 */
function RegionAttributes() {
   this.name  = "";                                /* object/part name */
   this.color = RegionAttributes.generateColor();  /* display color */
}

/*****************************************************************************
 * Color generation.
 *****************************************************************************/

/**
 * Generate a random color for use in region visualization.
 *
 * @returns {array} region color as RGBA tuple with values in range [0, 1]
 */
RegionAttributes.generateColor = function() {
   var color = new Array(4);
   color[0] = Math.random();
   color[1] = Math.random();
   color[2] = Math.random();
   color[3] = 1.0;
   return color;
}

/*****************************************************************************
 * Attribute state manipulation.
 *****************************************************************************/

/**
 * Get the region name.
 *
 * @returns {string} region name 
 */
RegionAttributes.prototype.getName = function() {
   return this.name;
}

/**
 * Set the region name.
 *
 * @param {string} name region name
 */
RegionAttributes.prototype.setName = function(name) {
   this.name = name;
}

/**
 * Get the region color.
 *
 * @returns {array} region color as RGBA tuple with values in range [0, 1]
 */
RegionAttributes.prototype.getColor = function() {
   return this.color;
}

/**
 * Set the region color.
 *
 * @param color color as RGBA tuple with values in range [0, 1]
 */
RegionAttributes.prototype.setColor = function(color) {
   this.color[0] = color[0];
   this.color[1] = color[1];
   this.color[2] = color[2];
   this.color[3] = color[3];
}
