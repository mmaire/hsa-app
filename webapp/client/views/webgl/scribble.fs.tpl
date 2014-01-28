<script id="scribble-fragment-shader" type="x-shader/x-fragment">
   /**************************************************************************
    * Copyright (C) 2014 Michael Maire <mmaire@gmail.com>
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
   /* pixel status channel layout */
   #define PX_CH_NEG 0
   #define PX_CH_POS 1
   #define PX_CH_INEG 2
   #define PX_CH_IPOS 3
   /* constraint mask status channel layout */
   #define MASK_CH_HNEG 0
   #define MASK_CH_HPOS 1
   #define MASK_CH_SNEG 2
   #define MASK_CH_SPOS 3
   /* status value thresholds */
   #define VAL_WEAK_TH 0.125
   #define VAL_STRONG_TH 0.375
   #define VAL_TRUE_TH 0.750
   /* uniform variables - textures */
   uniform sampler2D u_img_samp;       /* image texture sampler */
   uniform sampler2D u_px_samp;        /* pixel status texture sampler */
   uniform sampler2D u_mask_samp;      /* constraint mask texture sampler */
   /* uniform variables - colors */
   uniform vec4 u_color_neg;           /* negative user marks */
   uniform vec4 u_color_pos;           /* positive user marks */
   uniform vec4 u_color_hneg;          /* hard negative (forbidden) pixels */
   uniform vec4 u_color_hpos;          /* hard positive (required) pixels */
   uniform vec4 u_color_bg;            /* background pixels */
   uniform vec4 u_color_fg;            /* foreground (selected) pixels */
   /* uniform variables - transparency */
   uniform float u_transparency;       /* overlay transparency */
   /* varying variables */
   varying vec2 v_img_coord;           /* coordinate within image */
   /* fragment shader */
   void main() {
      /* sample pixel status and mask values */
      vec4 px   = texture2D(u_px_samp, v_img_coord);
      vec4 mask = texture2D(u_mask_samp, v_img_coord);
      /* check direct user markings */
      bool is_neg = (px[PX_CH_NEG] > VAL_WEAK_TH);
      bool is_pos = (px[PX_CH_POS] > VAL_WEAK_TH);
      vec4 c = float(is_neg)*u_color_neg + float(is_pos)*u_color_pos;
      bool done = is_neg || is_pos;
      /* check hard constraints */
      is_neg = (mask[MASK_CH_HNEG] > VAL_TRUE_TH);
      is_pos = (mask[MASK_CH_HPOS] > VAL_TRUE_TH);
      c += float(!done)*(float(is_neg)*u_color_hneg+float(is_pos)*u_color_hpos);
      done = done || is_neg || is_pos;
      /* check inference (strong) */
      is_neg = (px[PX_CH_INEG] > VAL_STRONG_TH);
      is_pos = (px[PX_CH_IPOS] > VAL_STRONG_TH);
      c += float(!done)*(float(is_neg)*u_color_bg + float(is_pos)*u_color_fg);
      done = done || is_neg || is_pos;
      /* check soft constraints */
      is_neg = (mask[MASK_CH_SNEG] > VAL_TRUE_TH);
      is_pos = (mask[MASK_CH_SPOS] > VAL_TRUE_TH);
      c += float(!done)*(float(is_neg)*u_color_bg + float(is_pos)*u_color_fg);
      done = done || is_neg || is_pos;
      /* check inference (weak) */
      is_pos = (px[PX_CH_IPOS] > VAL_WEAK_TH);
      is_neg = !is_pos;
      c += float(!done)*(float(is_neg)*u_color_bg + float(is_pos)*u_color_fg);
      /* mix scribble color with image according to scribble alpha channel */
      vec4 im = texture2D(u_img_samp, v_img_coord);
      vec3 c_mix = (c.a) * c.rgb + (1.0 - c.a) * im.rgb;
      /* assemble fragment color */
      gl_FragColor = vec4(c_mix, u_transparency);
   }
</script>
