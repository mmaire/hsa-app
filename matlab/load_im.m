% Load image file.
%
% [im] = load_im(fname)
%
% Input:
%    fname  - name of image file containing ucm to load
%
% Output:
%    im     - image with values in range [0, 1]
function [im] = load_im(fname)
   % read image file and map to [0, 1] range
   im = double(imread(fname))./255;
end

