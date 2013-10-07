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
 * @class Utility functions on numeric sets.
 */
function SetUtil() { }

/*****************************************************************************
 * Set operations.
 *****************************************************************************/

/**
 * Return unique elements of set.
 *
 * @param   {array} s numeric set
 * @returns {array}   unique elements
 */
SetUtil.unique = function(s) {
   /* copy array */
   var su = ArrUtil.clone(s);
   /* check if nonempty */
   if (su.length > 0) {
      /* sort array */
      ArrUtil.sort(su, function(a,b){return a-b;});
      /* remove duplicates */
      var pos = 1;
      for (var n = 1; n < su.length; ++n) {
         if (su[n] != su[n-1])
            su[pos++] = su[n];
      }
      /* slice to correct length */
      su = ArrUtil.slice(su, 0, pos);
   }
   return su;
}

/**
 * Return union of two numeric sets.
 *
 * @param   {array} p first set
 * @param   {array} q second set
 * @returns {array}   set union
 */
SetUtil.union = function(p, q) {
   var len = p.length + q.length;
   var s = ArrUtil.create(len, ArrUtil.getClass(p));
   for (var n = 0; n < p.length; ++n)
      s[n] = p[n];
   for (var n = 0; n < q.length; ++n)
      s[p.length + n] = q[n];
   return SetUtil.unique(s);
}

/**
 * Return elements common to both numeric sets.
 *
 * @param   {array} p first set
 * @param   {array} q second set
 * @returns {array}   set intersection 
 */
SetUtil.intersect = function(p, q) {
   /* get sorted unique elements */
   var pu = SetUtil.unique(p);
   var qu = SetUtil.unique(q);
   /* allocate array for intersection */
   var len = Math.min(pu.length, qu.length);
   var s = ArrUtil.create(len, ArrUtil.getClass(p));
   /* compute intersection */
   var i = 0;
   var j = 0;
   var k = 0;
   while ((i < pu.length) && (j < qu.length)) {
      /* advance through first set */
      while ((i < pu.length) && (pu[i] < qu[j])) { ++i; }
      if (i == pu.length) { break; }
      /* advance through second set */
      while ((j < qu.length) && (qu[j] < pu[i])) { ++j; }
      if (j == qu.length) { break; }
      /* test potential match */
      if (pu[i] == qu[j]) {
         s[k++] = pu[i];
         ++i;
         ++j;
      }
   }
   /* slice to length of intersection */
   return ArrUtil.slice(s, 0, k);
}

/**
 * Return elements in the first numeric set but not the second.
 *
 * @param   {array} p first set
 * @param   {array} q second set
 * @returns {array}   set difference
 */
SetUtil.setdiff = function(p, q) {
   /* get sorted unique elements */
   var pu = SetUtil.unique(p);
   var qu = SetUtil.unique(q);
   /* allocate array for difference */
   var s = ArrUtil.create(pu.length, ArrUtil.getClass(pu));
   /* compute set difference */
   var i = 0;
   var j = 0;
   var k = 0;
   while ((i < pu.length) && (j < qu.length)) {
      /* advance through first set */
      while ((i < pu.length) && (pu[i] < qu[j])) { s[k++] = pu[i++]; }
      if (i == pu.length) { break; }
      /* advance through second set */
      while ((j < qu.length) && (qu[j] < pu[i])) { ++j; }
      if (j == qu.length) { break; }
      /* test potential match */
      if (pu[i] == qu[j]) {
         ++i;
         ++j;
      }
   }
   while (i < pu.length) { s[k++] = pu[i++]; }
   /* slice to length of difference */
   return ArrUtil.slice(s, 0, k);
}

/*****************************************************************************
 * Element operations.
 *****************************************************************************/

/**
 * Find minimum element in numeric set.
 * If the set is empty, return undefined.
 *
 * @param   {array}   s numeric set
 * @returns {numeric}   minimum element
 */
SetUtil.minElement = function(s) {
   /* check that set is nonempty */
   if (s.length == 0) { return undefined; }
   /* find minimum element */
   var e = s[0];
   for (var n = 1; n < s.length; ++n) {
      if (s[n] < e)
         e = s[n];
   }
   return e;
}

/**
 * Find maximum element in numeric set.
 * If the set is empty, return undefined.
 *
 * @param   {array}   s numeric set
 * @returns {numeric}   maximum element
 */
SetUtil.maxElement = function(s) {
   /* check that set is nonempty */
   if (s.length == 0) { return undefined; }
   /* find maximum element */
   var e = s[0];
   for (var n = 1; n < s.length; ++n) {
      if (s[n] > e)
         e = s[n];
   }
   return e;
}

/**
 * Find index of minimum element in numeric set.
 * If the set is empty, return undefined.
 *
 * @param   {array} s numeric set
 * @returns {int}     index of minimum element
 */
SetUtil.minElementIndex = function(s) {
   /* check that set is nonempty */
   if (s.length == 0) { return undefined; }
   /* find index of minimum element */
   var ind = 0;
   for (var n = 1; n < s.length; ++n) {
      if (s[n] < s[ind])
         ind = n;
   }
   return ind;
}

/**
 * Find index of maximum element in numeric set.
 * If the set is empty, return undefined.
 *
 * @param   {array} s numeric set
 * @returns {int}     index of maximum element
 */
SetUtil.maxElementIndex = function(s) {
   /* check that set is nonempty */
   if (s.length == 0) { return undefined; }
   /* find index of maximum element */
   var ind = 0;
   for (var n = 1; n < s.length; ++n) {
      if (s[n] > s[ind])
         ind = n;
   }
   return ind;
}
