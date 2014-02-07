% Convert UCM to hierarchical regions.
function [px_rid_map regs] = ucm2regs(ucm, th_arr)
   % extract segmentation at each threshold
   n_th = numel(th_arr);
   seg_arr = cell([n_th 1]);
   for n = 1:n_th
      seg_arr{n} = ucm2seg(ucm, th_arr(n));
   end
   % get number of regions at each threshold
   r_cnt = zeros([n_th 1]);
   for n = 1:n_th
      seg = seg_arr{n};
      r_cnt(n) = max(seg(:));
   end
   r_cnt_cum = cumsum(r_cnt);
   r_cnt_offset = [0; r_cnt_cum];
   r_total = r_cnt_cum(end);
   % create pixel -> region map
   px_rid_map = seg_arr{1};
   % initialize regions
   regs = cell([r_total 1]);
   for r = 1:r_total
      regs{r} = struct( ...
         'id',         r, ...
         'parent_id',  0, ...
         'child_ids',  [], ...
         'merge_th',   0 ...
      );
   end
   % lookup parent regions
   for lvl = 1:(n_th-1)
      seg      = seg_arr{lvl};
      seg_next = seg_arr{lvl+1};
      mems = segment_members(seg);
      for s = 1:numel(mems)
         r_id = s + r_cnt_offset(lvl);
         px = mems{s};
         p_id = mode(seg_next(px)) + r_cnt_offset(lvl+1);
         regs{r_id}.parent_id = p_id;
         regs{r_id}.merge_th = th_arr(lvl);
         regs{p_id}.child_ids = [regs{p_id}.child_ids r_id];
      end
   end
   % set final merge thresholds
   seg = seg_arr{n_th};
   mems = segment_members(seg);
   for s = 1:numel(mems)
      r_id = s + r_cnt_offset(n_th);
      regs{r_id}.merge_th = th_arr(n_th);
   end
end

%% compute pixels belonging to each segment
function seg_members = segment_members(seg)
   % initialize member lists
   n_regions = max(seg(:));
   seg_members = cell([n_regions 1]);
   % sort segment ids
   seg_labels = reshape(seg, [1 prod(size(seg))]);
   [seg_sorted inds] = sort(seg(:));
   seg_labels = seg_labels(inds);
   seg_starts = find(seg_labels ~= [-1 seg_labels(1:end-1)]);
   seg_ends   = find(seg_labels ~= [seg_labels(2:end) (n_regions+1)]);
   % store pixel membership of each segment
   for n = 1:n_regions
      ps = seg_starts(n);
      pe = seg_ends(n);
      seg_members{n} = inds(ps:pe);
   end
end
