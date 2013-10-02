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

/*
 * Region panel user interface.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Region panel constructor.
 *
 * @class Region panels provide interface functionality for managing regions
 *        within a {@link Segmentation}.  The panel displays the region tree
 *        for the segmentation and allows the user to create, delete, merge,
 *        rearrange, and edit regions within the tree.
 *
 * @constructor
 * @param {object} div DOM div element for region panel
 */
function RegionPanel(div) {
   /* store panel document element */
   this.div = div;
   /* initialize region id -> region entry DOM element mapping */
   this.region_entry_map = [];
   /* initialize callbacks */
   this.callback_region_create   = null; /* segmentation: create region */
   this.callback_region_delete   = null; /* segmentation: delete region */
   this.callback_region_merge    = null; /* segmentation: merge regions */
   this.callback_region_move_req = null; /* segmentation: move request */
   this.callback_region_move     = null; /* segmentation: move region */
   this.callback_region_edit     = null; /* segmentation: edit region */
   this.callback_region_rename   = null; /* segmentation: rename region */
   this.callback_toggle_expand   = null; /* display: toggle subtree expansion */
   this.callback_toggle_select   = null; /* display: toggle region selection */
   this.callback_resize          = null; /* panel resize event callback */
   /* initialize ui */
   this.initUI();
}

/*****************************************************************************
 * Region panel user interface DOM element creation.
 *****************************************************************************/

/**
 * Create and return a DOM element containing a region editing buttonset.
 *
 * @returns {object} DOM div element for buttonset
 */
RegionPanel.createRegionButtons = function() {
   /* create edit shape button */
   var button_edit_shape = $(
      '<button ' +
         'class="region-edit-shape-button" ' +
         'title="Edit Region Shape">' +
      '</button>'
   );
   /* create edit attributes button */
   var button_edit_attributes = $(
      '<button ' +
         'class="region-edit-attributes-button" ' +
         'title="Edit Region Attributes">' +
      '</button>'
   );
   /* create trash button */
   var button_trash = $(
      '<button ' +
         'class="region-trash-button" ' +
         'title="Delete Region">' +
      '</button>'
   );
   /* set editing button modes */
   button_edit_shape.data("mode", "shape");
   button_edit_attributes.data("mode", "attributes");
   /* style the buttons */
   var style = "icon-button-small";
   button_edit_shape.addClass(style);
   button_edit_attributes.addClass(style);
   button_trash.addClass(style);
   /* set button icons */
   button_edit_shape.button(
      { text: false, icons: { primary: "ui-icon-wrench" } }
   );
   button_edit_attributes.button(
      { text: false, icons: { primary: "ui-icon-tag" } }
   );
   button_trash.button(
      { text: false, icons: { primary: "ui-icon-trash" } }
   );
   /* FIXME: disable edit attribute button */
   button_edit_attributes.button("option", "disabled", true);
   /* create button container */
   var buttons_div = $('<div class="region-buttons"></div>');
   /* place buttons within container */
   buttons_div.append(button_edit_shape);
   buttons_div.append(button_edit_attributes);
   buttons_div.append(button_trash);
   return buttons_div;
}

/**
 * Create and return a DOM element containing a section for region details.
 *
 * @returns {object} DOM div element for region details
 */
RegionPanel.createRegionDetails = function() {
   /* FIXME: create elements for displaying region details */
   /* create container for region details */
   var details_div = $('<div class="region-details">FIXME: Details</div>');
   /* FIXME: place elements within container */
   return details_div;
}

/**
 * Create and return a DOM element containing a box for region data.
 *
 * @returns {object} DOM div element for region box
 */
RegionPanel.createRegionBox = function() {
   /* create region details show/hide control widget */
   var details_control = $(
      '<span ' +
         'class="region-icon-details" ' +
         'title="Show Details">' +
      '</span>'
   );
   /* set icon for details show/hide widget */
   details_control.addClass("ui-icon ui-icon-triangle-1-e")
   /* create input box for region name */
   var name_input = $('<input class="region-name"/>');
   /* create region editing buttons */
   var buttons_div = RegionPanel.createRegionButtons();
   /* create region details section (make hidden by default) */
   var details_div = RegionPanel.createRegionDetails();
   details_div.addClass("hidden");
   /* create region box */
   var box_div = $('<div class="region-box"></div>');
   /* place components in box */
   box_div.append(details_control);
   box_div.append(name_input);
   box_div.append(buttons_div);
   box_div.append(details_div);
   return box_div;
}

