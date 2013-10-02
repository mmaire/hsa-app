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
 * Attribute panel user interface.
 */

/*****************************************************************************
 * Constructor.
 *****************************************************************************/

/**
 * Attribute panel constructor.
 *
 * @class Attribute panels provide interface functionality for attribute
 *        selection and visualization.
 *
 * @constructor
 * @param {object} div DOM element for attribute panel
 */
function AttributePanel(div) {
   /* store panel document element */
   this.div = div;
   /* initialize callbacks */
   this.callback_family_hide = null; /* user callback for family hide event */
   this.callback_family_show = null; /* user callback for family show event */
   this.callback_groups_hide = null; /* user callback for groups hide event */
   this.callback_groups_show = null; /* user callback for groups show event */
   this.callback_attribute   = null; /* user callback for attribute select */
   /* initialize ui */
   this.initUI();
}

/*****************************************************************************
 * Attribute panel user interface DOM element creation.
 *****************************************************************************/

/**
 * Create and return a DOM element for the header section (title and toggle)
 * of the specified pixel attribute group.
 *
 * @param   {int}    group group id
 * @returns {object}       DOM div element for header
 */
AttributePanel.createGroupHeader = function(group) {
   /* create title and toggle divs */
   var title_div  = AttributePanel.createGroupTitle(group);
   var toggle_div = AttributePanel.createGroupToggle(group);
   /* create header div */
   var header_div = $('<div class="attribute-group-header"></div>');
   /* place toggle and title within header */
   header_div.append(title_div);
   header_div.append(toggle_div);
   return header_div;
}

/**
 * Create and return a DOM element for the title of the specified pixel
 * attribute group.
 *
 * @param   {int}    group  group id
 * @returns {object}        DOM div element for title
 */
AttributePanel.createGroupTitle = function(group) {
   /* lookup attribute group info */
   var name = PixelAttributes.getGroupName(group);
   /* create title div */
   var title_div = $('<div class="attribute-group-title">' + name + '</div>');
   return title_div;
}

/**
 * Create and return a DOM element for the show/hide toggle control of the
 * specified pixel attribute group.
 *
 * @param   {int}    group  group id
 * @returns {object}        DOM div element containing toggle control
 */
AttributePanel.createGroupToggle = function(group) {
   /* lookup attribute group info */
   var name   = PixelAttributes.getGroupName(group);
   var family = PixelAttributes.getGroupFamily(group);
   /* create toggle anchor */
   var anchor = $(
      '<a ' +
         'id="attribute-group-toggle-anchor-' + family + '-' + group + '" ' +
         'class="attribute-group-toggle-anchor" ' +
         'data-family="' + family + '" ' +
         'data-group="'  + group  + '">' + 'Hide' +
      '</a>'
   );
   /* create toggle div */
   var toggle_div = $('<div class="attribute-group-toggle"></div>');
   toggle_div.append(anchor);
   return toggle_div;
}

/**
 * Create and return a DOM element for the buttons container of the specified
 * pixel attribute group.
 *
 * @param   {string} prefix prefix for button input elements
 * @param   {int}    group  group id
 * @returns {object}        DOM div element for button container
 */
AttributePanel.createGroupButtonsContainer = function(prefix, group) {
   /* create buttons */
   var buttons_div = AttributePanel.createGroupButtons(prefix, group);
   /* create container div */
   var buttons_container_div = $(
      '<div class="attribute-buttons-container"></div>'
   );
   /* place buttons within container */
   buttons_container_div.append(buttons_div);
   return buttons_container_div;
}

/**
 * Create and return a DOM element for the button set of the specified pixel
 * attribute group.
 *
 * @param   {string} prefix prefix for button input elements
 * @param   {int}    group  group id
 * @returns {object}        DOM div element for button set
 */
