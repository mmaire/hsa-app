% Get type id from type name.
function id = tyid(ty)
   if (strcmp(ty,'int8'))
      id = 1;
   elseif (strcmp(ty,'uint8'))
      id = 2;
   elseif (strcmp(ty,'int16'))
      id = 3;
   elseif (strcmp(ty,'uint16'))
      id = 4;
   elseif (strcmp(ty,'int32'))
      id = 5;
   elseif (strcmp(ty,'uint32'))
      id = 6;
   elseif (strcmp(ty,'float32'))
      id = 7;
   elseif (strcmp(ty,'float64'))
      id = 8;
   else
      error('type not supported');
   end
end
