% Write SEQ compressed array to file.
function seq_write(f, seq, ty)
   % write size
   fwrite(f, seq.sz, 'uint32');
   % write step
   fwrite(f, seq.step, 'float64');
   % write start value array
   fwrite(f, tyid(ty), 'uint32');
   fwrite(f, numel(seq.vals_start), 'uint32');
   fwrite(f, seq.vals_start, ty);
   % write end value array
   fwrite(f, tyid(ty), 'uint32');
   fwrite(f, numel(seq.vals_end), 'uint32');
   fwrite(f, seq.vals_end, ty);
end
