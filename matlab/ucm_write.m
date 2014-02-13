% Write ucm to a datastream
function ucm_write(filename, ucm, th_arr)
   % extract region tree
   [px_rid_map regs] = ucm2regs(ucm, th_arr);
   % open
   f = fopen(filename, 'w');
   % write header
   fwrite(f, size(ucm,1), 'int32');
   fwrite(f, size(ucm,2), 'int32');
   fwrite(f, numel(unique(px_rid_map(:))), 'int32');
   fwrite(f, numel(regs), 'int32');
   % write pixel -> region map
   rle = rle_compress(fliplr(px_rid_map.') - 1);
   rle_write(f, rle, 'int32');
   % write region info
   for r = 1:numel(regs)
      reg = regs{r};
      fwrite(f, reg.id - 1, 'int32');
      fwrite(f, reg.parent_id - 1, 'int32');
      fwrite(f, numel(reg.child_ids), 'int32');
      if (numel(reg.child_ids) > 0)
         fwrite(f, reg.child_ids - 1, 'int32');
      end
      fwrite(f, reg.merge_th, 'float64');
   end
   % close
   fclose(f);
end
