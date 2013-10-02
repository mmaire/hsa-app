<script id="brush-fragment-shader" type="x-shader/x-fragment">
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
   uniform sampler2D u_px_mask_samp;   /* pixel mask texture sampler */
   uniform sampler2D u_ty_mask_samp;   /* type mask texture sampler */
   /* uniform variables - image */
   uniform vec2 u_img_size;            /* image size */
   /* uniform variables - brush */
   uniform vec2 u_center;              /* brush center */
   uniform vec2 u_radii;               /* brush radii (selection and frame) */
   uniform float u_ignore_ty;          /* ignore brush type restriction? */
   /* uniform variables - colors */
   uniform vec4 u_color_fg;            /* selection foreground color */
   uniform vec4 u_color_bg;            /* selection background color */
   uniform vec4 u_color_frame;         /* frame color */
   /* varying variables */
   varying vec2 v_mask_coord;          /* coordinate within masks */
   /* constants */
   const float radius_tol = 0.001;     /* tolerance for radius comparison */
   /* fragment shader */
   void main() {
      /* scale mask coordinates to image coordinates */
      vec2 img_coord = v_mask_coord * u_img_size;
      /* compute distance from brush center */
      vec2 img_center = u_center + 0.5;
      float dist = distance(img_coord, img_center);
      /* check distance from brush center */
      bool in_selection = (dist < (u_radii[0] - radius_tol));
      bool in_frame     = (dist < (u_radii[1] - radius_tol));
      /* sample pixel and type mask values */
      vec4 px_val = texture2D(u_px_mask_samp, v_mask_coord);
      vec4 ty_val = texture2D(u_ty_mask_samp, v_mask_coord);
      /* get type mask value at brush center coordinate */
      vec2 mask_center = img_center / u_img_size;
      vec4 ty_val_center = texture2D(u_ty_mask_samp, mask_center);
      /* check mask value differences */
      bool in_region = any(notEqual(px_val, vec4(0.0, 0.0, 0.0, 0.0)));
      bool ty_match  = all(equal(ty_val, ty_val_center)) || (u_ignore_ty > 0.0);
      bool reg_match = in_region && ty_match;
      /* determine pixel state */
      float is_fg    = (in_selection &&  reg_match) ? 1.0 : 0.0;
      float is_bg    = (in_selection && !reg_match) ? 1.0 : 0.0;
      float is_frame = (in_frame && !in_selection) ? 1.0 : 0.0;
      /* compute pixel color */
      gl_FragColor =
         is_fg * u_color_fg + is_bg * u_color_bg + is_frame * u_color_frame;
   }
</script>
