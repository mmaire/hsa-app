<script id="slate-fragment-shader" type="x-shader/x-fragment">
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
   /* set floating point precision */
   #ifdef GL_ES
   precision highp float;
   #endif
   /* uniform variables - textures */
   uniform sampler2D u_img_samp;       /* image texture sampler */
   uniform sampler2D u_mask_samp;      /* mask texture sampler */
   /* uniform variables - colors */
   uniform vec4 u_color_select;        /* color of selected pixels */
   uniform vec4 u_color_require;       /* color of required pixels */
   uniform vec4 u_color_forbid;        /* color of forbidden pixels */
   uniform vec4 u_color_normal;        /* color of normal pixels */
   /* uniform variables - transparency */
   uniform float u_transparency;       /* layer transparency */
   /* varying variables */
   varying vec2 v_img_coord;           /* coordinate within image */
   /* fragment shader */
   void main() {
      /* sample image and mask pixel values */
      vec4 px_i = texture2D(u_img_samp, v_img_coord);
      vec4 px_m = texture2D(u_mask_samp, v_img_coord);
      /* compute selection flags from selection state */
      float is_select  = px_m[0] * (1.0 - px_m[2]); /* selected, not required */
      float is_require = px_m[2];                   /* required */
      float is_forbid  = (1.0 - px_m[1]);           /* not allowed */
      /* check if normal pixel (not selected, allowed, not required) */
      float is_normal  = (1.0 - px_m[0]) * px_m[1] * (1.0 - px_m[2]);
      /* compute color for selection state */
      vec4 c_state =
         (is_select * u_color_select) + (is_require * u_color_require) +
         (is_forbid * u_color_forbid) + (is_normal * u_color_normal);
      /* mix color with image according to color alpha */
      vec3 c = (c_state.a) * c_state.rgb + (1.0 - c_state.a) * px_i.rgb;
      /* assemble fragment color */
      gl_FragColor = vec4(c, u_transparency);
   }
</script>
