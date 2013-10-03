% Build a map of region id -> relative figure/ground ordering in scene.
% Relative ordering is 1 for the most figural region, 0 for the most ground.
%
% [depth_map] = rtree_depth_map(rtree)
%
% Input:
%    rtree     - groundtruth region tree annotation
%
% Output:
%    depth_map - array mapping region id -> relative figure/ground ordering
function [depth_map] = rtree_depth_map(rtree)
   % get number of regions
   n_regions = numel(rtree.regions);
   % initialize depth order
   depth_map = zeros([n_regions 1]);
   % intialize list of active regions with top of tree
   regs = rtree.top;
   % recursively visit regions in far to near depth order
   depth_map = visit_fg(depth_map, 1, regs, rtree);
   % scale depth map into [0, 1] range
   depth_map = depth_map ./ (max(depth_map) + eps);
end

% Recursively visit regions in far to near depth order.
function [depth_map d] = visit_fg(depth_map, d, regs, rtree)
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
      % get region
      id = regs(r);
      % mark and increment depth
      depth_map(id) = d;
      d = d + 1;
      % recurse on children
      children = rtree.regions(id).children;
      [depth_map d] = visit_fg(depth_map, d, children, rtree);
   end
end
