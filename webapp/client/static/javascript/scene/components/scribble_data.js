/*
 * Copyright (C) 2014 Michael Maire <mmaire@gmail.com>
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
 * Scribble data.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Scribble data constructor.
 *
 * @class A ScribbleData object stores the contents of a {@link Scribble}
 *        in compressed form.
 *
 * Compression of scribbles can be used to reduce memory usage of inactive
 * scribbles (ie ones not being interactively edited).  The compressed form
 * of a scribble can also be transmitted to/from a datastream.
 *
 * The constructor takes two forms.  Scribble data can be created by
 * compressing the contents of an existing scribble or read from a datastream.
 *
 * @constructor
 * @param {object} obj Scribble to compress OR DataStream to read
 */
function ScribbleData(obj) {
   /* check if creating from existing scribble object or datastream */
   if (obj instanceof Scribble) {
      /* compress pixel and mask flag arrays */
      this.px_flags   = ArrUtil.rleCompress(obj.px_flags);
      this.mask_flags = ArrUtil.rleCompress(obj.mask_flags);
      /* copy user stroke ids, compress stroke log */
      this.stroke_id_curr = obj.stroke_id_curr;
      this.stroke_id_soft = obj.stroke_id_soft;
      this.stroke_log = ArrUtil.rleCompress(obj.stroke_log);
      /* copy auto-fill threshold */
      this.fill_th = obj.fill_th;
   } else if (obj instanceof DataStream) {
      /* load pixel and mask flag arrays */
      this.px_flags   = ArrUtil.rleDeserialize(obj);
      this.mask_flags = ArrUtil.rleDeserialize(obj);
      /* load stroke data */
      this.stroke_id_curr = obj.readUint32();
      this.stroke_id_soft = obj.readUint32();
      this.stroke_log = ArrUtil.rleDeserialize(obj);
      /* load auto-fill threshold */
      this.fill_th = obj.readFloat64();
   } else {
      throw("invalid argument to ScribbleData constructor");
   }
}

/*****************************************************************************
 * Decompression.
 *****************************************************************************/

/**
 * Decompress scribble data and load it into the specified scribble object.
 * The scribble data must be the appropriate size for the destination scribble.
 *
 * @param {Scribble} scrib destination scribble
 */
ScribbleData.prototype.loadInto = function(scrib) {
   /* check compatibility with destination scribble */
   if (scrib.img.size() != this.px_flags.size)
      throw("attempt to load scribble data of incorrect size");
   /* decompress pixel and mask flags into destination scribble */
   scrib.px_flags   = ArrUtil.rleDecompress(this.px_flags);
   scrib.mask_flags = ArrUtil.rleDecompress(this.mask_flags);
   /* decompress stroke data into destination scribble */
   scrib.stroke_id_curr = this.stroke_id_curr;
   scrib.stroke_id_soft = this.stroke_id_soft;
   scrib.stroke_log = ArrUtil.rleDecompress(this.stroke_log);
   /* copy auto-fill threshold */
   scrib.fill_th = this.fill_th;
   /* update renderers attached to destination scribble */
   scrib.renderUpdateAll();
}

/*****************************************************************************
 * Serialization and deserialization.
 *****************************************************************************/

/**
 * Serialize scribble data to a datastream.
 *
 * @param {DataStream} ds datastream to which to write scribble data
 */
ScribbleData.prototype.serialize = function(ds) {
   /* store pixel and mask flags */
   ArrUtil.rleSerialize(ds, this.px_flags);
   ArrUtil.rleSerialize(ds, this.mask_flags);
   /* store stroke data */
   ds.writeUint32(this.stroke_id_curr);
   ds.writeUint32(this.stroke_id_soft);
   ArrUtil.rleSerialize(ds, this.stroke_log);
   /* store auto-fill threshold */
   ds.writeFloat64(this.fill_th);
}

/**
 * Deserialize scribble data from a datastream.
 *
 * @param   {DataStream}   ds datastream to which to write scribble data
 * @returns {ScribbleData}    scribble data created from datastream
 */
ScribbleData.deserialize = function(ds) {
   return new ScribbleData(ds);
}
