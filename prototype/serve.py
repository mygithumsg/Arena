"""tiny dependency-free static server for UMESH SMARTBILL dist (preview + sharing)"""
import functools, http.server
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('0.0.0.0', 5173),
    functools.partial(H, directory='/home/user/Arena/prototype/dist')).serve_forever()
