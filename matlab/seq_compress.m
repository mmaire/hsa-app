% Compress array using ramp sequence encoding.
function seq = seq_compress(arr, step)
   % default arguments
   if ((nargin < 2) || isempty(step)), step = 1; end
   % check for empty array
   if (isempty(arr))
      % construct empty seq
      seq = struct('sz', 0, 'step', step, 'vals_start', [], 'vals_end', []);
   else
      % find ramp sequence boundaries
      pos = find((arr(1:end-1) + step) ~= arr(2:end));
      s = [1 (pos+1)];
      e = [pos numel(arr)];
      % get values
      vals_start = arr(s);
      vals_end   = arr(e);
      % construct seq
      seq = struct(...
         'sz',         numel(arr), ..
         'step',       step, ...
         'vals_start', vals_start, ...
         'vals_end',   vals_end ...
      );
   end
end
