% setdefault("id", "paint-brush-panel");
% setdefault("prefix", "paint");
% setdefault("hide", False);
<div
   id="{{id}}"
   class="brush-panel panel-left{{" hidden" if hide else ""}}"
   data-prefix="{{prefix}}">
   <div class="text-medium">
      Brushes
   </div>
   <div id="{{prefix}}-brush-types" class="brush-types">
      <div>
         <input
            name="{{prefix}}-brush-types"
            type="radio"
            value="circle"
            id="{{prefix}}-brush-circle"
            checked
         />
         <label
            class="brush-icon"
            id="brush-circle-icon"
            for="{{prefix}}-brush-circle"
            title="Circular">
         </label>
      </div>
      <div>
         <input
            name="{{prefix}}-brush-types"
            type="radio"
            value="region"
            id="{{prefix}}-brush-region"
         />
         <label
            class="brush-icon"
            id="brush-region-icon"
            for="{{prefix}}-brush-region"
            title="Snap to Segment">
         </label>
      </div>
      <div>
         <input
            name="{{prefix}}-brush-types"
            type="radio"
            value="appearance"
            id="{{prefix}}-brush-appearance"
         />
         <label
            class="brush-icon"
            id="brush-appearance-icon"
            for="{{prefix}}-brush-appearance"
            title="Snap to Color/Texture">
         </label>
      </div>
   </div>
   <div id="brush-types-label" class="text-tiny">
      Type
   </div>
   <div id="{{prefix}}-brush-modes" class="brush-modes">
      <div>
         <input
            name="{{prefix}}-brush-modes"
            type="radio"
            value="positive"
            id="{{prefix}}-brush-positive"
            checked
         />
         <label
            class="brush-icon brush-circle-icon-bg"
            id="brush-positive-icon"
            for="{{prefix}}-brush-positive"
            title="Set Attribute">
         </label>
      </div>
      <div>
         <input
            name="{{prefix}}-brush-modes"
            type="radio"
            value="erase"
            id="{{prefix}}-brush-erase"
         />
         <label
            class="brush-icon brush-circle-icon-bg"
            id="brush-erase-icon"
            for="{{prefix}}-brush-erase"
            title="Erase Attribute">
         </label>
      </div>
   </div>
   <div id="paint-brush-modes-label" class="text-tiny">
      Mode
   </div>
   <div
      id="brush-size-slider"
      class="slider-horizontal-thin"
      title="Brush Size">
   </div>
   <div id="brush-size-label" class="text-tiny">
      Size:
   </div>
   <div id="brush-size-text" class="text-tiny"></div>
   <div id="brush-touchup-label" class="text-tiny">
      Touch-up:
   </div>
   <div id="{{prefix}}-brush-touchup" class="brush-touchup">
      <input
         name="{{prefix}}-brush-touchup"
         type="checkbox"
         id="{{prefix}}-touchup"
         disabled
         checked
      />
      <label
         id="touchup-icon"
         for="{{prefix}}-touchup"
         title="Automatic Fill-In Disabled for Attributes">
      </label>
   </div>
</div>
