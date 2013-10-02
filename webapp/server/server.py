###############################################################################
# Copyright (C) 2012-2013 Michael Maire <mmaire@gmail.com>
#
# This program is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
###############################################################################

import os;
import sys;
import string;
import uuid;
import bottle;
from bottle import Bottle, request, route, run, static_file, template;

# configuration
bottle.TEMPLATE_PATH = ["../client/views"];

# create application
app = Bottle();

# static routing
@app.route("/static/<filepath:path>")
def serve_static(filepath):
   return static_file(filepath, root="../client/static");

# annotator application
@app.route("/annotator")
def annotator():
   return template("apps/annotator.html.tpl");

# sample images
@app.get("/images/<filename>")
def sample_images(filename):
   return static_file(filename, root="images");

# writing attributes
@app.post("/images/<filename>")
def write_attributes(filename):
   print (request.url);
   print (request.content_type);
   print (request.content_length);
   data = request.body.read(request.content_length);
   f = open("./images/" + filename, "wb");
   f.write(data);
   f.close();

bottle.debug(True);
#run(app, host="localhost", port=8080, reloader=True);

root_app = Bottle();
root_app.mount("/test/", app);
run(root_app, host="localhost", port=8080, reloader=True);
