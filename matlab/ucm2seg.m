% Convert UCM to .seg format for use with web annotation tool.
%
% seg = ucm2seg(ucm, th)
%
% Input:
%    ucm      - ultrametric contour map with values in range [0,1]
%    th       - ucm threshold for segmentation in [0,1] (default: 0.10)
%
% Output:
%    seg      - segmentation represented as map of pixel id -> region label
function seg = ucm2seg(ucm, th)
   % default arguments
   if (nargin < 2), th = 0.10; end
   % threshold ucm
   ucm_th = ucm.*(ucm >= th);
   % convert to supergrid format
   ucm2 = super_contour_4c(ucm_th);
   % label regions
   seg2 = bwlabel(ucm2 == 0);
   % recover segmentation
   seg = seg2(2:2:end,2:2:end);
end

function [pb2, V, H] = super_contour_4c(pb)
   V = min(pb(1:end-1,:), pb(2:end,:));
   H = min(pb(:,1:end-1), pb(:,2:end));
   [tx, ty] = size(pb);
   pb2 = zeros(2*tx, 2*ty);
   pb2(1:2:end, 1:2:end) = pb;
   pb2(1:2:end, 2:2:end-2) = H;
   pb2(2:2:end-2, 1:2:end) = V;
   pb2(end,:) = pb2(end-1, :);
   pb2(:,end) = max(pb2(:,end), pb2(:,end-1));
end
