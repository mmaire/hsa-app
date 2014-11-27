% Read SEQ compressed array from file.
function seq = seq_read(f, ty)
   % read size
   sz = fread(f, 1, 'uint32');
   % read step
   step = fread(f, 1, 'float64');
   % read start value array
   id = fread(f, 1, 'uint32');
   nv = fread(f, 1, 'uint32');
   vals_start = fread(f, nv, tyname(id));
   % read end value array
   id = fread(f, 1, 'uint32');
   nv = fread(f, 1, 'uint32');
   vals_end = fread(f, nv, tyname(id));
   % assemble seq data structure
   seq = struct( ...
      'sz',         sz, ...
      'step',       step, ...
      'vals_start', vals_start, ...
      'vals_end',   vals_end ...
   );
end
