% setdefault("id", "paint-brush-panel");
% setdefault("prefix", "paint");
% setdefault("hide", False);
<div
   id="{{id}}"
   class="brush-panel panel-left{{" hidden" if hide else ""}}"
   data-prefix="{{prefix}}">
   <div class="text-medium">Brushes</div>
   <!-- brush shape selection -->
   <div id="{{prefix}}-brush-shapes" class="brush-shapes">
      <div>
         <input
            name="{{prefix}}-brush-shapes"
            type="radio"
            value="circle"
            id="{{prefix}}-brush-circle"
            checked
         />
         <label
            class="brush-icon brush-circle-img active"
            id="brush-circle-icon"
            for="{{prefix}}-brush-circle"
            title="Circular">
            <div class="brush-keybind text-tiny"><u>C</u></div>
         </label>
      </div>
      <div>
         <input
            name="{{prefix}}-brush-shapes"
            type="radio"
            value="area"
            id="{{prefix}}-brush-area"
         />
         <label
            class="brush-icon brush-area-img inactive"
            id="brush-area-icon"
            for="{{prefix}}-brush-area"
            title="Snap to Area">
            <div class="brush-keybind text-tiny"><u>A</u></div>
         </label>
      </div>
   </div>
   <div id="brush-shapes-label" class="text-tiny">Shape</div>
   <!-- brush ink selection -->
   <div id="{{prefix}}-brush-inks" class="brush-inks">
      <div>
         <input
            name="{{prefix}}-brush-inks"
            type="radio"
            value="positive"
            id="{{prefix}}-brush-positive"
            checked
         />
         <label
            class="brush-icon brush-circle-img active"
            id="brush-positive-icon"
            for="{{prefix}}-brush-positive"
            title="Green: Mark as Object">
            <div class="brush-keybind text-tiny"><u>G</u></div>
         </label>
      </div>
      <div>
         <input
            name="{{prefix}}-brush-inks"
            type="radio"
            value="negative"
            id="{{prefix}}-brush-negative"
         />
         <label
            class="brush-icon brush-circle-img inactive"
            id="brush-negative-icon"
            for="{{prefix}}-brush-negative"
            title="Red: Mark as Background">
            <div class="brush-keybind text-tiny"><u>R</u></div>
         </label>
      </div>
      <div>
         <input
            name="{{prefix}}-brush-inks"
            type="radio"
            value="erase"
            id="{{prefix}}-brush-erase"
         />
         <label
            class="brush-icon brush-circle-img inactive"
            id="brush-erase-icon"
            for="{{prefix}}-brush-erase"
            title="Erase">
            <div class="brush-keybind text-tiny"><u>E</u></div>
         </label>
      </div>
   </div>
   <div id="brush-inks-label" class="text-tiny">Ink</div>
   <!-- brush size slider -->
   <div
      id="brush-size-slider"
      class="slider-horizontal-thin"
      title="Brush Size">
   </div>
   <div id="brush-size-label" class="text-tiny">
      Size:
   </div>
   <div id="brush-size-text" class="text-tiny"></div>
   <!-- brush mode selection -->
   <div id="{{prefix}}-brush-modes" class="brush-modes">
      <div>
         <input
            name="{{prefix}}-brush-modes"
            type="radio"
            value="fill"
            id="{{prefix}}-brush-fill"
            checked
         />
         <label
            id="brush-fill-label"
            class="text-tiny"
            for="{{prefix}}-brush-fill"
            title="Auto-Fill from Brush Marks">
            <u>F</u>ill
         </label>
      </div>
      <div>
         <input
            name="{{prefix}}-brush-modes"
            type="radio"
            value="touchup"
            id="{{prefix}}-brush-touchup"
         />
         <label
            id="brush-touchup-label"
            class="text-tiny"
            for="{{prefix}}-brush-touchup"
            title="Apply Touchup Brush Marks (No Fill)">
            <u>T</u>ouchup
         </label>
      </div>
   </div>
</div>
