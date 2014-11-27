% Get type id from type name.
function id = tyid(ty)
   if (strcmp(ty,'int32'))
      id = 5;
   elseif (strcmp(ty,'uint32'))
      id = 6;
   else
      error('type not supported'); % FIXME
   end
end
