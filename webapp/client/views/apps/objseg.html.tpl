<html>
<head>
   <!-- javascript - browser compatibility fixes -->
   <script src="static/javascript/compat.js"></script>
   <!-- javascript - libraries -->
   <script src="static/javascript/libs/datastream/encoding-indexes.js"></script>
   <script src="static/javascript/libs/datastream/encoding.js"></script>
   <script src="static/javascript/libs/datastream/DataStream.js"></script>
   <script src="static/javascript/libs/jquery/jquery.min.js"></script>
   <script src="static/javascript/libs/jquery/jquery-mousewheel.js"></script>
   <script src="static/javascript/libs/jquery/jquery-ui.min.js"></script>
   <script src="static/javascript/libs/jquery/purl.js"></script>
   <script src="static/javascript/libs/webgl/gl-matrix-0.9.6.js"></script>
   <script src="static/javascript/libs/webgl/webgl-utils.js"></script>
   <!-- javascript - utilities -->
   <script src="static/javascript/util/arr_util.js"></script>
   <script src="static/javascript/util/img_util.js"></script>
   <script src="static/javascript/util/set_util.js"></script>
   <!-- javascript - scene attributes -->
   <script src="static/javascript/scene/attributes/pixel_attributes.js"></script>
   <script src="static/javascript/scene/attributes/region_attributes.js"></script>
   <!-- javascript - scene components -->
   <script src="static/javascript/scene/components/brush.js"></script>
   <script src="static/javascript/scene/components/colormap.js"></script>
   <script src="static/javascript/scene/components/img_data.js"></script>
   <script src="static/javascript/scene/components/polygon.js"></script>
   <script src="static/javascript/scene/components/region.js"></script>
   <script src="static/javascript/scene/components/scribble.js"></script>
   <script src="static/javascript/scene/components/scribble_data.js"></script>
   <script src="static/javascript/scene/components/segmentation.js"></script>
   <script src="static/javascript/scene/components/slate.js"></script>
   <script src="static/javascript/scene/components/ucm.js"></script>
   <!-- javascript - scene renderers -->
   <script src="static/javascript/scene/renderers/brush_renderer.js"></script>
   <script src="static/javascript/scene/renderers/colormap_renderer.js"></script>
   <script src="static/javascript/scene/renderers/img_renderer.js"></script>
   <script src="static/javascript/scene/renderers/pixel_attribute_renderer.js"></script>
   <script src="static/javascript/scene/renderers/polygon_renderer.js"></script>
   <script src="static/javascript/scene/renderers/region_renderer.js"></script>
   <script src="static/javascript/scene/renderers/renderer.js"></script>
   <script src="static/javascript/scene/renderers/render_context.js"></script>
   <script src="static/javascript/scene/renderers/scribble_renderer.js"></script>
   <script src="static/javascript/scene/renderers/segmentation_renderer.js"></script>
   <script src="static/javascript/scene/renderers/shader.js"></script>
   <!-- javascript - ui utilities -->
   <script src="static/javascript/ui/util/panel.js"></script>
   <!-- javascript - ui panels -->
   <script src="static/javascript/ui/panels/attribute_panel.js"></script>
   <script src="static/javascript/ui/panels/brush_panel.js"></script>
   <script src="static/javascript/ui/panels/depth_panel.js"></script>
   <script src="static/javascript/ui/panels/region_panel.js"></script>
   <script src="static/javascript/ui/panels/view_panel.js"></script>
   <!-- javascript - annotator application -->
   <script src="static/javascript/ui/apps/annotator.js"></script>
   <!-- css - jquery ui theme -->
   <link rel="stylesheet" href="static/css/theme/jquery-ui.css"/>
   <!-- css - global styles -->
   <link rel="stylesheet" href="static/css/style.css"/>
   <link rel="stylesheet" href="static/css/widgets.css"/>
   <!-- css - panel styles -->
   <link rel="stylesheet" href="static/css/panels/attribute_panel.css"/>
   <link rel="stylesheet" href="static/css/panels/brush_panel.css"/>
   <link rel="stylesheet" href="static/css/panels/depth_panel.css"/>
   <link rel="stylesheet" href="static/css/panels/region_overview_panel.css"/>
   <link rel="stylesheet" href="static/css/panels/region_panel.css"/>
   <link rel="stylesheet" href="static/css/panels/scene_overview_panel.css"/>
   <link rel="stylesheet" href="static/css/panels/view_panel.css"/>
   <!-- css - annotator application style -->
   <link rel="stylesheet" href="static/css/apps/annotator.css"/>
   <!-- webgl shaders -->
   %include webgl/brush.vs.tpl
   %include webgl/brush.fs.tpl
   %include webgl/img.vs.tpl
   %include webgl/img.fs.tpl
   %include webgl/pixel_attribute.vs.tpl
   %include webgl/pixel_attribute.fs.tpl
   %include webgl/polygon.vs.tpl
   %include webgl/polygon.fs.tpl
   %include webgl/region.vs.tpl
   %include webgl/region.fs.tpl
   %include webgl/scribble.vs.tpl
   %include webgl/scribble.fs.tpl
   <!-- document initialization -->
   <script>
      var ZOOM = 1.0;

      /* get click coordinates */
      var imageCoords = function(im, ev) {
         /* get event x and y-coordinates on canvas */
         var x;
         var y;
         if (ev.offsetX) {
            x = ev.offsetX;
            y = ev.offsetY;
         }
         else if (ev.layerX) {
            x = ev.layerX;
            y = ev.layerY;
         } else {
            var coords = { x: 0, y: 0, flag: false};
            return coords;
            alert("bad mouse event");
         }
         /* transform to image coordinates */
         y = (ZOOM*im.height - 1) - y;
         /* round */
         x = Math.round(x);
         y = Math.round(y);
         /* check bounds */
         var flag = true;
         if (x >= ZOOM*im.width)  { x = ZOOM*im.width - 1;  flag = false; }
         if (x < 0)               { x = 0;                  flag = false; }
         if (y >= ZOOM*im.height) { y = ZOOM*im.height - 1; flag = false; }
         if (y < 0)               { y = 0;                  flag = false; }
         /* flip x, y and return coordinates */
         var coords = { x : Math.round(y/ZOOM), y : Math.round(x/ZOOM), flag : flag };
         return coords;
      }

      /* image and annotation names */
      var img_name = "";
      var ann_name = "";
      /* webgl canvas and context */
      var canvas = null;
      var ctxt   = null;
      /* ui panels */
      var brush_panel  = null;
      /* ui state */
      var is_edit = false;    /* in region editing mode? */
      var r_active = null;    /* region being edited */
      var is_down = false;    /* in mouse down? */
      var ink_prev = null;
      /* scene data */
      var im     = null;
      var img    = null;
      var seg    = null;
      var slt    = null;
      var brsh   = null;
      /* scene renderers */
      var r_img  = null;
      var r_seg  = null;
      var r_slt  = null;
      var r_brsh = null;
      /* depth layers */
      var D_IMG  =  1.5;
      var D_SLT  = -0.5;
      var D_BRSH = -0.9;

      /* initialization - webgl */
      function initWebGL() {
         /* initialize renderer */
         canvas = document.getElementById("main-canvas");
         ctxt = new RenderContext(canvas);
         ctxt.canvasInit();
         ctxt.cameraInit();
         ctxt.canvasColor([0.75, 0.75, 0.75, 1.0]);
      }

      /* initialization - image data */
      function initImage() {
         /* create image */
         img = new ImgData(im);
         /* resize canvas */
         ctxt.canvasResize(im.width, im.height);
         ctxt.cameraInit(-1.0, 2.0);
         $("#main-canvas").width(ZOOM*im.width);
         $("#main-canvas").height(ZOOM*im.height);
         /* attach renderer */
         r_img = new ImgRenderer(ctxt, img);
         r_img.setDepth(D_IMG);
         r_img.setColor([0.0, 0.0, 0.0, 0.0]);
      }

      /* initialization - annotation data */
      function initAnnotation() {
         /* load UCM */
         var xhrb = new XMLHttpRequest();
         xhrb.open('GET', '/hsa-app/images/' + img_name + '.ucm', true);
         xhrb.responseType = "arraybuffer";
         xhrb.onload = function(e) {
            /* attach renderer */
            r_seg = new SegmentationRenderer(ctxt, seg);
            /* create slate */
            var arrb = new Uint8Array(xhrb.response);
            if (arrb.length > 1000) {
               /* create slate */
               var ds = new DataStream(arrb.buffer);
               slt = new Slate(img, new UCM(ds));
            } else {
               /* create slate */
               slt = new Slate(img, new UCM(img));
            }
            /* attach renderer */
            r_slt = new ScribbleRenderer(ctxt, slt.scrib);
            r_slt.setDepth(D_SLT);
         };
         xhrb.send();
      }

      /* initialization - brush data */
      function initBrush() {
         /* create brush */
         brsh = new Brush(img, 50, 50, 5);
         /* attach renderer */
         r_brsh = new BrushRenderer(ctxt, brsh);
         r_brsh.setDepth(D_BRSH);
         r_brsh.setColor([0, 1, 0, 0.5]);
      }

      /* initialization - panels */
      function initPanels() {
         /* initialize brush panel  */
         brush_panel = new BrushPanel(
            $("#paint-brush-panel"),
            { min: 1, max: 50, step: 1, step_lg: 5, default_val: 5 }
         );
         brush_panel.bindBrush(
            function(shape, ink, mode, size) {
               brsh.setRadius(size);
               if (shape == "circle")
                  brsh.setType(null);
               else
                  brsh.setType("seg");
            }
         );
         /* setup segmentation */
         if (seg.countRegions() == 0) {
            /* create single region */
            var r = new Region(seg);
            r.enableRegionAttributes();
         }
         /* edit first region */
         var r = seg.regions[0];
         if (r.scrib_data == null) {
            /* no existing scribble data - load and impose prior */
            slt.regionLoad(r);
            slt.imposeBorderPrior(true);
         } else {
            /* just load existing scribble data */
            slt.regionLoad(r);
         }
         /* make region active */
         r_active = r;
         /* switch to editing mode */
         $("#main-canvas").addClass("cursor-none");
         $("#paint-brush-panel").delay("fast");
         brush_panel.show("fast");
         is_edit = true;
         /* setup canvas and document callbacks */
         canvas.onmousemove = function(ev) {
            var coords = imageCoords(im, ev);
            if ((slt != null) && (is_down)) {
               if ((is_edit) && (coords.flag)) {
                  var px   = brsh.grabPixels();
                  var ink  = brush_panel.getBrushInk();
                  var mode = brush_panel.getBrushMode();
                  var prop = (mode == "fill");
                  if (ink == "positive") {
                     slt.strokeDrawPositive(px, prop);
                  } else if (ink == "negative") {
                     slt.strokeDrawNegative(px, prop);
                  } else {
                     slt.strokeErase(px);
                  }
                  /* mark state as not saved */
                  $("#save-button").removeClass("ann-saved");
                  $("#save-button").addClass("ann-unsaved");
               }
            }
            if ((slt != null) && (brsh != null)) {
               brsh.setPosition(coords.x, coords.y);
            }
         }
         canvas.onmousedown = function(ev) {
            switch (ev.which) {
               case 1:
                  /* left click */
                  is_down = true;
                  var coords = imageCoords(im, ev);
                  if ((slt != null) && (is_down)) {
                     if ((is_edit) && (coords.flag)) {
                        var px   = brsh.grabPixels();
                        var ink  = brush_panel.getBrushInk();
                        var mode = brush_panel.getBrushMode();
                        var prop = (mode == "fill");
                        if (ink == "positive") {
                           slt.strokeDrawPositive(px, prop);
                        } else if (ink == "negative") {
                           slt.strokeDrawNegative(px, prop);
                        } else {
                           slt.strokeErase(px);
                        }
                        /* mark state as not saved */
                        $("#save-button").removeClass("ann-saved");
                        $("#save-button").addClass("ann-unsaved");
                     }
                  }
                  if ((slt != null) && (brsh != null)) {
                     brsh.setPosition(coords.x, coords.y);
                  }
                  break;
               default:
                  break;
            }
         }
         $(document).mousewheel(
            function(ev, delta, deltaX, deltaY) {
               ev.preventDefault();
            }
         );
         $("#main-canvas").mousewheel(
            function(ev, delta, deltaX, deltaY) {
               ev.preventDefault();
               if (is_edit) {
                  var large_step = !(ev.altKey);
                  if (delta < 0) {
                     brush_panel.increaseBrushSize(large_step);
                  } else if (delta > 0) {
                     brush_panel.decreaseBrushSize(large_step);
                  }
               }
            }
         );
         document.onmouseup = function(ev) {
            is_down = false;
         }
         canvas.oncontextmenu = function() {
            return false;
         }
         /* bind shortcut keys */
         $(document).keydown(function (ev) {
            /* check key codes */
            if (ev.which == 9) {
               /* handle TAB key */
               ev.preventDefault();
               var ink = brush_panel.getBrushInk();
               if (ink == "positive") {
                  brush_panel.setBrushInk("negative");
                  if (r_brsh != null)
                     r_brsh.setColor([1, 0, 0, 0.5]);
               } else if (!(ev.shiftKey)) {
                  brush_panel.setBrushInk("positive");
                  if (r_brsh != null)
                     r_brsh.setColor([0, 1, 0, 0.5]);
               }
            } else if (ev.which == 16) {
               /* handle SHIFT key */
               ink_prev = brush_panel.getBrushInk();
               brush_panel.setBrushInk("erase");
               if (r_brsh != null)
                  r_brsh.setColor([1, 1, 1, 0.5]);
            }
         });
        $(document).keyup(function (ev) {
            /* check key codes */
            if (ev.which == 16) {
               /* handle SHIFT key */
               if (ink_prev != null) {
                  brush_panel.setBrushInk(ink_prev);
                  if (r_brsh != null) {
                     if (ink_prev == "negative") {
                        r_brsh.setColor([1, 0, 0, 0.5]);
                     } else if (ink_prev == "positive") {
                        r_brsh.setColor([0, 1, 0, 0.5]);
                     } else {
                        r_brsh.setColor([1, 1, 1, 0.5]);
                     }
                  }
               }
            }
         });
         /* bind shortcut character keys */
         $(document).keypress(function (ev) {
            if (ev.which != 0) {
               var c = String.fromCharCode(ev.which);
               switch (c) {
                  case 'c':
                     brush_panel.setBrushShape("circle");
                     break;
                  case 'a':
                     brush_panel.setBrushShape("area");
                     break;
                  case 'g':
                     brush_panel.setBrushInk("positive");
                     if (r_brsh != null)
                        r_brsh.setColor([0, 1, 0, 0.5]);
                     ink_prev = null;
                     break;
                  case 'r':
                     brush_panel.setBrushInk("negative");
                     if (r_brsh != null)
                        r_brsh.setColor([1, 0, 0, 0.5]);
                     ink_prev = null;
                     break;
                  case 'e':
                     brush_panel.setBrushInk("erase");
                     if (r_brsh != null)
                        r_brsh.setColor([1, 1, 1, 0.5]);
                     ink_prev = null;
                     break;
                  case 'f':
                     brush_panel.setBrushMode("fill");
                     break;
                  case 't':
                     brush_panel.setBrushMode("touchup");
                     break;
                  case 's':
                     saveAnnotation();
                     break;
                  default:
                     break;
               }
            }
         });
      }

      /* load the image */
      function loadImage() {
         im = new Image();
         im.onload = function () {
            /* initialize image */
            initImage();
            /* load annotation */
            loadAnnotation();
         }
         im.src = "images/" + img_name + ".jpg";
      }

      /* load segmentation for brush assistance */
      function loadBrushSeg() {
         var xhra = new XMLHttpRequest();
         xhra.open('GET', '/hsa-app/images/' + img_name + '.seg', true);
         xhra.responseType = "arraybuffer";
         xhra.onload = function(e) {
            /* update brush */
            var arr = new Uint8Array(xhra.response);
            var ds = new DataStream(arr.buffer);
            var rle = ArrUtil.rleDeserialize(ds);
            var arr_seg = ArrUtil.rleDecompress(rle);
            brsh.addType("seg", arr_seg);
            /* initialize panels */
            initPanels();
            /* go */
            tick();
         };
         xhra.send();
      }

      /* load scene annotation */
      function loadAnnotation() {
         var xhrb = new XMLHttpRequest();
         xhrb.open('GET', '/hsa-app/images/' + ann_name + '.ann', true);
         xhrb.responseType = "arraybuffer";
         xhrb.onload = function(e) {
            /* create segmentation */
            var arrb = new Uint8Array(xhrb.response);
            if (arrb.length > 1000) {
               var ds = new DataStream(arrb.buffer);
               seg = Segmentation.deserialize(img, ds);
            } else {
               seg = new Segmentation(img);
            }
            /* initialize annotation */
            initAnnotation();
            /* initialize brush */
            initBrush();
            /* load brush seg */
            loadBrushSeg();
         };
         xhrb.send();
      }

      /* save scene annotation */
      function saveAnnotation() {
         if (r_active != null) {
            /* update region contents */
            slt.regionSave(r_active);
            /* transfer to server */
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/hsa-app/images/' + ann_name + '.ann', true);
            var ds = new DataStream();
            seg.serialize(ds);
            var arr = new Uint8Array(ds.buffer);
            xhr.send(arr.buffer);
            $("#save-button").removeClass("ann-unsaved");
            $("#save-button").addClass("ann-saved");
         }
      }

      /* screen update callback */
      function tick() {
         requestAnimFrame(tick);
         if (img != null) {
            ctxt.canvasClear();
            if (is_edit) {
               Renderer.draw(slt.scrib);
               Renderer.draw(brsh);
            } else {
               Renderer.draw(img);
               Renderer.draw(seg);
            }
         }
      }

      $(document).ready(function() {
         $("#main-canvas").disableSelection();
         img_name = $.url().param("image");
         ann_name = $.url().param("ann");
         initWebGL();
         loadImage();
      });

   </script>