AttributePanel.createGroupButtons = function(prefix, group) {
   /* lookup attribute group info */
   var attribs = PixelAttributes.getGroupAttribs(group);
   var family  = PixelAttributes.getGroupFamily(group);
   /* create button columns */
   var col_left = $(
      '<div ' +
         'id="attribute-buttons-' + family + '-' + group + '-left" ' +
         'class="attribute-buttons-column">' +
      '</div>'
   );
   var col_right = $(
      '<div ' +
         'id="attribute-buttons-' + family + '-' + group + '-right" ' +
         'class="attribute-buttons-column">' +
      '</div>'
   );
   /* create button for each attribute */
   var nl = Math.ceil(attribs.length / 2);
   var nr = Math.floor(attribs.length / 2);
   var buttons_left  = new Array(nl);
   var buttons_right = new Array(nr);
   for (var n = 0; n < nl; ++n) {
      buttons_left[n] =
         AttributePanel.createAttributeButton(prefix, group, attribs[n]);
      col_left.append(buttons_left[n]);
   }
   for (var n = 0; n < nr; ++n) {
      buttons_right[n] =
         AttributePanel.createAttributeButton(prefix, group, attribs[nl+n]);
      col_right.append(buttons_right[n]);
   }
   /* buttonize */
   col_left.buttonset();
   col_right.buttonset();
   /* set rounded corners on buttons */
   if (nl > 0) {
      /* get corner buttons */
      var tl = buttons_left[0];
      var tr = (nr > 0) ? buttons_right[0] : tl;
      var bl = buttons_left[nl-1];
      var br = (nr > 0) ? buttons_right[nr-1] : bl;
      /* round corners */
      tl.find("label")
         .removeClass("ui-corner-left")
         .addClass("ui-corner-tl");
      tr.find("label")
         .removeClass("ui-corner-left")
         .addClass("ui-corner-tr");
      bl.find("label")
         .removeClass("ui-corner-right")
         .addClass("ui-corner-bl");
      br.find("label")
         .removeClass("ui-corner-right")
         .addClass("ui-corner-br");
      /* round extra corner if needed */
      if (nl > nr)
         bl.find("label").addClass("ui-corner-br");
   }
   /* create containing div */
   var buttons_div = $(
      '<div ' +
         'id="attribute-buttons-' + family + '-' + group + '" ' +
         'class="attribute-buttons">' +
      '</div>'
   );
   /* place button columns within div */
   buttons_div.append(col_left);
   buttons_div.append(col_right);
   return buttons_div;
}

/**
 * Create and return a DOM element containing a button for the specified
 * pixel attribute.  Both the attribute's id and its group id are required.
 *
 * @param   {string} prefix prefix for button input elements
 * @param   {int}    group  group id
 * @param   {int}    attrib attribute id
 * @returns {object}        DOM div element for button
 */
AttributePanel.createAttributeButton = function(prefix, group, attrib) {
   /* lookup attribute info */
   var name   = PixelAttributes.getAttribName(attrib);
   var desc   = PixelAttributes.getAttribDescription(attrib);
   var color  = PixelAttributes.getAttribColor(attrib);
   var family = PixelAttributes.getGroupFamily(group);
   /* create input element */
   var input = $(
      '<input ' +
         'name="' + prefix + '-select-' + family + '" ' +
         'type="radio" ' +
         'value="' + attrib + '" ' +
         'data-family="' + family + '" ' +
         'data-group="'  + group  + '" ' +
         'data-attrib="' + attrib + '" ' +
         'id="' + prefix +'-button-'
            + family + '-' + group + '-' + attrib + '" ' +
         'class="attribute-button"' +
      '/>'
   );
   /* create label element */
   var label = $(
      '<label ' +
         'class="attribute-label" ' +
         'for="' + prefix + '-button-'
            + family + '-' + group + '-' + attrib + '" ' +
         'title="' + desc + '">' + name +
      '</label>'
   );
   /* color label element */
   label.css(
      'color',
      'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')'
   );
   /* create containing div */
   var button_div = $('<div></div>');
   /* place input and label within div */
   button_div.append(input);
   button_div.append(label);
   return button_div;
}

/*****************************************************************************
 * Attribute panel initialization.
 *****************************************************************************/

/**
 * Initialize user interface elements.
 */
AttributePanel.prototype.initUI = function() {
   /* get attribute name prefix */
   var prefix = this.div.data("prefix");
   /* create attribute accordian family titles */
   $(".attribute-family-title", this.div).each(
      function(index, element) {
         /* get attribute family */
         var family = parseInt($(element).data("family"));
         $(element).html(PixelAttributes.getFamilyName(family));
      }
   );
   /* create attribute family controls */
   $(".attribute-family", this.div).each(
      function(index, element) {
         /* get attribute family */
         var family = parseInt($(element).data("family"));
         /* get attribute groups to display */
         var groups_str = $(element).data("groups") + "";
         var groups_str_list = groups_str.split(" ");
         /* create controls for each group */
         for (var n = 0; n < groups_str_list.length; ++n) {
            /* get group id */
            var group = parseInt(groups_str_list[n]);
            /* create group header and buttons */
            var header_div =
               AttributePanel.createGroupHeader(group);
            var buttons_container_div =
               AttributePanel.createGroupButtonsContainer(prefix, group);
            /* place group controls within family element */
            $(element).append($('<hr/>'));
            $(element).append(header_div);
            $(element).append(buttons_container_div);
         }
         /* check leading attribute button in leading group */
         if (groups_str_list.length > 0) {
            /* get leading group id */
            var group = parseInt(groups_str_list[0]);
            /* find buttons for leading group */
            var buttons_div = $(
               "#attribute-buttons-" + family + "-" + group, $(element)
            );
            /* check leading attribute button */
            var input =  $("input:first", buttons_div);
            input.prop("checked", true);
            input.button("refresh");
         }
      }
   );
   /* setup event handlers - attribute group toggle */
   $(".attribute-group-toggle-anchor", this.div).click(
      $.proxy(this.handleGroupToggle, this)
   );
   /* setup event handlers - attribute button click */
   $(".attribute-button", this.div).click(
      $.proxy(this.handleAttributeSelect, this)
   );
   /* setup attribute accordion */
   $("#attribute-accordion", this.div).accordion(
      {
         animated:    "slide",
         autoHeight:  false,
         collapsible: false,
         navigation:  true,
         changestart: $.proxy(this.handleFamilyChangeStart, this),
         change:      $.proxy(this.handleFamilyChange, this)
      }
   );
}

