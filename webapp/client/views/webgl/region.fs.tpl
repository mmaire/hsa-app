<script id="region-fragment-shader" type="x-shader/x-fragment">
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
   uniform vec4 u_color;               /* region color */
   uniform float u_transparency;       /* region transparency */
   /* varying variables */
   varying vec2 v_img_coord;           /* coordinate within image */
   varying vec2 v_mask_coord;          /* coordinate within mask */
   /* fragment shader */
   void main() {
      /* sample image and mask pixel values */
      vec4 px_i = texture2D(u_img_samp, v_img_coord);
      vec4 px_m = texture2D(u_mask_samp, v_mask_coord);
      /* mix region color with image according to region color alpha */
      vec3 c = (u_color.a) * u_color.rgb + (1.0 - u_color.a) * px_i.rgb;
      /* modulate transparency by mask visibility */
      float alpha = u_transparency * px_m.a;
      /* assemble fragment color */
      gl_FragColor = vec4(c.rgb, alpha);
   }
</script>