</head>
<body>
   <div id="header" class="text-medium">
   </div>
   <div id="ui-container">
      <div id="ui">
         <div id="left-column" class="column">
            %include panels/view_panel.html.tpl hide=True
            %include panels/depth_panel.html.tpl hide=True
            %include panels/draw_brush_panel.html.tpl hide=True
            %include panels/paint_brush_panel.html.tpl hide=True
         </div>
         <div id="center-column" class="column">
            <div id="canvas-section">
               <div id="main-canvas-container">
                  <canvas id="main-canvas"></canvas>
               </div>
               <div id="mini-canvas-container" class="position-top position-left" style="display:none">
                  <canvas id="mini-canvas"></canvas>
               </div>
            </div>
            <div id="bottom">
               <div id="bottom-left-panel" class="panel-bottom" style="display:none; width:20rem">
                  Bottom left panel
               </div>
               <div id="bottom-right-panel" class="panel-bottom">
                  <a id="save-button" class="ann-saved text-huge" onclick="saveAnnotation();"><u>S</u>ave</a>
               </div>
            </div>
         </div>
         <div id="right-column" class="column">
            %include panels/scene_overview_panel.html.tpl hide=True
            %include panels/region_overview_panel.html.tpl hide=True
            %include panels/region_panel.html.tpl hide=True
            %include panels/attribute_panel.html.tpl hide=True
         </div>
      </div>
   </div>
   <div id="footer" class="text-medium" style="display:none;">
   <a onclick="change_my_url();">Click to change url to bar.html</a>
      This is the footer.
   </div>
</body>
</html>
