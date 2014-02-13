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
 * @class Array utility functions.
 *
 * This class provides generic functions that operate on both the standard 
 * Array class as well as the typed array classes (Int8Array, Uint8Array, ...).
 * Each function preserves array type (output types match input types), 
 * allowing use of these utilities to write generic code that works for all 
 * array types.
 */
function ArrUtil() { }

/*****************************************************************************
 * Basic array operations.
 *****************************************************************************/

/**
 * Get a reference to the underlying array class (eg Array, Int8Array, ...).
 * Throw an exception if the argument is not a generic or typed array.
 *
 * @param   {array} arr array to examine
 * @returns {type}  ty  array type (constructor function)
 */
ArrUtil.getClass = function(arr) {
   if (arr instanceof Array)             { return Array; }
   else if (arr instanceof Int8Array)    { return Int8Array; }
   else if (arr instanceof Uint8Array)   { return Uint8Array; }
   else if (arr instanceof Int16Array)   { return Int16Array; }
   else if (arr instanceof Uint16Array)  { return Uint16Array; }
   else if (arr instanceof Int32Array)   { return Int32Array; }
   else if (arr instanceof Uint32Array)  { return Uint32Array; }
   else if (arr instanceof Float32Array) { return Float32Array; }
   else if (arr instanceof Float64Array) { return Float64Array; }
   else { throw "argument is not an array type"; }
}

/**
 * Create an array of the specified size and type.
 *
 * @param   {int}   size number of elements
 * @param   {type}  ty   array type (constructor function)
 * @returns {array}      new array of specified size and type
 */
ArrUtil.create = function(size, ty) {
   return new ty(size);
}

/**
 * Return a copy of the given array.
 * The returned array has the same underlying array type as the source array.
 *
 * @param   {array} arr source array
 * @returns {array}     copy of source array
 */
ArrUtil.clone = function(arr) {
   if (arr instanceof Array) {
      return arr.slice(0);
   } else {
      var ty = ArrUtil.getClass(arr);
      return new ty(arr);
   }
}

/**
 * Copy and type-convert the given array.
 *
 * @param   {array} arr source array
 * @param   {type}  ty  type of result array (constructor function)
 * @returns {array}     copy of source array into array of specified type
 */
ArrUtil.cloneAs = function(arr, ty) {
   /* check if fast clone can be used */
   if (arr instanceof ty) {
      /* clone as the same type */
      return ArrUtil.clone(arr);
   } else {
      /* copy and type-convert elements */
      var a = new ty(arr.length);
      for (var n = 0; n < arr.length; ++n)
         a[n] = arr[n];
      return a;
   }
}

/**
 * Return a slice of the given array.
 * The returned array has the same underlying array type as the source array.
 *
 * @param   {array} arr   source array
 * @param   {int}   start index at which slice begins
 * @param   {int}   limit index after slice end (default: array length)
 * @returns {array}       array slice
 */
ArrUtil.slice = function(arr, start, limit) {
   /* default arguments */
   limit = (typeof(limit) != "undefined") ? limit : arr.length;
   /* check array type */
   if (arr instanceof Array) {
      /* use slice method of builtin Array class */
      return arr.slice(start, limit);
   } else {
      /* use subarray method of typed arrays (creates view, does not copy) */
      var a = arr.subarray(start, limit);
      /* clone the subarray */
      return ArrUtil.clone(a);
   }
}

/**
 * Reverse the order of elements in the array.
 *
 * @param {array} arr array to reverse
 */
ArrUtil.reverse = function(arr) {
   /* grab start and end of array */
   var i = 0;
   var j = arr.length - 1;
   /* swap corresponding elements */
   while (i < j) {
      /* swap elements */
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
      /* move inward */
      ++i;
      --j;
   }
}

/*****************************************************************************
 * Sorting.
 *****************************************************************************/

/**
 * Sort the array in ascending order using the specified comparison function.
 * Sorting is done in place and the sorted original array is returned.
 *
 * @param   {array}    arr     array to sort
 * @param   {function} compare comparison function
 * @returns {array}            sorted original array
 */
ArrUtil.sort = function(arr, compare) {
   /* use generic quicksort */
   return ArrUtil.quicksort(arr, compare);
}

