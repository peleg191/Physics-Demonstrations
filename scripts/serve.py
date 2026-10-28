"""Serve only public assets, optionally under a Pages-style subdirectory."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

PUBLIC = Path(__file__).resolve().parent.parent / 'public'

def make_handler(base_path='/'):
    base = '/' + base_path.strip('/') + '/' if base_path.strip('/') else '/'

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(PUBLIC), **kw)

        def do_GET(self):
            if self.prepare_path():
                super().do_GET()

        def do_HEAD(self):
            if self.prepare_path():
                super().do_HEAD()

        def prepare_path(self):
            path = unquote(urlsplit(self.path).path)
            if not path.startswith(base) or '..' in path.split('/'):
                self.send_error(404)
                return False
            self.path = '/' + path[len(base):]
            return True

        def list_directory(self, path):
            self.send_error(404)
            return None

    return Handler

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--base-path', default='/')
    args = parser.parse_args()
    base = '/' + args.base_path.strip('/') + '/' if args.base_path.strip('/') else '/'
    with ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(base)) as server:
        print(f'Local: http://127.0.0.1:{args.port}{base}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
