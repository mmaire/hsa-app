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
 * Image data.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Image data constructor.
 *
 * @class This ImgData class is a wrapper around the builtin javascript Image
 *        class that provides additional methods for use by scene components
 *        and facilitates WebGL rendering.
 *
 * Note that the underlying Image object should not be modified while the
 * corresponding ImgData object is in use.
 *
 * @constructor
 * @param {Image} im javascript image (must have finished loading)
 */
function ImgData(im) {
   /* store image */
   this.im = im;
   /* rendering data */
   this.renderers = {};
}

/*****************************************************************************
 * Image size.
 *****************************************************************************/

/**
 * Get number of pixels in the image.
 *
 * @returns {int} image size (height * width)
 */
ImgData.prototype.size = function() {
   return (this.im.height) * (this.im.width);
}

/**
 * Get image size in x-dimension.
 *
 * @returns {int} image size in x-dimension
 */
ImgData.prototype.sizeX = function() {
   return this.im.height;
}

/**
 * Get image size in y-dimension.
 *
 * @returns {int} image size in y-dimension
 */
ImgData.prototype.sizeY = function() {
   return this.im.width;
}

/*****************************************************************************
 * Image data.
 *****************************************************************************/

/**
 * Get image object.
 *
 * @returns {Image} image object
 */
ImgData.prototype.data = function() {
   return this.im;
}
