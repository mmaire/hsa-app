
/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Annotator constructor.
 */
function Annotator(div) {
   /* setup canvas rendering */
   /* FIXME */
   /* create scene model */
   /* FIXME */

   /* store annotator base document element */
   this.div = div;
   /* initialize view panel */
   this.view_panel = new ViewPanel(
      $("#view-panel", this.div),
      { min: -4.0, max: 4.0, step: 1.0, default_val: 0.0 }
   );
   /* setup view panel callbacks */
   this.view_panel
      .bindReset(
         function() {
            $("#bottom-left-panel").html("reset");
         }
      )
      .bindPan( 
         function(offset_x, offset_y) {
            $("#bottom-left-panel").html("pan: (" + offset_x + "," + offset_y + ")");
         }
      )
      .bindZoom(
         function(zoom) {
            $("#bottom-left-panel").html("zoom: " + zoom);
         }
      );
   /* initialize depth panel */
   this.depth_panel = new DepthPanel(
      $("#depth-panel", this.div),
      { min: 0.0, max: 1.0, step: 0.01, step_lg: 0.05,
        default_far: 0.0, default_near: 1.0 }
   );
   /* setup depth panel callbacks */
   this.depth_panel
      .bindDepth(
         function(d_far, d_near) {
            $("#bottom-left-panel").html("depth: (" + d_far + "," + d_near + ")");
         }
      )
   /* initialize draw brush panel */
   this.draw_brush_panel = new BrushPanel(
      $("#draw-brush-panel", this.div),
      { min: 1, max: 25, step: 1, default_val: 5 }
   );
   /* setup draw brush panel callbacks */
   this.draw_brush_panel.bindBrush(
      function(type, mode, size, touchup) {
         $("#bottom-left-panel").html(
            "draw brush - " +
            "type: " + type + " " +
            "mode: " + mode + " " +
            "size: " + size + " " +
            "touchup: " + (touchup ? "on" : "off")
         );
      }
   );
   /* initialize paint brush panel */
/*
   this.paint_brush_panel = new BrushPanel(
      $("#paint-brush-panel", this.div),
      { min: 1, max: 25, step: 1, default_val: 5 }
   );
*/
   /* setup paint brush panel callbacks */
/*
   this.paint_brush_panel.bindBrush(
      function(type, mode, size, touchup) {
         $("#bottom-left-panel").html(
            "paint brush - " +
            "type: " + type + " " +
            "mode: " + mode + " " +
            "size: " + size + " " +
            "touchup: " + (touchup ? "on" : "off")
         );
      }
   );
*/
   /* initialize attribute panel */
/*
   this.attribute_panel = new AttributePanel(
      $("#attribute-panel", this.div)
   );
*/
   /* setup attribute panel callbacks */
/*
   this.attribute_panel
      .bindGroupsHide(
         function(groups) {
            $("#bottom-left-panel").html("hide: " + groups);
         }
      )
      .bindGroupsShow(
         function(groups) {
            $("#bottom-left-panel").html("show: " + groups);
         }
      )
      .bindAttribute(
         function(attrib) {
            $("#bottom-left-panel").html("attrib: " + attrib);
         }
      );
*/
   /* initialize region panel */
   /* FIXME */
   /* setup region panel callbacks */
   /* FIXME */
}

/*****************************************************************************
 * UI controls initialization.
 *****************************************************************************/

/**
 * Initialize all user interface controls.
 */
Annotator.prototype.initControls = function() {
   this.initControlsRegionOrder();
}

/**
 * Initialize region depth order controls.
 */
Annotator.prototype.initControlsRegionOrder = function() {
   /* initialize region name autocomplete */
   var availableTags = [
      "ActionScript",
      "AppleScript",
      "Asp",
      "BASIC",
      "C",
      "C++",
      "Clojure",
      "COBOL",
      "ColdFusion",
      "Erlang",
      "Fortran",
      "Groovy",
      "Haskell",
      "Java",
      "JavaScript",
      "Lisp",
      "Perl",
      "PHP",
      "Python",
      "Ruby",
      "Scala",
      "Scheme"
   ];
   $(".region-name").autocomplete(
      { source: availableTags }
   );
   /* initialize region list */
   $(".region-list")
      .sortable(
         {
            handle: ".region-icon-move",
            helper: "clone",
            containment: $("#region-list-pane"),
            items: "li:not(.ui-state-disabled)",
            connectWith: ".region-list"
         }
      )
      .bind("sort",
         function(event, ui) {

            /* FIXME */
         }
      )
      .bind("sortstart",
         function(event, ui) {
         }
      );
   $("#region-panel").resizable();
}


/*****************************************************************************
 * Image load/save interface.
 *****************************************************************************/

/**
 *
 */
Annotator.prototype.imageLoad = function() {
   /* FIXME */
}

/**
 *
 */
Annotator.prototype.imageSave = function() {
   /* FIXME */
}
