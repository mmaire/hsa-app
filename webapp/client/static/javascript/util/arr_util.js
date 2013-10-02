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

/**
 * Create an array of the specified size and with the same type as the 
 * given array.
 *
 * @param   {int}   size number of elements
 * @param   {array} arr  array to take the type of
 * @returns {array}      new array of specified size and type
 */
ArrUtil.create = function(size, arr) {
   if (arr instanceof Array)             { return new Array(size); }
   else if (arr instanceof Int8Array)    { return new Int8Array(size); }
   else if (arr instanceof Uint8Array)   { return new Uint8Array(size); }
   else if (arr instanceof Int16Array)   { return new Int16Array(size); }
   else if (arr instanceof Uint16Array)  { return new Uint16Array(size); }
   else if (arr instanceof Int32Array)   { return new Int32Array(size); }
   else if (arr instanceof Uint32Array)  { return new Uint32Array(size); }
   else if (arr instanceof Float32Array) { return new Float32Array(size); }
   else if (arr instanceof Float64Array) { return new Float64Array(size); }
   else { throw "invalid array type"; }
}

/**
 * Return a copy of the given array.
 * The returned array has the same underlying array type as the source array.
 *
 * @param   {array} arr source array
 * @returns {array}     copy of source array
 */
ArrUtil.clone = function(arr) {
   if (arr instanceof Array)             { return arr.slice(0); }
   else if (arr instanceof Int8Array)    { return new Int8Array(arr); }
   else if (arr instanceof Uint8Array)   { return new Uint8Array(arr); }
   else if (arr instanceof Int16Array)   { return new Int16Array(arr); }
   else if (arr instanceof Uint16Array)  { return new Uint16Array(arr); }
   else if (arr instanceof Int32Array)   { return new Int32Array(arr); }
   else if (arr instanceof Uint32Array)  { return new Uint32Array(arr); }
   else if (arr instanceof Float32Array) { return new Float32Array(arr); }
   else if (arr instanceof Float64Array) { return new Float64Array(arr); }
   else { throw "invalid array type"; }
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
