% setdefault("id", "depth-panel");
% setdefault("hide", False);
<div id="{{id}}" class="depth-panel panel-left{{" hidden" if hide else ""}}">
   <div id="depth-panel-label" class="text-medium rotate-left">
      Depth Layer Visibility
   </div>
   <div
      id="depth-slider"
      class="slider-vertical"
      title="Depth Layer Fade">
   </div>
   <div id="depth-near-buttons" class="button-grid">
      <div class="button-row text-tiny">
         Near
      </div>
      <div class="button-row">
         <button
            id="depth-near-advance"
            class="icon-button"
            title="Advance Near Fade Point">
         </button>
      </div>
      <div class="button-row">
         <button
            id="depth-near-retreat"
            class="icon-button"
            title="Retreat Near Fade Point">
         </button>
      </div>
   </div>
   <div id="depth-far-buttons" class="button-grid">
      <div class="button-row">
         <button
            id="depth-far-advance"
            class="icon-button"
            title="Advance Far Fade Point">
         </button>
      </div>
      <div class="button-row">
         <button
            id="depth-far-retreat"
            class="icon-button"
            title="Retreat Far Fade Point">
         </button>
      </div>
      <div class="button-row text-tiny">
         Far
      </div>
   </div>
</div>