/**
 * Create and return a DOM element containing an (empty) region list.
 *
 * @param   {string} prefix prefix for segmentation containing regions in list
 * @returns {object}        DOM ul element for an empty region list.
 */
RegionPanel.createRegionList = function(prefix) {
   /* create empty region list */
   var region_list = $(
      '<ul class="region-list ' + prefix + '-region-list"></ul>'
   );
   /* make region list sortable and connected with other region lists */
   region_list.sortable(
      {
         connectWith: ("." + prefix + "-region-list"),
         handle:      ".region-icon-move",
         helper:      "original",
         items:       "li:not(.ui-state-disabled)"
      }
   );
   return region_list;
}

/**
 * Create and return a DOM element for a complete region entry.
 * This is a list element containing all UI controls for the region.
 *
 * @param   {string} prefix prefix for segmentation containing region
 * @returns {object}        DOM li element for a region.
 */
RegionPanel.createRegionEntry = function(prefix) {
   /* create move control */
   var move_control = $(
      '<span ' +
         'class="region-icon-move" ' +
         'title="Drag to Move Region">' +
      '</span>'
   );
   /* set icon for move control */
   move_control.addClass("ui-icon ui-icon-arrowthick-2-n-s");
   /* create expand toggle control */
   var expand_control = $(
      '<span ' +
         'class="region-icon-expand" ' +
         'title="Expand Subregions">' +
      '</span>'
   );
   /* set icon for expand control */
   expand_control.addClass("ui-icon ui-icon-plus");
   /* create region box */
   var box_div = RegionPanel.createRegionBox();
   /* create subregion list (make hidden by default) */
   var subregion_list = RegionPanel.createRegionList(prefix);
   subregion_list.addClass("hidden");
   /* create and style region entry */
   var region_entry = $('<li class="region-entry"></li>');
   region_entry.addClass("ui-corner-all");
   /* place components in region entry */
   region_entry.append(move_control);
   region_entry.append(expand_control);
   region_entry.append(box_div);
   region_entry.append(subregion_list);
   return region_entry;
}

/*****************************************************************************
 * Region panel user interface DOM element modification.
 *****************************************************************************/

/**
 * Fill the specified details section with the details of the given region.
 *
 * @param {object} details_div DOM div element for region details
 * @param {Region} reg         region data
 */
RegionPanel.fillRegionDetails = function(details_div, reg) {
   /* FIXME */
}

/**
 * Fill the specified region entry with the information (name and details)
 * of the given region object.
 *
 * Only the specified entry is modified; subregions are not touched.
 *
 * @param {object} region_entry DOM li element for region
 * @param {Region} reg          region data
 */
RegionPanel.fillRegionEntry = function(region_entry, reg) {
   /* lookup box containing region information display */
   var box_div = region_entry.children(".region-box");
   /* lookup name field and details section within box */
   var name_input  = box_div.children(".region-name");
   var details_div = box_div.children(".region-details");
   /* get region attributes */
   var reg_attribs = reg.getRegionAttributes();
   /* update display to reflect attributs */
   if (reg_attribs != null) {
      /* get region name and color */
      var name  = reg_attribs.getName();
      var color = reg_attribs.getColor();
      /* display name and color */
      name_input.val(name);
      box_div.css(
         'border-color',
         'rgb(' +
            Math.round(255*color[0]) + ',' +
            Math.round(255*color[1]) + ',' +
            Math.round(255*color[2]) +
         ')'
      );
   }
   /* fill region details */
   RegionPanel.fillRegionDetails(details_div, reg);
}

/**
 * Attach event handlers to the specified region entry.
 * This couples the region entry to the region panel.
 *
 * @param {object} region_entry DOM li element for region
 */
