% setdefault("id", "draw-brush-panel");
% setdefault("prefix", "draw");
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
            title="Draw">
            <div class="brush-keybind text-tiny"><u>D</u></div>
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
   <div id="{{prefix}}-brush-modes" class="brush-modes hidden">
      <div>
         <input
            name="{{prefix}}-brush-modes"
            type="radio"
            value="fill"
            id="{{prefix}}-brush-fill"
            disabled
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
            checked
            disabled
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
