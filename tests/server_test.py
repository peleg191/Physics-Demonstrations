"""Exercise HTTP handling in memory; no network sockets required."""
import io
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest

spec = importlib.util.spec_from_file_location('serve', Path(__file__).resolve().parents[1] / 'scripts/serve.py')
serve = importlib.util.module_from_spec(spec)
spec.loader.exec_module(serve)

class Request:
    def __init__(self, path, method='GET'):
        self.input = io.BytesIO(f'{method} {path} HTTP/1.0\r\nHost: localhost\r\n\r\n'.encode())
        self.output = bytearray()
    def makefile(self, *args):
        return self.input
    def sendall(self, data):
        self.output.extend(data)

class ServerTest(unittest.TestCase):
    def get(self, path, base='/', method='GET'):
        request = Request(path, method)
        handler = serve.make_handler(base)
        handler.log_message = lambda *a: None
        handler(request, ('127.0.0.1', 1), SimpleNamespace())
        return bytes(request.output)

    def test_root_and_nested_pages_assets(self):
        for base in ['/', '/physics-playground/']:
            result = self.get(base, base)
            self.assertIn(b'200 OK', result)
            self.assertIn(b'type="module"', result)
            for asset in ['js/app.js', 'js/demos/basketball/index.js', 'js/demos/pulley/index.js', 'styles/main.css', 'assets/pulley.svg']:
                self.assertIn(b'200 OK', self.get(base + asset, base))

    def test_only_public_files_are_accessible(self):
        for path in ['/Material/Tirgul2.pdf', '/PLAN.md', '/README.md', '/package.json', '/../Material/Tirgul2.pdf', '/%2e%2e/Material/Tirgul2.pdf', '/js/']:
            self.assertIn(b'404', self.get(path))
        self.assertIn(b'404', self.get('/js/app.js', '/physics-playground/'))

    def test_head_returns_headers_only(self):
        response = self.get('/', method='HEAD')
        self.assertIn(b'200 OK', response)
        self.assertEqual(response.split(b'\r\n\r\n', 1)[1], b'')

if __name__ == '__main__':
    unittest.main()