RegionPanel.prototype.attachRegionEntryEvents = function(region_entry) {
   /* setup event handlers for region edit buttons */
   $(".region-edit-shape-button", region_entry).click(
      $.proxy(this.handleRegionEdit, this)
   );
   $(".region-edit-attributes-button", region_entry).click(
      $.proxy(this.handleRegionEdit, this)
   );
   /* setup event handlers for region delete button */
   $(".region-trash-button", region_entry).click(
      $.proxy(this.handleRegionDelete, this)
   );
   /* setup event handlers for region rename */
   $(".region-name", region_entry).change(
      $.proxy(this.handleRegionRename, this)
   );
   /* setup event handlers for region selection */
   $(".region-box", region_entry).mouseenter(
      $.proxy(this.handleSelect, this)
   );
   $(".region-box", region_entry).mouseleave(
      $.proxy(this.handleDeselect, this)
   );
   /* setup event handlers for region view manipulation */
   $(".region-icon-details", region_entry).click(
      $.proxy(this.handleToggleDetails, this)
   );
   $(".region-icon-expand", region_entry).click(
      $.proxy(this.handleToggleExpand, this)
   );
   /* setup entry sorting event handlers */
   $(".region-icon-move", region_entry)
      .mousedown($.proxy(this.handleRegionMoveStart, this))
      .mouseup($.proxy(this.handleRegionMoveStop, this));
   /* setup list sorting event handlers */
   $(".region-list", region_entry)
      .bind("sortbeforestop", $.proxy(this.handleRegionMoveStop, this))
      .bind("sortupdate",     $.proxy(this.handleRegionMove, this));
}

/*****************************************************************************
 * Region panel creation.
 *****************************************************************************/

/**
 * Initialize user interface elements.
 */
RegionPanel.prototype.initUI = function() {
   /* get region tree pane and container */
   var region_tree_pane      = $("#region-tree-pane", this.div);
   var region_tree_container = $("#region-tree-container", this.div);
   /* intialize region tree slider */
   $("#region-tree-slider", this.div)
      .slider(
         { animate: false, orientation: "vertical",
           min: 0, max: 1, step: 0.01, value: 1 }
      )
      .bind("slide",
         function(event, ui) {
            /* get height of region pane and container */
            var h_pane      = region_tree_pane.height();
            var h_container = region_tree_container.height();
            /* offset container height by scroll amount */
            if (h_container > h_pane) {
               region_tree_container.css(
                  "top",
                  Math.round((1.0 - ui.value) * (h_pane - h_container)) + "px"
               );
            } else {
               region_tree_container.css("top", 0);
            }
         }
      );
   /* get root region list */
   var region_list_root = $("#region-list-root", this.div);
   /* set segmentation prefix on root region list */
   var prefix = this.div.data("prefix");
   region_list_root.addClass(prefix + "-region-list");
   /* make root region list sortable */
   region_list_root.sortable(
      {
         /* properties and connections */
         connectWith: ("." + prefix + "-region-list"),
         handle:      ".region-icon-move",
         helper:      "original",
         items:       "li:not(.ui-state-disabled)",
         /* sorting event handlers */
         beforeStop:  $.proxy(this.handleRegionMoveStop, this),
         update:      $.proxy(this.handleRegionMove, this)
      }
   );
   /* initialize region creation and merge buttons */
   $("#region-create-button", this.div).button();
   $("#region-merge-button", this.div).button({ disabled: true });
   /* setup event handlers - region creation and merge */
   $("#region-create-button", this.div).click(
      $.proxy(this.handleRegionCreate, this)
   );
   $("#region-merge-button", this.div).click(
      $.proxy(this.handleRegionMerge, this)
   );
   /* make region panel resizeable */
   this.div.resizable();
}

/*****************************************************************************
 * Region panel control.
 *****************************************************************************/

/**
 * Hide the panel.
 *
 * @param {object} duration animation duration (optional)
 */
RegionPanel.prototype.hide = function(duration) {
   if (typeof(duration) != "undefined") {
      Panel.hide(this.div, duration);
   } else {
      Panel.hide(this.div);
   }
}

/**
 * Show the panel.
 *
 * @param {object} duration animation duration (optional)
 */
