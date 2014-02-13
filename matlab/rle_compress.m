% Compress array using run-length encoding (RLE).
function rle = rle_compress(arr)
   % check for empty array
   if (isempty(arr))
      % construct empty rle
      rle = struct('sz', 0, 'vals', [], 'counts', []);
   else
      % get run start/end coordinates
      pos = find(arr(1:end-1) ~= arr(2:end));
      s = [1 (pos+1)];
      e = [pos (numel(arr))];
      % get values and counts
      vals   = arr(s);
      counts = e - s + 1;
      % construct rle
      rle = struct('sz', numel(arr), 'vals', vals, 'counts', counts);
   end
end
