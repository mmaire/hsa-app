% Render region tree to produce a hierarchical boundary map.
%
% [bmap fg_map levels] = render_bmap(im, rtree)
%
% Input:
%    im           - original image
%    rtree        - groundtruth region tree annotation
%
% Output:
%    bmap         - boundary indicator map (all boundaries)
%    fg_map       - boundary indicator map (figure/ground boundaries only)
%    levels       - level of each boundary pixel in hierarchy
function [bmap fg_map levels] = render_bmap(im, rtree)
   % get finest rendering
   max_level = max([rtree.regions.level]);
   [bmap fg_map levels] = render_bmap_level(im, rtree, max_level);
   % correct boundary map levels
   for curr_level = (max_level-1):-1:0
      [bmap_curr fg_map_curr levels_curr] = ...
         render_bmap_level(im, rtree, curr_level);
      inds = find(bmap & bmap_curr);
      levels(inds) = min(levels(inds), levels_curr(inds));
   end
end

% helper function
function [bmap fg_map levels] = render_bmap_level(im, rtree, max_level)
   % render segmentation
   [seg_ids seg_levels] = render_seg(im, rtree, max_level);
   % build map of region id -> region level
   lvl_map = rtree_level_map(rtree);
   % build indicator matrix for object-subpart relationships between regions
   path_mx = rtree_path_mx(rtree);
   % extract boundaries from rendered segmentation
   [bmap_n  ids_n]  = extract_boundary(seg_ids,  0,  1);
   [bmap_s  ids_s]  = extract_boundary(seg_ids,  0, -1);
   [bmap_e  ids_e]  = extract_boundary(seg_ids,  1,  0);
   [bmap_w  ids_w]  = extract_boundary(seg_ids, -1,  0);
   [bmap_ne ids_ne] = extract_boundary(seg_ids,  1,  1);
   [bmap_nw ids_nw] = extract_boundary(seg_ids, -1,  1);
   [bmap_se ids_se] = extract_boundary(seg_ids,  1, -1);
   [bmap_sw ids_sw] = extract_boundary(seg_ids, -1, -1);
   % assemble results
   bmaps = { ...
      bmap_n;  bmap_s;  bmap_e;  bmap_w; ...
      bmap_ne; bmap_nw; bmap_se; bmap_sw ...
   };
   ids = { ...
      ids_n;  ids_s;  ids_e;  ids_w; ...
      ids_ne; ids_nw; ids_se; ids_sw ...
   };
   % examine boundaries
   n_dirs = numel(bmaps);
   level_arr = cell([n_dirs 1]);
   fg_arr    = cell([n_dirs 1]);
   for n = 1:n_dirs
      [lvls fg] = examine_boundary( ...
         bmaps{n}, seg_ids, ids{n}, lvl_map, path_mx ...
      );
      level_arr{n} = lvls;
      fg_arr{n}    = fg;
   end
   % initialize boundary info
   sx = size(im,1);
   sy = size(im,2);
   bmap   = zeros([sx sy]);
   fg_map = zeros([sx sy]);
   levels = inf.*ones([sx sy]);
   % combine directional boundaries
   for n = 1:n_dirs
      bmap   = bmap + bmaps{n};
      fg_map = fg_map + fg_arr{n};
      levels = min(levels, level_arr{n});
   end
   % correct range
   bmap   = double(bmap > 0);
   fg_map = double(fg_map > 0);
   inds = find(isinf(levels));
   levels(inds) = 0;
   % thin boundaries
   bmap   = double(bwmorph(bmap, 'thin', inf));
   fg_map = fg_map.*bmap;
   levels = levels.*bmap;
end

% Extract boundaries in specified direction by examining region id differences.
%
% [bmap ids_shift] = extract_boundary(seg_ids, offset_x, offset_y)
%
% Input:
%    seg_ids   - region id of each pixel in image
%    offset_x  - x-direction offset (-1, 0, or 1)
%    offset_y  - y-direction offset (-1, 0, or 1)
%
% Ouput:
%    bmap      - indicator map for boundaries in specified direction
%    ids_shift - region ids shifted by specified direction
function [bmap ids_shift] = extract_boundary(seg_ids, offset_x, offset_y)
   % get image size
   sx = size(seg_ids,1);
   sy = size(seg_ids,2);
   % initialize shifted ids and valid comparison mask
   ids_shift = seg_ids;
   is_valid  = ones([sx sy]);
   % shift by x-offset
   if (offset_x == 1)
      ids_shift = [ids_shift(2:end,:); zeros([1 sy])];
      is_valid  = [is_valid(2:end,:);  zeros([1 sy])];
   elseif (offset_x == -1)
      ids_shift = [zeros([1 sy]); ids_shift(1:end-1,:)];
      is_valid  = [zeros([1 sy]); is_valid(1:end-1,:)];
   end
   % shift by y-offset
   if (offset_y == 1)
      ids_shift = [ids_shift(:,2:end) zeros([sx 1])];
      is_valid  = [is_valid(:,2:end)  zeros([sx 1])];
   elseif (offset_y == -1)
      ids_shift = [zeros([sx 1]) ids_shift(:,1:end-1)];
      is_valid  = [zeros([sx 1]) is_valid(:,1:end-1)];
   end
   % extract id difference
   d = abs(seg_ids - ids_shift);
   % create boundary map
   bmap = double((d > 0) & (is_valid == 1));
end

% Examine boundary pixels to determine their level in the hierarchy and
% whether they are a figure/ground boundary or an object-part boundary.
%
% [lvls fg] = examine_boundary(bmap, ids_a, ids_b, lvl_map, path_mx)
%
% Input:
%    bmap    - indicator map for boundaries in some direction
%    ids_a   - id of first region at boundary pixels in given direction
%    ids_b   - id of second region at boundary pixels in given direction
%    lvl_map - map of region id -> region level
%    path_mx - indicator matrix: are regions on common path from root to leaf?
%
% Output:
%    lvls    - hierarchy level of each boundary pixel (-inf for non-boundary)
%    fg      - indicator map for whether pixel is figure/ground boundary
function [lvls fg] = examine_boundary(bmap, ids_a, ids_b, lvl_map, path_mx)
   % find indices of boundary pixels
   inds = find(bmap);
   % get region ids at boundary pixels
   ra = ids_a(inds);
   rb = ids_b(inds);
   % shift level map by add leading entry for background level (map to level 1)
   lvl_map = [1; lvl_map];
   % lookup region levels
   lvla = lvl_map(ra + 1);
   lvlb = lvl_map(rb + 1);
   % shift path matrix by adding leading row, column for background
   n_regions = size(path_mx,1);
   path_mx_shift = zeros([(n_regions+1) (n_regions+1)]);
   path_mx_shift(2:end,2:end) = path_mx;
   % compute pairwise lookup coordinates into path matrix
   pos = (ra*(n_regions+1) + rb) + 1;
   % lookup part relationship compatibility
   p = path_mx_shift(pos);
   % choose level based on part compatibility
   lvl_min = min(lvla, lvlb);
   lvl = (lvl_min + 1).*p + lvl_min.*(1 - p);
   % build output level matrix
   lvls = inf.*ones(size(bmap));
   lvls(inds) = lvl;
   % build output figure/ground indicator matrix
   fg = zeros(size(bmap));
   fg(inds) = 1 - p;
end