RegionPanel.prototype.show = function(duration) {
   if (typeof(duration) != "undefined") {
      Panel.show(this.div, duration);
   } else {
      Panel.show(this.div);
   }
}

/*****************************************************************************
 * Region tree manipulation.
 *****************************************************************************/

/**
 * Clear the displayed region tree.
 */
RegionPanel.prototype.clear = function() {
   /* remove all regions from the root region list */
   $("#region-list-root", this.div).children().remove();
   /* clear the region id -> region entry map */
   this.region_entry_map = [];
}

/**
 * Load the specified segmentation.
 * Replace any existing region display with that for the given segmentation.
 *
 * @param {Segmentation} seg segmentation to load
 */
RegionPanel.prototype.loadSegmentation = function(seg) {
   /* load the subtree rooted at the specified region into the region list */
   function loadSubtree(reg, region_list) {
      /* check that subtree is non-empty */
      if ((reg != null) && (reg.hasChildRegions())) {
         /* extract child region (index, rank) pairs */
         var child_regions = reg.getChildRegions();
         var n_children = child_regions.length;
         var child_info = new Array(n_children);
         for (var n = 0; n < n_children; ++n) {
            var r = child_regions[n];
            child_info[n] = { index: n, rank: r.rank };
         }
         /* sort child regions in ascending order by rank */
         ArrUtil.sort(child_info, function(a,b){return a.rank - b.rank;});
         /* load children into region list */
         var prefix = this.div.data("prefix");
         for (var n = 0; n < n_children; ++n) {
            /* get current child region */
            var r = child_regions[child_info[n].index];
            /* create entry for child region */
            var r_entry = RegionPanel.createRegionEntry(prefix);
            RegionPanel.fillRegionEntry(r_entry, r);
            /* store region id <-> region entry mapping */
            var r_id = r.getRegionId();
            this.region_entry_map[r_id] = r_entry;
            r_entry.data("reg-id", "" + r_id);
            /* attach event handlers */
            this.attachRegionEntryEvents(r_entry);
            /* recursively load child subtree */
            var r_list = r_entry.children(".region-list");
            loadSubtree.call(this, r, r_list);
            /* attach child region to parent list */
            region_list.append(r_entry);
         }
      }
   }
   /* clear any existing region tree */
   this.clear();
   /* initialize the region id -> region entry map */
   this.region_entry_map = new Array(seg.countRegions());
   /* load the segmentation root node's subtree */
   var region_list_root = $("#region-list-root", this.div);
   loadSubtree.call(this, seg.getRootRegion(), region_list_root);
}

/**
 * Reassign the id of a region.
 * Update the associated region entry to reflect the change.
 *
 * @param {int} r_id     current region id
 * @param {int} r_id_new desired region id
 */
RegionPanel.prototype.reassignRegionId = function(r_id, r_id_new) {
   /* lookup region entry */
   var region_entry = this.region_entry_map[r_id];
   /* update id stored in entry */
   region_entry.data("reg-id", "" + r_id_new);
   /* update id -> entry mapping */
   this.region_entry_map[r_id_new] = region_entry;
}

/**
 * Refresh the information displayed for the specified region.
 *
 * @param {Region} reg region to refresh
 */
RegionPanel.prototype.refreshRegion = function(reg) {
   /* lookup associated region entry */
   var region_entry = this.region_entry_map[reg.getRegionId()];
   /* copy region info into region entry */
   RegionPanel.fillRegionEntry(region_entry, reg);
}

/*****************************************************************************
 * Event callback binding.
 *****************************************************************************/

