<script id="img-fragment-shader" type="x-shader/x-fragment">
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
   /* uniform variables - colors */
   uniform vec4 u_color;               /* image color */
   uniform float u_transparency;       /* image transparency */
   /* varying variables */
   varying vec2 v_img_coord;           /* coordinate within image */
   /* fragment shader */
   void main() {
      /* sample image pixel value */
      vec4 px_i = texture2D(u_img_samp, v_img_coord);
      /* mix color with image according to color alpha */
      vec3 c = (u_color.a) * u_color.rgb + (1.0 - u_color.a) * px_i.rgb;
      /* modulate transparency */
      float alpha = u_transparency * px_i.a;
      /* assemble fragment color */
      gl_FragColor = vec4(c.rgb, alpha);
   }
</script>
