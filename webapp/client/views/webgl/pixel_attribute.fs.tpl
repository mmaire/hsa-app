<script id="pixel-attribute-fragment-shader" type="x-shader/x-fragment">
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
   /* uniform variables - image and mask textures */
   uniform sampler2D u_img_samp;       /* image texture sampler */
   uniform sampler2D u_mask_samp;      /* mask texture sampler */
   /* uniform variables - attribute textures */
   uniform sampler2D u_attrib0_samp;   /* attribute texture 0 (bytes 0-3) */
   uniform sampler2D u_attrib1_samp;   /* attribute texture 1 (bytes 4-7) */
   uniform sampler2D u_attrib2_samp;   /* attribute texture 2 (bytes 8-11) */
   uniform sampler2D u_attrib3_samp;   /* attribute texture 3 (bytes 12-15) */
   /* uniform variables - attribute lookup maps */
   uniform sampler2D u_color_samp;     /* attribute colormap */
   uniform sampler2D u_bitmask_samp;   /* (view, attrib) -> display bitmask */
   /* uniform variables - attribute view bitmask vector */
   uniform vec4 u_bitmask0;            /* view bitmask for texture 0 */
   uniform vec4 u_bitmask1;            /* view bitmask for texture 1 */
   uniform vec4 u_bitmask2;            /* view bitmask for texture 2 */
   uniform vec4 u_bitmask3;            /* view bitmask for texture 3 */
   /* uniform variables - transparency */
   uniform float u_transparency;       /* overlay transparency */
   /* varying variables */
   varying vec2 v_img_coord;           /* coordinate within image */
   varying vec2 v_mask_coord;          /* coordinate within mask */
   /* fragment shader */
   void main() {
      /* initialize pixel color vector */
      vec4 c = vec4(0.0, 0.0, 0.0, 0.0);
      /* combine attribute texture 0 into the pixel color */
      vec4 attrib = texture2D(u_attrib0_samp, v_mask_coord);
      float b0 = texture2D(u_bitmask_samp, vec2(u_bitmask0.x, attrib.x)).x;
      float b1 = texture2D(u_bitmask_samp, vec2(u_bitmask0.y, attrib.y)).x;
      float b2 = texture2D(u_bitmask_samp, vec2(u_bitmask0.z, attrib.z)).x;
      float b3 = texture2D(u_bitmask_samp, vec2(u_bitmask0.w, attrib.w)).x;
      vec4 c0 = texture2D(u_color_samp, vec2(0.03125, b0));
      vec4 c1 = texture2D(u_color_samp, vec2(0.09375, b1));
      vec4 c2 = texture2D(u_color_samp, vec2(0.15625, b2));
      vec4 c3 = texture2D(u_color_samp, vec2(0.21875, b3));
      c += vec4(c0.rgb * c0.a, c0.a);
      c += vec4(c1.rgb * c1.a, c1.a);
      c += vec4(c2.rgb * c2.a, c2.a);
      c += vec4(c3.rgb * c3.a, c3.a);
      /* combine attribute texture 1 into the pixel color */
      attrib = texture2D(u_attrib1_samp, v_mask_coord);
      b0 = texture2D(u_bitmask_samp, vec2(u_bitmask1.x, attrib.x)).x;
      b1 = texture2D(u_bitmask_samp, vec2(u_bitmask1.y, attrib.y)).x;
      b2 = texture2D(u_bitmask_samp, vec2(u_bitmask1.z, attrib.z)).x;
      b3 = texture2D(u_bitmask_samp, vec2(u_bitmask1.w, attrib.w)).x;
      c0 = texture2D(u_color_samp, vec2(0.28125, b0));
      c1 = texture2D(u_color_samp, vec2(0.34375, b1));
      c2 = texture2D(u_color_samp, vec2(0.40625, b2));
      c3 = texture2D(u_color_samp, vec2(0.46875, b3));
      c += vec4(c0.rgb * c0.a, c0.a);
      c += vec4(c1.rgb * c1.a, c1.a);
      c += vec4(c2.rgb * c2.a, c2.a);
      c += vec4(c3.rgb * c3.a, c3.a);
      /* combine attribute texture 2 into the pixel color */
      attrib = texture2D(u_attrib2_samp, v_mask_coord);
      b0 = texture2D(u_bitmask_samp, vec2(u_bitmask2.x, attrib.x)).x;
      b1 = texture2D(u_bitmask_samp, vec2(u_bitmask2.y, attrib.y)).x;
      b2 = texture2D(u_bitmask_samp, vec2(u_bitmask2.z, attrib.z)).x;
      b3 = texture2D(u_bitmask_samp, vec2(u_bitmask2.w, attrib.w)).x;
      c0 = texture2D(u_color_samp, vec2(0.53125, b0));
      c1 = texture2D(u_color_samp, vec2(0.59375, b1));
      c2 = texture2D(u_color_samp, vec2(0.65625, b2));
      c3 = texture2D(u_color_samp, vec2(0.71875, b3));
      c += vec4(c0.rgb * c0.a, c0.a);
      c += vec4(c1.rgb * c1.a, c1.a);
      c += vec4(c2.rgb * c2.a, c2.a);
      c += vec4(c3.rgb * c3.a, c3.a);
      /* combine attribute texture 3 into the pixel color */
      attrib = texture2D(u_attrib3_samp, v_mask_coord);
      b0 = texture2D(u_bitmask_samp, vec2(u_bitmask3.x, attrib.x)).x;
      b1 = texture2D(u_bitmask_samp, vec2(u_bitmask3.y, attrib.y)).x;
      b2 = texture2D(u_bitmask_samp, vec2(u_bitmask3.z, attrib.z)).x;
      b3 = texture2D(u_bitmask_samp, vec2(u_bitmask3.w, attrib.w)).x;
      c0 = texture2D(u_color_samp, vec2(0.78125, b0));
      c1 = texture2D(u_color_samp, vec2(0.84375, b1));
      c2 = texture2D(u_color_samp, vec2(0.90625, b2));
      c3 = texture2D(u_color_samp, vec2(0.96875, b3));
      c += vec4(c0.rgb * c0.a, c0.a);
      c += vec4(c1.rgb * c1.a, c1.a);
      c += vec4(c2.rgb * c2.a, c2.a);
      c += vec4(c3.rgb * c3.a, c3.a);
      /* normalize color by total weight */
      if (c.a > 0.0) {
         c.r /= c.a;
         c.g /= c.a;
         c.b /= c.a;
      }
      /* sample image and mask pixel values */
      vec4 px_i = texture2D(u_img_samp, v_img_coord);
      vec4 px_m = texture2D(u_mask_samp, v_mask_coord);
      /* mix attribute color with image according to transparency */
      c.rgb = u_transparency * c.rgb + (1.0 - u_transparency) * px_i.rgb;
      /* assemble fragment color, with alpha channel modulated by mask */
      gl_FragColor =
         (c.a > 0.0) ? vec4(c.rgb, px_m.a) : vec4(px_i.rgb, px_m.a);
   }
</script>
