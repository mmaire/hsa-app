% Load region tree from specified annotation file.
%
% [rtree] = load_rtree(fname)
%
% Input:
%    fname           - name of annotation file to load
%
% Output:
%    rtree.          - region tree loaded from annotation
%       top          - list of regions at top level of tree
%       regions.     - array of region data structures
%          name      - name of region
%          color     - RGBA array specifying region color
%          id        - id of region itself
%          parent    - id of parent region ([] if none)
%          children  - list of child region ids
%          rank      - rank of region relative to siblings
%          level     - level in region tree (distance from root)
%          pixels    - list of pixels in region
function [rtree] = load_rtree(fname)
   % open file
   f = fopen(fname, 'r');
   % load number of regions
   n_regions = fread(f, 1, 'uint32');
   % initialize list of top regions
   top = [];
   % initialize regions data structure
   regions = repmat( ...
      struct( ...
         'name',     '', ...
         'color',    [], ...
         'id',       [], ...
         'parent',   [], ...
         'children', [], ...
         'rank',     [], ...
         'level',    [], ...
         'pixels',   [] ...
      ), ...
      [n_regions 1] ...
   );
   % load region data
   for n = 1:n_regions
      % load id of parent region
      parent = fread(f, 1, 'int32');
      if (parent < 0)
         parent = [];
      else
         parent = parent + 1; % translate to matlab indexing
      end
      % load rank of region
      rank = fread(f, 1, 'float64');
      rank = rank + 1; % translate to matlab indexing
      % load pixels in region
      n_pixels = fread(f, 1, 'uint32');
      pixels = fread(f, n_pixels, 'uint32');
      pixels = pixels + 1; % translate to matlab indexing
      % read dummy value
      fread(f, 1, 'uint32');
      % load name
      len = fread(f, 1, 'uint32');
      name = fread(f, len + 1, 'char');
      % load color
      color = fread(f, 4, 'float64');
      % assemble region data
      regions(n).name     = name;
      regions(n).color    = color;
      regions(n).id       = n;
      regions(n).parent   = parent;
      regions(n).children = [];
      regions(n).rank     = rank;
      regions(n).level    = [];
      regions(n).pixels   = pixels;
      % update top of tree list (if region is at top)
      if (isempty(parent))
         top = [top n];
      end
   end
   % close file
   fclose(f);
   % build child region lists
   for n = 1:n_regions
      id       = regions(n).id;
      parent   = regions(n).parent;
      if (~isempty(parent))
         children = regions(parent).children;
         regions(parent).children = [children id];
      end
   end
   % compute level of each region
   for n = 1:n_regions
      lvl = 1;
      parent = regions(n).parent;
      while (~isempty(parent))
         lvl = lvl + 1;
         parent = regions(parent).parent;
      end
      regions(n).level = lvl;
   end
   % assemble region tree
   rtree = struct('top', top, 'regions', regions);
end
