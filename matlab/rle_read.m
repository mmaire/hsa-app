% Read RLE compressed array from file.
function rle = rle_read(f, ty)
   % read size
   sz = fread(f, 1, 'uint32');
   % read value array
   id = fread(f, 1, 'uint32');
   nv = fread(f, 1, 'uint32');
   vals = fread(f, nv, tyname(id));
   % read count array
   id = fread(f, 1, 'uint32');
   nc = fread(f, 1, 'uint32');
   counts = fread(f, nc, tyname(id));
   % assemble rle data structure
   rle = struct('sz', sz, 'vals', vals, 'counts', counts);
end   
