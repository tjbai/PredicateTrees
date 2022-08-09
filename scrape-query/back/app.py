from flask import Flask, request
from flask_cors import CORS

from scrape import scrape, to_root

app = Flask(__name__)
CORS(app)


@app.route('/tree', methods=['POST'])
def tree():
    data = request.get_json()
    return scrape(data['pcode'])


@app.route('/test', methods={'GET', 'POST'})
def test():
    return 'hello'


@app.route('/branch', methods=['POST'])
def branch():
    pass
