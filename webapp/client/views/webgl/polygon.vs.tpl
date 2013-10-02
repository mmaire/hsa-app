<script id="polygon-vertex-shader" type="x-shader/x-vertex">
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
   /* uniform variables - appearance */
   uniform float u_point_size;         /* size of rendered polygon vertices */
   /* vertex attributes */
   attribute float a_vrtx_x;           /* vertex x-coordinate */
   attribute float a_vrtx_y;           /* vertex y-coordinate */
   /* vertex shader */
   void main() {
      gl_Position = u_p_mx * u_mv_mx * vec4(a_vrtx_x, a_vrtx_y, u_depth, 1.0);
      gl_PointSize = u_point_size;
   }
</script>
<script id="polygon-colormap-vertex-shader" type="x-shader/x-vertex">
   /* uniform variables - camera */
   uniform mat4 u_mv_mx;               /* model-view matrix */
   uniform mat4 u_p_mx;                /* perspective matrix */
   /* uniform variables - depth layer */
   uniform float u_depth;              /* depth layer in scene */
   /* uniform variables - appearance */
   uniform float u_point_size;         /* size of rendered polygon vertices */
   /* vertex attributes */
   attribute float a_vrtx_x;           /* vertex x-coordinate */
   attribute float a_vrtx_y;           /* vertex y-coordinate */
   attribute float a_label;            /* vertex label */
   /* varying variables */
   varying float v_label;              /* label */
   /* vertex shader */
   void main() {
      gl_Position = u_p_mx * u_mv_mx * vec4(a_vrtx_x, a_vrtx_y, u_depth, 1.0);
      gl_PointSize = u_point_size;
      v_label = a_label;
   }
</script>