/**
 * Bind callback function for region creation event.
 * This event occurs when the user clicks to create a new region.
 *
 * This function must take the following form:
 *    reg = callback() { ... }
 * returns:
 *    {Region} reg is the created region
 *
 * @param   {function}    callback region creation event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindRegionCreate = function(callback) {
   this.callback_region_create = callback;
   return this;
}

/**
 * Bind callback function for region deletion event.
 * This event occurs when the user clicks to delete a region.
 *
 * This function must take the following form:
 *    callback(r_id) { ... }
 * where:
 *    {int} r_id is the id of the region to delete
 *
 * @param   {function}    callback region deletion event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindRegionDelete = function(callback) {
   this.callback_region_delete = callback;
   return this;
}

/**
 * Bind callback function for region merge event.
 * This event occurs when the user clicks to merge multiple regions.
 *
 * This function must take the following form:
 *    reg = callback(r_ids) { ... }
 * where:
 *    {array} r_ids is the list of region ids to merge
 * returns:
 *    {Region} reg is the merged region
 *
 * @param   {function}    callback region merge event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindRegionMerge = function(callback) {
   this.callback_region_merge = callback;
   return this;
}

/**
 * Bind callback function for region move request event.
 * This event occurs when the user changes a region's position in the tree.
 *
 * This callback must take the id of the region being moved and return a
 * list of region ids that are the acceptable destination parent regions.
 *
 * If no callback function is bound, all moves are allowed.
 *
 * This function must take the following form:
 *    parent_ids = callback(r_id) { ... }
 * where:
 *    {int} r_id is the id of the region being moved
 * returns:
 *    {array} parent_ids are the ids of the acceptable parent regions
 *
 * @param   {function}    callback region move request event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindRegionMoveRequest = function(callback) {
   this.callback_region_move_req = callback;
   return this;
}

/**
 * Bind callback function for move event.
 * This event occurs when the user moves a region.
 *
 * This function must take the following form:
 *    callback(r_id, r_parent_id, rank) { ... }
 * where:
 *    {int} r_id        is the id of the region being moved
 *    {int} r_parent_id is the parent region id after the move (null for root)
 *    {int} rank        is the rank of the region with respect to its siblings
 *
 * @param   {function}    callback region move event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindRegionMove = function(callback) {
   this.callback_region_move = callback;
   return this;
}

/**
 * Bind callback function for region edit event.
 * This event occurs when the user clicks one of the region editing buttons.
 *
 * This function must take the following form:
 *    callback(r_id, mode) { ... }
 * where:
 *    {int}    r_id is the id of the region to edit
 *    {string} mode is the requested editing mode ("shape" or "attributes")
 *
 * @param   {function}    callback region edit event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindRegionEdit = function(callback) {
   this.callback_region_edit = callback;
   return this;
}

/**
 * Bind callback function for region rename event.
 * This event occurs when the user updates the region name text box.
 *
 * This function must take the following form:
 *    callback(r_id, name) { ... }
 * where:
 *    {int}    r_id is the id of the region to rename
 *    {string} name is the name to assign the region
 *
 * @param   {function}    callback region rename event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindRegionRename = function(callback) {
   this.callback_region_rename = callback;
   return this;
}

/**
 * Bind callback function for subtree expansion toggle event.
 * This event occurs when the user toggles the expansion state of a region.
 *
 * This function must take the following form:
 *    callback(r_id, state) { ... }
 * where:
 *    {int}  r_id  is the id of the region at the root of the subtree
 *    {bool} state (true/false) indicates whether to expand the region
 *
 * @param   {function}    callback expansion toggle event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindToggleExpand = function(callback) {
   this.callback_toggle_expand = callback;
   return this;
}

/**
 * Bind callback function for region selection toggle event.
 * This event occurs when the user hovers over or selects a region.
 *
 * This function must take the following form:
 *    callback(r_id, state) { ... }
 * where:
 *    {int}  r_id  is the id of the target region
 *    {bool} state (true/false) indicates whether to select the region
 *
 * @param   {function}    callback selection toggle event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindToggleSelect = function(callback) {
   this.callback_toggle_select = callback;
   return this;
}

/**
 * Bind callback function for region panel resize event.
 * This event occurs when the user resizes the region panel.
 *
 * This function must take the following form:
 *    callback() { ... }
 *
 * @param   {function}    callback panel resize event callback
 * @returns {RegionPanel}          region panel (for chaining)
 */
RegionPanel.prototype.bindResize = function(callback) {
   this.callback_resize = callback;
   return this;
}

/*****************************************************************************
 * Event handlers.
 *****************************************************************************/

/**
 * Handle region creation event.
 */
