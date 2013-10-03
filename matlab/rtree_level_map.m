% Build map of region id -> region level in tree.
%
% [lvl_map] = rtree_level_map(rtree)
%
% Input:
%    rtree   - groundtruth region tree annotation
%
% Output:
%    lvl_map - array mapping region id -> region level
function [lvl_map] = rtree_level_map(rtree)
   % get number of regions
   n_regions = numel(rtree.regions);
   % compute map of region id -> region level
   lvl_map = zeros([n_regions 1]);
   for n = 1:n_regions
      lvl_map(n) = rtree.regions(n).level;
   end
end
