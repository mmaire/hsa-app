<script id="polygon-fragment-shader" type="x-shader/x-fragment">
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
   /* uniform variables */
   uniform vec4 u_color;               /* color */
   /* fragment shader */
   void main() {
      gl_FragColor = u_color;
   }
</script>
<script id="polygon-colormap-fragment-shader" type="x-shader/x-fragment">
   /* set floating point precision */
   #ifdef GL_ES
   precision highp float;
   #endif
   /* uniform variables */
   uniform sampler2D u_color_samp;     /* colormap (label -> color) */
   uniform float u_cmap_size;          /* # elements in colormap */
   /* varying variables */
   varying float v_label;              /* pixel label */
   /* fragment shader */
   void main() {
      float cmap_index = (v_label + 0.5) / u_cmap_size;
      gl_FragColor = texture2D(u_color_samp, vec2(0.5, cmap_index));
   }
</script>