RegionPanel.prototype.handleRegionCreate = function() {
   /* get segmentation prefix for region group */
   var prefix = this.div.data("prefix");
   /* create a blank region entry */
   var region_entry = RegionPanel.createRegionEntry(prefix);
   /* trigger user callback to retrieve data for new region */
   if (this.callback_region_create != null) {
      /* create region */
      var reg = this.callback_region_create();
      /* fill entry with region info */
      RegionPanel.fillRegionEntry(region_entry, reg);
   }
   /* assign region entry next available id */
   var r_id = this.region_entry_map.length;
   region_entry.data("reg-id", "" + r_id);
   this.region_entry_map[r_id] = region_entry;
   /* attach event handlers */
   this.attachRegionEntryEvents(region_entry);
   /* append region to the root region list */
   $("#region-list-root", this.div).append(region_entry);
}

/**
 * Handle region deletion event.
 *
 * @param {Event} event jquery event
 */
RegionPanel.prototype.handleRegionDelete = function(event) {
   /* get region entry to delete */
   var region_entry = $(event.target).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* trigger user callback to delete region */
   if (this.callback_region_delete != null)
      this.callback_region_delete(r_id);
   /* reassign the last region to replace the deleted region */
   var r_id_last = this.region_entry_map.length - 1;
   this.reassignRegionId(r_id_last, r_id);
   --(this.region_entry_map.length);
   /* detach child region entries */
   var subregion_list = region_entry.children(".region-list");
   var subregions = subregion_list.children(".region-entry");
   subregions.detach();
   /* get position of region to delete in parent subregion list */
   var parent_list = region_entry.closest(".region-list");
   var rank = region_entry.index();
   /* remove region entry */
   region_entry.remove();
   /* insert child region entries into parent subregion list */
   if (parent_list.children().length == 0) {
      /* parent list is empty - append subregions */
      parent_list.append(subregions);
   } else if (rank == 0) {
      /* removed region was first in list - insert subregions at start */
      var r = parent_list.children().get(0);
      $(r).before(subregions);
   } else {
      /* insert subregions after region preceding the removed one */
      var r = parent_list.children().get(rank-1);
      $(r).after(subregions);
   }
}

/**
 * Handle region merge event.
 */
RegionPanel.prototype.handleRegionMerge = function() {
   /* FIXME */
   alert("region merge not implemented");
}

/**
 * Handle region move start event.
 *
 * @param {Event} event jquery event
 */
RegionPanel.prototype.handleRegionMoveStart = function(event) {
   /* get region entry being moved */
   var region_entry = $(event.target).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* check if move restriction callback exists */
   if (this.callback_region_move_req != null) {
      /* trigger user callback to get list of acceptable destinations */
      var parent_ids = this.callback_region_move_req(r_id);
      /* determine which destination lists to allow */
      var n_regions = this.region_entry_map.length;
      var allow = new Array(n_regions);
      for (var n = 0; n < n_regions; ++n)
         allow[n] = false;
      for (var n = 0; n < parent_ids.length; ++n)
         allow[parent_ids[n]] = true;
      /* disable unallowed destination region lists */
      for (var n = 0; n < n_regions; ++n) {
         if (!(allow[n])) {
            /* get subregion list associated with region entry */
            var r_entry = this.region_entry_map[n];
            var r_list = r_entry.children(".region-list");
            /* disable sortability */
            r_list.sortable("option", "disabled", true);
            /* visually indicate invalid drop target */
            r_entry.addClass("region-disabled");
         }
      }
   }
}

/**
 * Handle region move stop event.
 */
RegionPanel.prototype.handleRegionMoveStop = function() {
   /* restore sortability of all region lists */
   for (var n = 0; n < this.region_entry_map.length; ++n) {
      /* get subregion list associated with region entry */
      var r_entry = this.region_entry_map[n];
      var r_list = r_entry.children(".region-list");
      /* enable sortability */
      r_list.sortable("option", "disabled", false);
      /* visually indicate sortability */
      r_entry.removeClass("region-disabled");
   }
}

/**
 * Handle region move event.
 *
 * @param {Event}  event jquery event
 * @param {object} ui    jquery ui data
 */
