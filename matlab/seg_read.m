% Read a segmentation from a .seg file.
%
% seg = seg_read(filename, [sx sy])
%
% Input:
%    filename - .seg file to load
%    [sx sy]  - size of image
%
% Output:
%    seg      - segmentation represented as map of pixel id -> region label
function seg = seg_read(filename, imsize)
   % get image size
   sx = imsize(1);
   sy = imsize(2);
   % read file
   f = fopen(filename,'r');
   rle = rle_read(f, 'uint32');
   L = rle_decompress(rle);
   fclose(f);
   % reshuffle label matrix
   seg = flipud(reshape(L,[sy sx]).');
end
