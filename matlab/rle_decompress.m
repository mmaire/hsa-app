% Decompress run-length encoded (RLE) array.
function arr = rle_decompress(rle)
   % allocate array
   arr = zeros([rle.sz 1]);
   % decompress
   n = 1;
   for pos = 1:numel(rle.vals)
      cnt = rle.counts(pos);
      arr(n:(n+cnt-1)) = rle.vals(pos);
      n = n + cnt;
   end
end
