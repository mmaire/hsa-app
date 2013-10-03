<html>
<head>
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
   <script src="static/javascript/scene/components/segmentation.js"></script>
   <script src="static/javascript/scene/components/slate.js"></script>
   <!-- javascript - scene renderers -->
   <script src="static/javascript/scene/renderers/brush_renderer.js"></script>
   <script src="static/javascript/scene/renderers/colormap_renderer.js"></script>
   <script src="static/javascript/scene/renderers/img_renderer.js"></script>
   <script src="static/javascript/scene/renderers/pixel_attribute_renderer.js"></script>
   <script src="static/javascript/scene/renderers/polygon_renderer.js"></script>
   <script src="static/javascript/scene/renderers/region_renderer.js"></script>
   <script src="static/javascript/scene/renderers/render_context.js"></script>
   <script src="static/javascript/scene/renderers/renderer.js"></script>
   <script src="static/javascript/scene/renderers/segmentation_renderer.js"></script>
   <script src="static/javascript/scene/renderers/shader.js"></script>
   <script src="static/javascript/scene/renderers/slate_renderer.js"></script>
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
   %include webgl/slate.vs.tpl
   %include webgl/slate.fs.tpl
   <!-- document initialization -->
   <script>
      var ZOOM = 1.5;

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

      /* image name */
      var img_name = "";
      /* webgl canvas and context */
      var canvas = null;
      var ctxt   = null;
      /* ui panels */
      var depth_panel  = null;
      var brush_panel  = null;
      var region_panel = null;
      /* ui state */
      var is_edit = false;    /* in region editing mode? */
      var r_active = null;    /* region being edited */
      var is_down = false;    /* in mouse down? */
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
         /* attach renderer */
         r_seg = new SegmentationRenderer(ctxt, seg);
         /* create slate */
         slt = new Slate(img);
         /* attach renderer */
         r_slt = new SlateRenderer(ctxt, slt);
         r_slt.setDepth(D_SLT);
      }

      /* initialization - brush data */
      function initBrush() {
         /* create brush */
         brsh = new Brush(img, 50, 50, 5);
         /* attach renderer */
         r_brsh = new BrushRenderer(ctxt, brsh);
         r_brsh.setDepth(D_BRSH);
      }

      /* initialization - panels */
      function initPanels() {
         /* initialize depth panel */
         depth_panel = new DepthPanel($("#depth-panel"));
         depth_panel.bindDepth(
            function(d_far, d_near) {
               r_seg.setFadeNear(-d_near);
               r_seg.setFadeFar(-d_far);
            }
         )
         /* initialize brush panel  */
         brush_panel = new BrushPanel(
            $("#paint-brush-panel"),
            { min: 1, max: 50, step: 1, step_lg: 5, default_val: 5 }
         );
         brush_panel.bindBrush(
            function(type, mode, size, touchup) {
               brsh.setRadius(size);
               if (type == "circle")
                  brsh.setType(null);
               else
                  brsh.setType("seg");
            }
         );
         brush_panel.setBrushType("region");
         /* initialize region panel */
         region_panel = new RegionPanel($("#region-panel"));
         region_panel.loadSegmentation(seg);
         region_panel
            .bindRegionCreate(
               function() {
                  /* create region */
                  var r = new Region(seg);
                  r.enableRegionAttributes();
                  /* mark state as not saved */
                  $("#save-button").removeClass("ann-saved");
                  $("#save-button").addClass("ann-unsaved");
                  /* return region */
                  return r;
               }
            )
            .bindRegionDelete(
               function(r_id) {
                  /* get parent region */
                  var r  = seg.regions[r_id];
                  var rp = r.getParentRegion();
                  /* get rank relative to siblings */
                  var rank = r.getRank();
                  /* remove region */
                  seg.removeRegion(r_id);
                  /* destroy rendering data */
                  Renderer.destroyAll(r);
                  /* update ranks of remaining siblings */
                  var siblings = rp.getChildRegions();
                  for (var n = 0; n < siblings.length; ++n) {
                     if (siblings[n].rank > rank)
                        --(siblings[n].rank);
                  }
                  /* mark state as not saved */
                  $("#save-button").removeClass("ann-saved");
                  $("#save-button").addClass("ann-unsaved");
               }
            )
            .bindRegionMoveRequest(
               function(r_id) {
                  var r_covering = seg.regions[r_id].covering;
                  var covering = new Array(r_covering.length);
                  for (var n = 0; n < r_covering.length; ++n)
                     covering[n] = r_covering[n].id;
                  return covering;
               }
            )
            .bindRegionMove(
               function(r_id, r_parent_id, rank) {
                  /* get region and current parent */
                  var r  = seg.regions[r_id];
                  var rp = r.getParentRegion();
                  /* update ranks of current siblings */
                  var siblings = rp.getChildRegions();
                  for (var n = 0; n < siblings.length; ++n) {
                     if (siblings[n].rank > r.rank)
                        --(siblings[n].rank);
                  }
                  /* get destination parent region */
                  rp = (r_parent_id == null) ? seg.root : seg.regions[r_parent_id];
                  /* update ranks of future siblings */
                  siblings = rp.getChildRegions();
                  for (var n = 0; n < siblings.length; ++n) {
                     if (siblings[n].rank >= rank)
                        ++(siblings[n].rank);
                  }
                  /* update region rank */
                  r.rank = rank;
                  /* update parent */
                  r.setParentRegion(rp);
                  /* mark state as not saved */
                  $("#save-button").removeClass("ann-saved");
                  $("#save-button").addClass("ann-unsaved");
               }
            )
            .bindRegionEdit(
               function(r_id, mode) {
                  /* get parent region (if any) */
                  var r  = seg.regions[r_id];
                  var rp = r.parent_region;
                  /* restrict brush to parent */
                  if ((rp != null) && (rp != seg.root)) {
                     brsh.setContainmentRegion(rp);
                  } else {
                     brsh.clearContainment();
                  }
                  /* clear slate */
                  slt.clear();
                  /* restrict slate to parent */
                  if ((rp != null) && (rp != seg.root)) {
                     slt.setAllowedRegion(rp);
                  }
                  /* require slate to include children */
                  slt.setRequiredRegions(r.getChildRegions());
                  /* select current region */
                  slt.selectRegion(r);
                  /* make region active */
                  r_active = r;
                  /* copy region color to brush and slate */
                  var r_attribs = r.getRegionAttributes();
                  if (r_attribs != null) {
                     var color_brsh = ArrUtil.clone(r_attribs.getColor());
                     var color_slt  = ArrUtil.clone(r_attribs.getColor());
                     color_brsh[3] = 0.5;
                     color_slt[3]  = 0.5;
                     r_brsh.setColor(color_brsh);
                     r_slt.setColor(color_slt);
                     brush_panel.setModeIconColor(
                        "positive",
                        'rgb(' +
                           Math.round(255*color_brsh[0]) + ',' +
                           Math.round(255*color_brsh[1]) + ',' +
                           Math.round(255*color_brsh[2]) +
                        ')'
                     );
                  }
                  /* switch to editing mode */
                  $("#main-canvas").addClass("cursor-none");
                  $("#region-panel").css("pointer-events", "none");
                  var r_entry = region_panel.region_entry_map[r_id];
                  var r_box = r_entry.children(".region-box");
                  var tmp = r_box.css("border-top-color");
                  r_box.css("background", tmp);
                  r_box.addClass("box-hold");
                  $(".region-buttons, .region-icon-move, .region-icon-expand, .region-icon-details, .region-name, #region-tree-buttons").fadeTo("fast", 0.5);
                  depth_panel.hide("fast");
                  $("#paint-brush-panel").delay("fast");
                  brush_panel.show("fast");
                  is_edit = true;
                  /* mark state as not saved */
                  $("#save-button").removeClass("ann-saved");
                  $("#save-button").addClass("ann-unsaved");
               }
            )
            .bindRegionRename(
               function(r_id, name) {
                  var r = seg.regions[r_id];
                  var reg_attribs = r.getRegionAttributes();
                  if (reg_attribs != null)
                     reg_attribs.setName(name);
                  /* mark state as not saved */
                  $("#save-button").removeClass("ann-saved");
                  $("#save-button").addClass("ann-unsaved");
               }
            )
            .bindToggleExpand(
               function(r_id, state) {
                  r_seg.setExpansionState([r_id], state);
               }
            )
            .bindToggleSelect(
               function(r_id, state) {
                  r_seg.setSelectionState([r_id], state);
               }
            );
         /* setup canvas and document callbacks */
         canvas.onmousemove = function(ev) {
            var coords = imageCoords(im, ev);
            if ((slt != null) && (is_down)) {
               if ((is_edit) && (coords.flag)) {
                  var px = brsh.grabPixels();
                  if (brush_panel.getBrushMode() != "erase") {
                     if (ev.shiftKey) { slt.deselectPixels(px); } else { slt.selectPixels(px); }
                  } else {
                     if (ev.shiftKey) { slt.selectPixels(px); } else { slt.deselectPixels(px); }
                  }
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
                        var px = brsh.grabPixels();
                        if (brush_panel.getBrushMode() != "erase") {
                           if (ev.shiftKey) { slt.deselectPixels(px); } else { slt.selectPixels(px); }
                        } else {
                           if (ev.shiftKey) { slt.selectPixels(px); } else { slt.deselectPixels(px); }
                        }
                     }
                  }
                  if ((slt != null) && (brsh != null)) {
                     brsh.setPosition(coords.x, coords.y);
                  }
                  break;
               case 3:
                  /* right click */
                  var px = slt.grabPixels();
                  r_active.setPixels(px);
                  var r_entry = region_panel.region_entry_map[r_active.getRegionId()];
                  var r_box = r_entry.children(".region-box");
                  r_box.css("background", "");
                  r_box.removeClass("box-hold");
                  is_edit = false;
                  r_active = null;
                  $("#main-canvas").removeClass("cursor-none");
                  $("#region-panel").css("pointer-events", "auto");
                  $(".region-buttons, .region-icon-move, .region-icon-expand, .region-icon-details, .region-name, #region-tree-buttons").fadeTo("fast", 1.0);
                  brush_panel.hide("fast");
                  $("#depth-panel").delay("fast");
                  depth_panel.show("fast");
            }
         }
         $("#main-canvas").mousewheel(
            function(ev, delta, deltaX, deltaY) {
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
         /* show the panels */
         depth_panel.show();
         region_panel.show();
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
         xhra.open('GET', '/test/images/' + img_name + '.seg', true);
         xhra.responseType = "arraybuffer";
         xhra.onload = function(e) {
            /* update brush */
            var arr = new Uint32Array(xhra.response);
            brsh.addType("seg", arr);
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
         xhrb.open('GET', '/test/images/' + img_name + '.ann', true);
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
         var xhr = new XMLHttpRequest();
         xhr.open('POST', '/test/images/' + img_name + '.ann', true);
         var ds = new DataStream();
         seg.serialize(ds);
         var arr = new Uint8Array(ds.buffer);
         xhr.send(arr.buffer);
         $("#save-button").removeClass("ann-unsaved");
         $("#save-button").addClass("ann-saved");
      }

      /* screen update callback */
      function tick() {
         requestAnimFrame(tick);
         if (img != null) {
            ctxt.canvasClear();
            if (is_edit) {
               Renderer.draw(slt);
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
                  <a id="save-button" class="ann-saved text-large" onclick="saveAnnotation();">Save</a>
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