/**
 * Quicksort specified range of array.
 *
 * Sort the given (left, right) subrange in ascending order using the 
 * O(n*log(n)) expected time quicksort algorithm.
 *
 * @param {array}    arr     array to sort
 * @param {int}      left    subrange start index
 * @param {int}      right   subrange end index
 * @param {function} compare comparison function
 */
ArrUtil.qsort = function(arr, left, right, compare) {
   if (left < right) {
      /* select pivot */
      var pivot = arr[Math.floor(left + (right-left)/2)];
      /* partition array */
      var i = left;
      var j = right;
      while (i <= j) {
         while (compare(arr[i], pivot) < 0) { ++i; }
         while (compare(arr[j], pivot) > 0) { --j; }
         if (i <= j) {
            /* swap elements */
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
            /* move inward */
            ++i;
            --j;
         }
      }
      /* recursively sort each half */
      ArrUtil.qsort(arr, left, j, compare);
      ArrUtil.qsort(arr, i, right, compare);
   }
}

/**
 * Quicksort.
 *
 * Sort the array in ascending order using the O(n*log(n)) expected time 
 * quicksort algorithm.  Sorting is done in place.
 *
 * @param   {array}    arr     array to sort
 * @param   {function} compare comparison function
 * @returns {array}            sorted original array
 */
ArrUtil.quicksort = function(arr, compare) {
   ArrUtil.qsort(arr, 0, arr.length - 1, compare);
   return arr;
}

/*****************************************************************************
 * Compression.
 *****************************************************************************/

/**
 * Compress array using run-length encoding (RLE).
 * Optionally specify the storage type for compressed array elements.
 *
 * @param   {array}  arr array to compress
 * @param   {type}   ty  compressed array type (constructor, optional)
 * @returns {object} rle compressed representation
 */
ArrUtil.rleCompress = function(arr, ty) {
   /* default to preserving array type */
   ty = (typeof(ty) != "undefined") ? ty : ArrUtil.getClass(arr);
   /* count number of unique element runs in array */
   var count = (arr.length > 0) ? 1 : 0;
   for (var n = 1; n < arr.length; ++n)
      count += ((arr[n-1] != arr[n]) ? 1 : 0);
   /* initialize compressed data structure */
   var rle = {
      size   : arr.length,             /* original array length */
      vals   : new ty(count),          /* element values */
      counts : new Uint32Array(count)  /* repeat counts */
   };
   /* populate compressed data structure */
   if (arr.length > 0) {
      rle.vals[0]   = arr[0];
      rle.counts[0] = 1;
   }
   for (var n = 1, pos = 0; n < arr.length; ++n) {
      if (arr[n-1] != arr[n]) {
         rle.vals[++pos] = arr[n];
         rle.counts[pos] = 1;
      } else {
         ++(rle.counts[pos]);
      }
   }
   return rle;
}

/**
 * Decompress run-length encoded (RLE) array.
 * Optionally specify the type of the decompressed array.
 *
 * @param   {object} rle compressed representation
 * @param   {type}   ty  decompressed array type (constructor, optional)
 * @returns {array}  arr decompressed array
 */
ArrUtil.rleDecompress = function(rle, ty) {
   /* default to preserving array type */
   ty = (typeof(ty) != "undefined") ? ty : ArrUtil.getClass(rle.vals);
   /* allocate array */
   var arr = new ty(rle.size);
   /* decompress */
   for (var n = 0, pos = 0; pos < rle.vals.length; ++pos) {
      for (var c = 0; c < rle.counts[pos]; ++c) {
         arr[n++] = rle.vals[pos];
      }
   }
   return arr;
}

/**
 * Compress array using ramp sequence encoding.
 * Optionally specify the storage type for compressed array elements.
 *
 * This encoding is useful for compressing lists containing runs of
 * consecutive elements.  For example, (1,2,3,4,5,8,9,10,11) -> (1,5),(8,11).
 *
 * @param   {array}   arr  array to compress
 * @param   {numeric} step increment between sequence elements (default: 1)
 * @param   {type}    ty   compressed array type (constructor, optional)
 * @returns {object}  seq  compressed representation
 */
