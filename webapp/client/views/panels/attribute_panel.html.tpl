% setdefault("id", "attribute-panel");
% setdefault("prefix", "attribute");
% setdefault("hide", False);
<div
   id="{{id}}"
   class="attribute-panel panel-right{{" hidden" if hide else ""}}"
   data-prefix="{{prefix}}">
   <div id="attribute-panel-label" class="text-medium">
      Attributes
   </div>
   <div id="attribute-accordion"> 
      <h1>
         <a class="attribute-family-title" data-family="0"></a>
      </h1>
      <div
         class="attribute-family"
         data-family="0"
         data-groups="0 1">
      </div>
      <h1>
         <a class="attribute-family-title" data-family="1"></a>
      </h1>
      <div
         class="attribute-family"
         data-family="1"
         data-groups="2 3 4 5">
      </div>
      <h1>
         <a class="attribute-family-title" data-family="2"></a>
      </h1>
      <div
         class="attribute-family"
         data-family="2"
         data-groups="6 7 8 9 10">
      </div>
      <h1>
         <a class="attribute-family-title" data-family="3"></a>
      </h1>
      <div
         class="attribute-family"
         data-family="3"
         data-groups="11 12">
      </div>
      <h1>
         <a class="attribute-family-title" data-family="4"></a>
      </h1>
      <div
         class="attribute-family"
         data-family="4"
         data-groups="13 14">
      </div>
   </div>
</div>
