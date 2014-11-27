% Get type name (as string) from type id.
function ty = tyname(id)
   if (id == 5)
      ty = 'int32';
   elseif (id == 6)
      ty = 'uint32';
   else
      error('type not supported'); % FIXME
   end
end
