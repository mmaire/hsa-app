% Build indicator matrix for pairwise region containment relationships.
%
% [path_mx] = rtree_path_mx(rtree)
%
% Input:
%    rtree   - groundtruth region tree annotation
%
% Output:
%    path_mx - indicator matrix: are regions on common path from root to leaf?
function [path_mx] = rtree_path_mx(rtree)
   % initialize path indicator matrix
   n_regions = numel(rtree.regions);
   path_mx = false([n_regions n_regions]);
   % traverse path from each region to root of tree
   for n = 1:n_regions
      % get region id
      id = rtree.regions(n).id;
      % initialie parent
      parent = rtree.regions(n).parent;
      % traverse path
      while (~isempty(parent))
         % update path indicator matrix
         path_mx(id, parent) = true;
         path_mx(parent, id) = true;
         % travel toward root
         parent = rtree.regions(parent).parent;
      end
   end
   % convert binary matrix to float format
   path_mx = double(path_mx);
end
