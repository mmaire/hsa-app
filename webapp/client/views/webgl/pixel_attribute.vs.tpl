<script id="pixel-attribute-vertex-shader" type="x-shader/x-vertex">
   /**************************************************************************
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
    **************************************************************************/
   /* uniform variables - camera */
   uniform mat4 u_mv_mx;               /* model-view matrix */
   uniform mat4 u_p_mx;                /* perspective matrix */
   /* uniform variables - depth layer */
   uniform float u_depth;              /* depth layer in scene */
   /* vertex attributes */
   attribute vec2 a_vrtx_pos;          /* vertex position */
   attribute vec2 a_img_coord;         /* vertex coordinate within image */
   attribute vec2 a_mask_coord;        /* vertex coordinate within mask */
   /* varying variables */
   varying vec2 v_img_coord;           /* coordinate within image */
   varying vec2 v_mask_coord;          /* coordinate within mask */
   /* vertex shader */
   void main() {
      gl_Position  = u_p_mx * u_mv_mx * vec4(a_vrtx_pos, u_depth, 1.0);
      v_img_coord  = a_img_coord;
      v_mask_coord = a_mask_coord;
   }
</script>