ArrUtil.seqCompress = function(arr, step, ty) {
   /* defaults: step 1, preserve array type */
   step = (typeof(step) != "undefined") ? step : 1;
   ty = (typeof(ty) != "undefined") ? ty : ArrUtil.getClass(arr);
   /* count number of ramp sequences in array */
   var count = (arr.length > 0) ? 1 : 0;
   for (var n = 1; n < arr.length; ++n)
      count += (((arr[n-1] + step) != arr[n]) ? 1 : 0);
   /* initialize compressed data structure */
   var seq = {
      size       : arr.length,         /* original array length */
      step       : step,               /* sequence increment */
      vals_start : new ty(count),      /* sequence start values */
      vals_end   : new ty(count)       /* sequence end values */
   };
   /* populate compressed data structure */
   if (arr.length > 0) {
      seq.vals_start[0]     = arr[0];
      seq.vals_end[count-1] = arr[arr.length-1];
   }
   for (var n = 1, pos = 0; n < arr.length; ++n) {
      if ((arr[n-1] + step) != arr[n]) {
         seq.vals_end[pos++] = arr[n-1];
         seq.vals_start[pos] = arr[n];
      }
   }
   return seq;
}

/**
 * Decompress ramp sequence encoded array.
 * Optionally specify the type of the decompressed array.
 *
 * @param   {object} seq compressed representation
 * @param   {type}   ty  decompressed array type (constructor, optional)
 * @returns {array}  arr decompressed array
 */
ArrUtil.seqDecompress = function(seq, ty) {
   /* default to preserving array type */
   ty = (typeof(ty) != "undefined") ? ty : ArrUtil.getClass(seq.vals_start);
   /* allocate array */
   var arr = new ty(seq.size);
   /* decompress */
   for (var n = 0, pos = 0; pos < seq.vals_start.length; ++pos) {
      var v = seq.vals_start[pos];
      do {
         arr[n++] = v;
         v += seq.step;
      } while (v != seq.vals_end[pos]);
   }
   return arr;
}

/*****************************************************************************
 * Serialization and deserialization.
 *
 * Arrays can be written to and read from datastreams.  The corresponding
 * serialization functions process each element of the array in order.
 *
 * When working with the generic Array type, the user must provide a function
 * for writing or reading individual array elements.
 *
 * For serialization, this function must have the form:
 *    f(ds, x) { ... }
 * and for deserialization, this function must have the form:
 *    f(ds) { ... return x; }
 * where:
 *    {DataStream} ds is the output/input datastream
 *    {object}     x  is the array element
 *
 * For typed arrays, this function is optional and defaults to that for
 * writing or reading the appropriate built-in type.
 *****************************************************************************/

/**
 * Serialize an array to a datastream.
 *
 * @param {DataStream} ds  datastream
 * @param {array}      arr array
 * @param {function}   f   element serialization function (optional)
 */
ArrUtil.serialize = function(ds, arr, f) {
   /* check whether using custom element serialization */
   if (typeof(f) != "undefined") {
      /* write custom array type id */
      ds.writeUint32(0);
      /* write array length */
      ds.writeUint32(arr.length);
      /* apply custom element serialization function */
      for (var n = 0; n < arr.length; ++n)
         f(ds, arr[n]);
   } else {
      /* serialize elements of built-in type */
      if (arr instanceof Int8Array) {
         ds.writeUint32(1); /* Int8Array type id */
         ds.writeUint32(arr.length);
         ds.writeInt8Array(arr);
      } else if (arr instanceof Uint8Array) {
         ds.writeUint32(2); /* Uint8Array type id */
         ds.writeUint32(arr.length);
         ds.writeUint8Array(arr);
      } else if (arr instanceof Int16Array) {
         ds.writeUint32(3); /* Int16Array type id */
         ds.writeUint32(arr.length);
         ds.writeInt16Array(arr);
      } else if (arr instanceof Uint16Array) {
         ds.writeUint32(4); /* Uint16Array type id */
         ds.writeUint32(arr.length);
         ds.writeUint16Array(arr);
      } else if (arr instanceof Int32Array) {
         ds.writeUint32(5); /* Int32Array type id */
         ds.writeUint32(arr.length);
         ds.writeInt32Array(arr);
      } else if (arr instanceof Uint32Array) {
         ds.writeUint32(6); /* Uint32Array type id */
         ds.writeUint32(arr.length);
         ds.writeUint32Array(arr);
      } else if (arr instanceof Float32Array) {
         ds.writeUint32(7); /* Float32Array type id */
         ds.writeUint32(arr.length);
         ds.writeFloat32Array(arr);
      } else if (arr instanceof Float64Array) {
         ds.writeUint32(8); /* Float64Array type id */
         ds.writeUint32(arr.length);
         ds.writeFloat64Array(arr);
      } else {
         throw "missing argument: element serialization function";
      }
   }
}

