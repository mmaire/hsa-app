/*
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
 */

/**
 * @class Utilities for handling WebGL vertex and fragment shaders.
 */
function Shader() { }

/**
 * Create a shader program for use in the specified context.
 *
 * @param   {RenderContext} ctxt        rendering context
 * @param   {string}        v_shader_id vertex shader document element name
 * @param   {string}        f_shader_id fragment shader document element name
 * @returns {WebGLProgram}              shader program
 */
Shader.create = function(ctxt, v_shader_id, f_shader_id) {
   /* lookup document elements containing shader source code */
   var v_sh_src = document.getElementById(v_shader_id);
   var f_sh_src = document.getElementById(f_shader_id);
   /* compile vertex and fragment shaders within rendering context */
   var v_sh = Shader.compile(ctxt, v_sh_src);
   var f_sh = Shader.compile(ctxt, f_sh_src);
   /* create shader program */
   prog = Shader.link(ctxt, v_sh, f_sh);
   return prog;
}

/**
 * Compile a shader into the specified context given its source.
 *
 * The source must be a document element containing the source code of a WebGL
 * vertex or fragment shader.
 *
 * @param   {RenderContext} ctxt rendering context
 * @param   {object}        src  document element containing shader source code
 * @returns {WebGLShader}        webgl shader program
 */
Shader.compile = function(ctxt, src) {
   /* get webgl context object */
   var gl = ctxt.getGL();
   /* concatenate program text */
   var str = "";
   var el = src.firstChild;
   while (el) {
      if (el.nodeType == 3) {
         str += el.textContent;
      }
      el = el.nextSibling;
   }
   /* create shader */
   var sh;
   if (src.type == "x-shader/x-vertex") {
      sh = gl.createShader(gl.VERTEX_SHADER);
   } else if (src.type == "x-shader/x-fragment") {
      sh = gl.createShader(gl.FRAGMENT_SHADER);
   } else {
      throw ("invalid shader type");
   }
   /* compiler shader */
   gl.shaderSource(sh, str);
   gl.compileShader(sh);
   /* check result */
   if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(sh));
      throw ("error compiling shader");
   }
   return sh;
}

/**
 * Link a shader program (consisting of a vertex and a fragment shader) within
 * the specified rendering context.
 *
 * @param   {RenderContext} ctxt     rendering context
 * @param   {WebGLShader}   v_shader webgl vertex shader
 * @param   {WebGLShader}   f_shader webgl fragment shader
 * @returns {WebGLProgram}           shader program
 */
Shader.link = function(ctxt, v_shader, f_shader) {
   /* get webgl context object */
   var gl = ctxt.getGL();
   /* create webgl program */
   var prog = gl.createProgram();
   /* attach vertex and fragment shaders */
   gl.attachShader(prog, v_shader);
   gl.attachShader(prog, f_shader);
   /* link webgl program */
   gl.linkProgram(prog);
   /* check result */
   if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw ("could not initialize shader");
   return prog;
}
