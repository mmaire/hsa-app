% Decompress sequence encoded (SEQ) array.
function arr = seq_decompress(seq)
   % allocate array
   arr = zeros([seq.sz 1]);
   % decompress
   n = 1;
   for pos = 1:numel(seq.vals_start)
      vals = (seq.vals_start(pos)):(seq.step):(seq.vals_end(pos));
      arr(n:(n+numel(vals)-1)) = vals;
      n = n + numel(vals);
   end
end
