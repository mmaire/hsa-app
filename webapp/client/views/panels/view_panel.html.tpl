% setdefault("id", "view-panel");
% setdefault("hide", False);
<div id="{{id}}" class="view-panel panel-left{{" hidden" if hide else ""}}">
   <div id="pan-button-grid" class="button-grid">
      <div class="button-row">
         <button
            id="pan-nw"
            class="icon-button"
            title="Pan Up & Left">
         </button>
         <button
            id="pan-n"
            class="icon-button"
            title="Pan Up">
         </button>
         <button
            id="pan-ne"
            class="icon-button"
            title="Pan Up & Right">
         </button>
      </div>
      <div class="button-row">
         <button
            id="pan-w"
            class="icon-button"
            title="Pan Left">
         </button>
         <button
            id="pan-center"
            class="icon-button"
            title="Center Image/Region">
         </button>
         <button
            id="pan-e"
            class="icon-button"
            title="Pan Right">
         </button>
      </div>
      <div class="button-row">
         <button
            id="pan-sw"
            class="icon-button"
            title="Pan Down & Left">
         </button>
         <button
            id="pan-s"
            class="icon-button"
            title="Pan Down">
         </button>
         <button
            id="pan-se"
            class="icon-button"
            title="Pan Down & Right">
         </button>
      </div>
   </div>
   <div id="zoom-controls">
      <div id="zoom-controls-label" class="text-medium rotate-left">
         Zoom
      </div>
      <div
         id="zoom-slider"
         class="slider-vertical"
         title="Zoom">
      </div>
      <div id="zoom-text" class="text-tiny">1.0x</div>
      <div id="zoom-in-button-container" class="button-grid">
         <button
            id="zoom-in"
            class="icon-button"
            title="Zoom In">
         </button>
      </div>
      <div id="zoom-out-button-container" class="button-grid">
         <button
            id="zoom-out"
            class="icon-button"
            title="Zoom Out">
         </button>
      </div>
      <div id="zoom-fit-button-container" class="button-grid">
         <button
            id="zoom-fit"
            class="icon-button"
            title="Fit in Window">
         </button>
      </div>
   </div>
</div>
