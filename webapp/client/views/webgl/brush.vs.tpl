<script id="brush-vertex-shader" type="x-shader/x-vertex">
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
   /* uniform variables - image */
   uniform vec2 u_img_size;            /* image size */
   /* uniform variables - brush */
   uniform vec2 u_center;              /* brush center */
   uniform vec2 u_radii;               /* brush radii (selection and frame) */
   uniform float u_depth;              /* brush depth in scene */
   /* vertex attributes */
   attribute vec2 a_vrtx_offset;       /* vertex offset */
   /* varying variables */
   varying vec2 v_mask_coord;          /* coordinate within masks */
   /* vertex shader */
   void main() {
      /* compute image coordinates of bounding corner */
      vec2 img_coord = (a_vrtx_offset * u_radii[1]) + (u_center + 0.5);
      img_coord = max(img_coord, 0.0);
      img_coord = min(img_coord, u_img_size);
      /* translate image coordinates into mask coordinates  */
      v_mask_coord = img_coord / u_img_size;
      /* compute vertex position */
      gl_Position = u_p_mx * u_mv_mx * vec4(img_coord, u_depth, 1.0);
   }
</script>
