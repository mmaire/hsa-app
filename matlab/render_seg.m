% Render region tree to produce a flat segmentation.
%
% [seg_ids seg_levels seg_depth] = render_seg(im, rtree, max_level)
%
% Input:
%    im           - original image
%    rtree        - groundtruth region tree annotation
%    max_level    - maximum level of tree to render (default: inf)
%
% Output:
%    seg_ids      - id of region visible at each pixel (zero for background)
%    seg_levels   - level in heirarchy of visible regions
%    seg_depth    - depth (relative figure/ground ordering) of visible regions
function [seg_ids seg_levels seg_depth] = render_seg(im, rtree, max_level)
   % default arguments
   if (nargin < 3), max_level = inf; end
   % get image size
   sx = size(im,1);
   sy = size(im,2);
   % initialize rendering
   seg_ids = zeros([sy sx]);
   % get number of regions
   n_regions = numel(rtree.regions);
   % intialize list of active regions with top of tree
   regs = rtree.top;
   % recursively render tree
   seg_ids = render(seg_ids, regs, rtree, 0, max_level);
   % transform rendering back into original image coordinates
   seg_ids = flipud(seg_ids.');
   % build map of region id -> region level
   lvl_map = rtree_level_map(rtree);
   % add leading entry for background level (map background to level 1)
   lvl_map = [1; lvl_map];
   % lookup levels of visible regions
   seg_levels = lvl_map(seg_ids + 1);
   % build map of region id -> depth in scene
   depth_map = rtree_depth_map(rtree);
   % add leading entry for background depth (map background to depth 0)
   depth_map = [0; depth_map];
   % lookup depths of visible regions
   seg_depth = depth_map(seg_ids + 1);
end

% Recursively render given set of regions onto segmentation.
function seg_ids = render(seg_ids, regs, rtree, curr_level, max_level)
   % check tree level
   if (curr_level > max_level), return; end
   % lookup ranks of active regions
   n_active = numel(regs);
   ranks = zeros([n_active 1]);
   for r = 1:n_active
      ranks(r) = rtree.regions(regs(r)).rank;
   end
   % sort active regions by rank
   [ranks inds] = sort(ranks,1,'descend');
   regs = regs(inds);
   % draw regions from farthest to closest
   for r = 1:n_active
      % draw region
      id = regs(r);
      px = rtree.regions(id).pixels;
      seg_ids(px) = id;
      % recurse on children
      children = rtree.regions(id).children;
      seg_ids = render(seg_ids, children, rtree, curr_level + 1, max_level);
   end
end
