% Write segmentation to a .seg file.
%
% seg_write(filename, seg)
%
% Input:
%    filename - .seg file to create
%    seg      - segmentation represented as map of pixel id -> region label
function seg_write(filename, seg)
   f = fopen(filename, 'w');
   rle = rle_compress(fliplr(seg.'));
   rle_write(f, rle, 'uint32');
   fclose(f);
end
