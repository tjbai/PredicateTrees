import pandas as pd
from typing import List
import tempfile
import urllib.request
from os import path
import PyPDF2 as ppdf
import re
import json
from collections import defaultdict
from tqdm import tqdm
import networkx as nx
from pyvis.network import Network


def get_nums(pcode: str, limit: int) -> List[str]:
    url = f'https://api.fda.gov/device/510k.json?search={pcode}&limit={limit}'

    response = urllib.request.urlopen(url)
    db = json.loads(response.read())

    return [d["k_number"] for d in db["results"]]


def find_predicate(pcode: str) -> str:

    # Extract year from product code
    if pcode[0] == 'K':
        yr = pcode[1:3]
    else:
        return None

    url = f'https://www.accessdata.fda.gov/cdrh_docs/pdf{yr}/{pcode}.pdf'
    # print(url)

    # Pull PDF data
    response = urllib.request.urlopen(url)
    pg_data = response.read()

    # Write to tempfile object
    temp_file = path.join(tempfile.gettempdir(), 'temp.pdf')
    pdf_file = open(temp_file, 'wb')
    pdf_file.write(pg_data)

    found = []

    # In case the document is too old
    try:
        doc = ppdf.PdfFileReader(open(temp_file, 'rb'))
    except Exception as e:
        print(f'could not open pdf for {pcode}')
        return None

    for pg in doc.pages:
        try:
            pg_content = (pg.extract_text() + '\n').upper()
            regex = re.search('PREDICATE', pg_content)

            # Find all product codes after each occurrence of 'predicate' sorted in order of appearance
            if regex is not None:
                chunks = re.findall(
                    '(P|DEN|K)([0-9]{6})', pg_content[regex.span()[1]:])
                pcodes = [p1+p2 for p1, p2 in chunks]
                for cand in pcodes:
                    if cand != pcode:
                        found.append(cand)
                        break

        except Exception as e:
            # print(f'issue finding predicate for {pcode}: {e}')
            pass

    # Return most occuring element in found, just an extra layer of assurance
    return max(set(found), key=found.count) if len(found) else None


def to_root(src: str):
    res = [src]

    while res[-1][0] == 'K':
        pred = find_predicate(res[-1])
        if pred is None or pred in res:
            break
        res.append(pred)

    return res


def form_tree(pcode, verbose=False):
    nums = get_nums(pcode, 100)

    adj_list = defaultdict(list)
    visited = set()
    in_degree = defaultdict(int)

    for i, num in enumerate(nums):
        path = to_root(num)

        if verbose:
            print(f'Starting new path at {num}, iter {i+1}/{len(nums)}')
            print(path, '\n')

        for i in range(len(path)-1, 0, -1):
            parent, child = path[i], path[i-1]
            visited.update([parent, child])
            in_degree[child] += 1
            if child not in adj_list[parent]:
                adj_list[parent].append(child)

    for node in visited:
        if in_degree[node] == 0:
            adj_list[pcode].append(node)

    return adj_list


def get_node_val(adj_list, pcode):

    nodes = []
    values = {}

    stk = []
    stk.append((pcode, 0))

    while stk:
        node, level = stk.pop()
        if node in nodes:
            continue

        nodes.append(node)
        values[node] = level

        for child in adj_list[node]:
            stk.append((child, level+1))

    return nodes, values


def to_json(pcode, adj_list, nodes, values):
    res = {}
    res['tree'] = adj_list
    res['info'] = {}

    # Pull relevant information from openFDA API for each node
    url = f'https://api.fda.gov/device/510k.json?search={pcode}&limit=100'

    response = urllib.request.urlopen(url)
    db = json.loads(response.read())

    for doc in db['results']:
        if doc['k_number'] in nodes:
            res['info'][doc['k_number']] = {
                'DECISION_DATE': doc['decision_date'],
                'PRODUCT_CODES': doc['product_code'],
                'DEVICE_TRADE_NAME': doc['device_name'],
                'GENERATION': values[doc['k_number']]
            }

    for n in nodes:
        if n not in res['info']:
            res['info'][n] = {}
            res['info'][n]['GENERATION'] = values[n]

    return json.dumps(res)


def scrape(pcode, verbose=False):
    adj_list = form_tree(pcode, verbose=verbose)
    nodes, values = get_node_val(adj_list, pcode)
    return to_json(pcode, adj_list, nodes, values)
