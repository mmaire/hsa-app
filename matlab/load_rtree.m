% Load region tree from specified annotation file.
%
% [rtree] = load_rtree(fname, decompress_scrib)
%
% Input:
%    fname            - name of annotation file to load
%    decompress_scrib - decompress scribble data? (default: false)
%                       (setting this true consumes significantly more memory)
%
% Output:
%    rtree.           - region tree loaded from annotation
%       top           - list of regions at top level of tree
%       regions.      - array of region data structures
%          name       - name of region
%          color      - RGBA array specifying region color
%          id         - id of region itself
%          parent     - id of parent region ([] if none)
%          children   - list of child region ids
%          rank       - rank of region relative to siblings
%          level      - level in region tree (distance from root)
%          pixels     - list of pixels in region
%          scrib_data - scribble data (brush strokes, etc) defining region
function [rtree] = load_rtree(fname, decompress_scrib)
   % default arguments
   if ((nargin < 2) || isempty(decompress_scrib))
      decompress_scrib = false;
   end
   % open file
   f = fopen(fname, 'r');
   % load number of regions
   n_regions = fread(f, 1, 'uint32');
   % initialize list of top regions
   top = [];
   % initialize regions data structure
   regions = repmat( ...
      struct( ...
         'name',       '', ...
         'color',      [], ...
         'id',         [], ...
         'parent',     [], ...
         'children',   [], ...
         'rank',       [], ...
         'level',      [], ...
         'pixels',     [], ...
         'scrib_data', [] ...
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
      pixels = seq_decompress(seq_read(f, 'uint32'));
      pixels = pixels + 1; % translate to matlab indexing
      % get scribble data flag
      has_scrib_data = fread(f, 1, 'uint32');
      % load scribble data
      scrib_data = {};
      if (has_scrib_data)
         % load pixel and mask flag arrays
         px_flags       = rle_read(f, 'uint32');
         mask_flags     = rle_read(f, 'uint32');
         % load stroke data
         stroke_id_curr = fread(f, 1, 'uint32');
         stroke_id_soft = fread(f, 1, 'uint32');
         stroke_log     = rle_read(f, 'int16');
         % load auto-fill threshold
         fill_th        = fread(f, 1, 'float64');
         % decompress scribble data (if requested)
         if (decompress_scrib)
            px_flags   = rle_decompress(px_flags);
            mask_flags = rle_decompress(mask_flags);
            stroke_log = rle_decompress(stroke_log);
         end
         % assemble scribble data
         scrib_data = struct( ...
            'px_flags',       px_flags, ...
            'mask_flags',     mask_flags, ...
            'stroke_id_curr', stroke_id_curr, ...
            'stroke_id_soft', stroke_id_soft, ...
            'stroke_log',     stroke_log, ...
            'fill_th',        fill_th ...
         );
      end
      % get region attribute data flag
      has_reg_attribs = fread(f, 1, 'uint32');
      % load region attributes
      name  = '';
      color = [0 0 0 0];
      if (has_reg_attribs)
         % load name
         len = fread(f, 1, 'uint32');
         name = fread(f, len + 1, 'char');
         % load color
         color = fread(f, 4, 'float64');
      end
      % assemble region data
      regions(n).name       = name;
      regions(n).color      = color;
      regions(n).id         = n;
      regions(n).parent     = parent;
      regions(n).children   = [];
      regions(n).rank       = rank;
      regions(n).level      = [];
      regions(n).pixels     = pixels;
      regions(n).scrib_data = scrib_data;
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
