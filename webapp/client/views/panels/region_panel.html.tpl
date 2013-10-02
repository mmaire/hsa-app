% setdefault("id", "region-panel");
% setdefault("prefix", "segmentation");
% setdefault("hide", False);
<div
   id="{{id}}"
   class="region-panel panel-right{{" hidden" if hide else ""}}"
   data-prefix="{{prefix}}">
   <div id="region-panel-label" class="text-medium">
      Regions
   </div>
   <div id="region-tree-view">
      <div id="region-tree-near-label" class="text-small rotate-left">
         Near
      </div>
      <div id="region-tree-depth-label" class="text-small rotate-left">
         Depth Ordering
      </div>
      <div id="region-tree-far-label" class="text-small rotate-left">
         Far
      </div>
      <div id="region-tree-pane">
         <div id="region-tree-container">
            <ul
               id="region-list-root"
               class="region-list {{prefix}}-region-list">
            </ul>
         </div>
      </div>
      <div
         id="region-tree-slider"
         class="slider-vertical-thin"
         title="Scroll Region List">
      </div>
   </div>
   <div id="region-tree-buttons">
      <button id="region-create-button" title="Create New Region">
         New Region
      </button>
      <button id="region-merge-button" title="Merge Selected Regions">
         Merge
      </button>
   </div>
</div>