/**
 * Deserialize an array from a datastream.
 *
 * @param   {DataStream} ds  datastream
 * @param   {function}   f   element serialization function (optional)
 * @returns {array}      arr array
 */
ArrUtil.deserialize = function(ds, f) {
   /* check whether using custom element deserialization */
   if (typeof(f) != "undefined") {
      /* read array type and length */
      var ty_id = ds.readUint32();
      var len   = ds.readUint32();
      /* allocate array */
      var arr = new Array(len);
      /* apply custom element deserialization function */
      for (var n = 0; n < len; ++n)
         arr[n] = f(ds);
      return arr;
   } else {
      /* read array type and length */
      var ty_id = ds.readUint32();
      var len   = ds.readUint32();
      /* deserialize elements of built-in type */
      var arr = null;
      switch (ty_id) {
         case 1: arr = ds.readInt8Array(len);    break;
         case 2: arr = ds.readUInt8Array(len);   break;
         case 3: arr = ds.readInt16Array(len);   break;
         case 4: arr = ds.readUint16Array(len);  break;
         case 5: arr = ds.readInt32Array(len);   break;
         case 6: arr = ds.readUint32Array(len);  break;
         case 7: arr = ds.readFloat32Array(len); break;
         case 8: arr = ds.readFloat64Array(len); break;
         default:
            throw "missing argument: element deserialization function";
            break;
      }
      return arr;
   }
}

/**
 * Serialize a run-length encoded array.
 *
 * @param {DataStream} ds  datastream
 * @param {object}     rle compressed array
 * @param {function}   f   element serialization function (optional)
 */
ArrUtil.rleSerialize = function(ds, rle, f) {
   ds.writeUint32(rle.size);
   ArrUtil.serialize(ds, rle.vals, f);
   ArrUtil.serialize(ds, rle.counts);
}

/**
 * Deserialize a run-length encoded array.
 *
 * @param   {DataStream} ds  datastream
 * @param   {function}   f   element serialization function (optional)
 * @returns {object}     rle compressed array
 */
ArrUtil.rleDeserialize = function(ds, f) {
   /* deserialize rle data structure */
   var size   = ds.readUint32();
   var vals   = ArrUtil.deserialize(ds, f);
   var counts = ArrUtil.deserialize(ds);
   /* assemble compressed representation */
   var rle = {
      size : size, vals : vals, counts : counts
   };
   return rle;
}

/**
 * Serialize a ramp sequence encoded array.
 *
 * @param {DataStream} ds  datastream
 * @param {object}     seq compressed array
 * @param {function}   f   element serialization function (optional)
 */
ArrUtil.seqSerialize = function(ds, seq, f) {
   ds.writeUint32(seq.size);
   ds.writeFloat64(seq.step);
   ArrUtil.serialize(ds, seq.vals_start, f);
   ArrUtil.serialize(ds, seq.vals_end, f);
}

/**
 * Deserialize a ramp sequence encoded array.
 *
 * @param   {DataStream} ds  datastream
 * @param   {function}   f   element serialization function (optional)
 * @returns {object}     seq compressed array
 */
ArrUtil.seqDeserialize = function(ds, f) {
   /* deserialize seq data structure */
   var size       = ds.readUint32();
   var step       = ds.readFloat64();
   var vals_start = ArrUtil.deserialize(ds, f);
   var vals_end   = ArrUtil.deserialize(ds, f);
   /* assemble compressed representation */
   var seq = {
      size : size, step : step, vals_start : vals_start, vals_end : vals_end
   };
   return seq;
}