/*****************************************************************************
 * Attribute panel control.
 *****************************************************************************/

/**
 * Hide the panel.
 *
 * @param {object} duration animation duration (optional)
 */
AttributePanel.prototype.hide = function(duration) {
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
AttributePanel.prototype.show = function(duration) {
   if (typeof(duration) != "undefined") {
      Panel.show(this.div, duration);
   } else {
      Panel.show(this.div);
   }
}

/*****************************************************************************
 * Attribute control.
 *****************************************************************************/

/**
 * Get active family.
 *
 * This is the attribute family visible in the open section on the interface.
 *
 * @returns {int} family id
 */
AttributePanel.prototype.getFamily = function() {
   /* get attribute accordion */
   var attrib_accordion = $("#attribute-accordion", this.div);
   /* get family section number */
   var family_num = attrib_accordion.accordion("option", "active");
   /* get document element for open family */
   var family_div = $(
      ".attribute-family:eq(" + family_num + ")", attrib_accordion
   );
   /* get family id */
   return parseInt(family_div.data("family"));
}

/**
 * Get list of active attribute groups in the specified family.
 *
 * These are the groups whose attribute buttons are currently visible in the
 * section for the specified family on the interface panel.  If no family is
 * specified, then return the groups visible in the currently open section.
 *
 * @param   {int}   family family id (default: use open family)
 * @returns {array}        ids of visible attribute groups
 */
AttributePanel.prototype.getGroups = function(family) {
   /* default arguments */
   family = (typeof(family) != "undefined") ? family : this.getFamily();
   /* get attribute accordion */
   var attrib_accordion = $("#attribute-accordion", this.div);
   /* get document element for specified family */
   var family_div = $(
      ".attribute-family[data-family=" + family + "]", attrib_accordion
   );
   /* get groups in family */
   var groups_str = family_div.data("groups") + "";
   var groups_str_list = groups_str.split(" ");
   /* check if buttons in each group are visible */
   var groups_visible = new Array(groups_str_list.length);
   var pos = 0;
   for (var n = 0; n < groups_str_list.length; ++n) {
      /* get group id */
      var group = parseInt(groups_str_list[n]);
      /* find group buttons */
      var buttons_div = $(
         "#attribute-buttons-" + family + "-" + group, family_div
      );
      /* check if visible */
      if (buttons_div.is(":visible"))
         groups_visible[pos++] = group;
   }
   groups_visible.length = pos;
   return groups_visible;
}

/**
 * Get active attribute in the specified family.
 *
 * If no family is specified, use the currently open section.  Note that the
 * group of the selected attribute may be hidden (if the user clicked the
 * attribute button and then hid the group).
 *
 * @param   {int} family family id (default: use open family)
 * @returns {int}        id of selected attribute
 */
AttributePanel.prototype.getAttribute = function(family) {
   /* default arguments */
   family = (typeof(family) != "undefined") ? family : this.getFamily();
   /* get attribute accordion */
   var attrib_accordion = $("#attribute-accordion", this.div);
   /* get document element for specified family */
   var family_div = $(
      ".attribute-family[data-family=" + family + "]", attrib_accordion
   );
   /* get attribute name prefix */
   var prefix = this.div.data("prefix");
   /* get selected attribute button */
   var input = $(
      "input:radio[name=" + prefix + "-select-" + family + "]:checked",
      family_div
   );
   return parseInt(input.data("attrib"));
}

/*****************************************************************************
 * Event callback binding.
 *****************************************************************************/

/**
 * Bind callback function for attribute family hide event.
 * This event occurs at the start of a family section switch.
 *
 * This function must take the following form:
 *    callback() { ... }
 *
 * @param   {function}       callback hide family event callback
 * @returns {AttributePanel}          attribute panel (for chaining)
 */
AttributePanel.prototype.bindFamilyHide = function(callback) {
   this.callback_family_hide = callback;
   return this;
}

/**
 * Bind callback function for attribute family show event.
 * This event occurs at the end of a family section switch.
 *
 * This function must take the following form:
 *    callback() { ... }
 *
 * @param   {function}       callback show family event callback
 * @returns {AttributePanel}          attribute panel (for chaining)
 */
AttributePanel.prototype.bindFamilyShow = function(callback) {
   this.callback_family_show = callback;
   return this;
}

/**
 * Bind callback function for attribute group(s) hide event.
 *
 * This function must take the following form:
 *    callback(groups) { ... }
 * where:
 *    {array} groups is an array of group ids to hide
 *
 * @param   {function}       callback hide groups event callback
 * @returns {AttributePanel}          attribute panel (for chaining)
 */
AttributePanel.prototype.bindGroupsHide = function(callback) {
   this.callback_groups_hide = callback;
   return this;
}

/**
 * Bind callback function for attribute group(s) show event.
 *
 * This function must take the following form:
 *    callback(groups) { ... }
 * where:
 *    {array} groups is an array of group ids to show
 *
 * @param   {function}       callback show groups event callback
 * @returns {AttributePanel}          attribute panel (for chaining)
 */
AttributePanel.prototype.bindGroupsShow = function(callback) {
   this.callback_groups_show = callback;
   return this;
}

/**
 * Bind attribute selection event.
 *
 * This function must take the following form:
 *    callback(attrib) { ... }
 * where:
 *    {int} attrib is the id of the selected attribute
 *
 * @param   {function}       callback attribute select event callback
 * @returns {AttributePanel}          attribute panel (for chaining)
 */
AttributePanel.prototype.bindAttribute = function(callback) {
   this.callback_attribute = callback;
   return this;
}

/*****************************************************************************
 * Event handlers.
 *****************************************************************************/

/**
 * Handle attribute family change start event.
 *
 * @param {Event}  event jquery event
 * @param {object} ui    jquery ui data
 */
AttributePanel.prototype.handleFamilyChangeStart = function(event, ui) {
   /* trigger user callback to hide family */
   if (this.callback_family_hide != null)
      this.callback_family_hide();
   /* trigger user callback to hide previous groups */
   if (this.callback_groups_hide != null) {
      /* get groups in previous family */
      var family = parseInt(ui.oldContent.data("family"));
      var groups = this.getGroups(family);
      /* trigger groups hide callback */
      this.callback_groups_hide(groups);
   }
}

/**
 * Handle attribute family change event.
 */
AttributePanel.prototype.handleFamilyChange = function() {
   /* trigger user callback to show current groups */
   if (this.callback_groups_show != null) {
      var groups = this.getGroups();
      this.callback_groups_show(groups);
   }
   /* trigger user callback for attribute selection */
   if (this.callback_attribute != null) {
      var attrib = this.getAttribute();
      this.callback_attribute(attrib);
   }
   /* trigger user callback to show family */
   if (this.callback_family_show != null)
      this.callback_family_show();
}

/**
 * Handle attribute group show/hide toggle event.
 *
 * @param {Event} event jquery event
 */
AttributePanel.prototype.handleGroupToggle = function(event) {
   /* get group info */
   var group  = parseInt($(event.target).data("group"));
   var family = parseInt($(event.target).data("family"));
   /* get desired state */
   var state = $(event.target).html();
   /* get handle to group DOM element */
   var buttons_div = $("#attribute-buttons-" + family + "-" + group, this.div);
   /* change state */
   if (state == "Hide") {
      /* hide group */
      buttons_div.hide();
      $(event.target).html("Show");
      /* trigger user callback */
      if (this.callback_groups_hide != null)
         this.callback_groups_hide([group]);
   } else {
      /* show group */
      buttons_div.show();
      $(event.target).html("Hide");
      /* trigger user callback */
      if (this.callback_groups_show != null)
         this.callback_groups_show([group]);
   }
}

/**
 * Handle attribute selection event.
 *
 * @param {Event} event jquery event
 */
AttributePanel.prototype.handleAttributeSelect = function(event) {
   /* trigger user callback for attribute selection */
   if (this.callback_attribute != null) {
      var attrib = parseInt($(event.target).data("attrib"));
      this.callback_attribute(attrib);
   }
}
