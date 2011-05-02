# -*- coding: utf-8 -*-
import unittest
import bottle
import urllib2
import time
from tools import tob
import sys
import os
import signal
import socket
from subprocess import Popen, PIPE
import tools

serverscript = os.path.join(os.path.dirname(__file__), 'servertest.py')

def ping(server, port):
    ''' Check if a server accepts connections on a specific TCP port '''
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((server, port))
        s.close()
        return True
    except socket.error, e:
        return False

class TestServer(unittest.TestCase):
    server = 'wsgiref'
    skip   = False

    def setUp(self):
        if self.skip: return
        # Find a free port
        for port in range(8800, 8900):
            self.port = port
            # Start servertest.py in a subprocess
            cmd = [sys.executable, serverscript, self.server, str(port)]
            cmd += sys.argv[1:] # pass cmdline arguments to subprocesses
            self.p = Popen(cmd, stdout=PIPE, stderr=PIPE)
            # Wait for the socket to accept connections
            for i in xrange(100):
                time.sleep(0.1)
                # Accepts connections?
                if ping('127.0.0.1', port): return
                # Server died for some reason...
                if not self.p.poll() is None: break
            rv = self.p.poll()
            if rv is None:
                raise AssertionError("Server took to long to start up.")
            if rv is 128: # Import error
                tools.warn("Skipping %r test (ImportError)." % self.server)
                self.skip = True
                return
            if rv is 3: # Port in use
                continue
        raise AssertionError("Could not find a free port to test server.")

    def tearDown(self):
        if self.skip: return
        for i in range(10):
            if self.p.poll() != None: break
            os.kill(self.p.pid, signal.SIGINT)
            time.sleep(0.1*i)
        for i in range(10):
            if self.p.poll() != None: break
            os.kill(self.p.pid, signal.SIGINT)
            time.sleep(i)
        for stream in (self.p.stdout, self.p.stderr):
            for line in stream:
                if tob('warning') in line.lower():
                    tools.warn(line.strip().decode('utf8'))
                elif tob('error') in line.lower():
                    raise AssertionError(line.strip().decode('utf8'))

    def fetch(self, url):
        try:
            return urllib2.urlopen('http://127.0.0.1:%d/%s' % (self.port, url)).read()
        except Exception, e:
            return repr(e)

    def test_simple(self):
        ''' Test a simple static page with this server adapter. '''
        if self.skip: return
        self.assertEqual(tob('OK'), self.fetch('test'))



class TestCherryPyServer(TestServer):
    server = 'cherrypy'

class TestPasteServer(TestServer):
    server = 'paste'

class TestTornadoServer(TestServer):
    server = 'tornado'

class TestTwistedServer(TestServer):
    server = 'twisted'

class TestDieselServer(TestServer):
    server = 'diesel'

class TestGunicornServer(TestServer):
    server = 'gunicorn'

class TestGeventServer(TestServer):
    server = 'gevent'

class TestEventletServer(TestServer):
    server = 'eventlet'

class TestRocketServer(TestServer):
    server = 'rocket'

class TestFapwsServer(TestServer):
    server = 'fapws3'

class TestFapwsServer(TestServer):
    server = 'meinheld'

class TestBjoernServer(TestServer):
    server = 'bjoern'

if __name__ == '__main__': #pragma: no cover
    unittest.main()