RegionPanel.prototype.handleRegionMove = function(event, ui) {
   /* determine identity of moved region */
   var region_entry = $(ui.item).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* determine updated parent of region */
   var region_list = region_entry.parent();
   var parent_id =
      (region_list.is("#region-list-root")) ?
         null : parseInt(region_list.closest(".region-entry").data("reg-id"));
   /* determine rank order of region within parent list */
   var rank = region_entry.index();
   /* trigger user callback for move */
   if (this.callback_region_move != null)
      this.callback_region_move(r_id, parent_id, rank);
}

/**
 * Handle region edit event.
 *
 * @param {Event} event jquery event
 */
RegionPanel.prototype.handleRegionEdit = function(event) {
   /* get region entry to edit */
   var region_entry = $(event.target).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* get requested editing mode */
   var mode = $(event.target).data("mode");
   /* trigger user callback for editing region */
   if (this.callback_region_edit != null)
      this.callback_region_edit(r_id, mode);
}

/**
 * Handle region rename event.
 *
 * @param {Event} event jquery event
 */
RegionPanel.prototype.handleRegionRename = function(event) {
   /* get region entry to rename */
   var region_entry = $(event.target).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* get updated name */
   var name = $(event.target).val();
   /* trigger user callback for renaming region */
   if (this.callback_region_rename != null)
      this.callback_region_rename(r_id, name);
}

/**
 * Handle toggle region details event.
 *
 * @param {Event} event jquery event
 */
RegionPanel.prototype.handleToggleDetails = function(event) {
   /* get region entry containing details to toggle */
   var region_entry = $(event.target).closest(".region-entry");
   /* get details div and toggle control */
   var box_div         = region_entry.children(".region-box");
   var details_div     = box_div.children(".region-details");
   var details_control = box_div.children(".region-icon-details");
   /* toggle details section visibility */
   details_div.toggleClass("hidden");
   /* toggle details show/hide icon and tooltip */
   details_control.toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s");
   if (details_div.hasClass("hidden")) {
      details_control.prop("title", "Show Details");
   } else {
      details_control.prop("title", "Hide Details");
   }
}

/**
 * Handle toggle subtree expansion event.
 *
 * @param {Event} event jquery event
 */
RegionPanel.prototype.handleToggleExpand = function(event) {
   /* get region entry to expand/collapse */
   var region_entry = $(event.target).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* get subregion list and expansion control */
   var subregion_list = region_entry.children(".region-list");
   var expand_control = region_entry.children(".region-icon-expand");
   /* get current hidden state (equivalent to desired expansion state) */
   var state = subregion_list.hasClass("hidden");
   /* trigger user callback for updated expansion state */
   if (this.callback_toggle_expand != null)
      this.callback_toggle_expand(r_id, state);
   /* toggle subregion list visibility */
   subregion_list.toggleClass("hidden");
   /* toggle expansion icon and tooltip */
   expand_control.toggleClass("ui-icon-minus ui-icon-plus");
   if (state) {
      expand_control.prop("title", "Collapse Subregions");
   } else {
      expand_control.prop("title", "Expand Subregions");
   }
}

/**
 * Handle region selection event.
 */
RegionPanel.prototype.handleSelect = function(event) {
   /* get region entry to select */
   var region_entry = $(event.target).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* update background color */
   var box_div = region_entry.children(".region-box");
   box_div.css("background", box_div.css("border-top-color"));
   /* trigger user callback */
   if (this.callback_toggle_select != null)
      this.callback_toggle_select(r_id, true);
}

/**
 * Handle region deselection event.
 */
RegionPanel.prototype.handleDeselect = function(event) {
   /* get region entry to select */
   var region_entry = $(event.target).closest(".region-entry");
   var r_id = parseInt(region_entry.data("reg-id"));
   /* update background color */
   var box_div = region_entry.children(".region-box");
   if (!(box_div.hasClass("box-hold"))) {
      box_div.css("background", "");
   }
   /* trigger user callback */
   if (this.callback_toggle_select != null)
      this.callback_toggle_select(r_id, false);
}

/**
 * Handle panel resize event.
 */
RegionPanel.prototype.handleResize = function(event, ui) {
   /* FIXME */
}
