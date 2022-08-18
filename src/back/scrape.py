from typing import List, Dict, Tuple
import tempfile
import urllib.request
from os import path
import PyPDF2 as ppdf
import re
import json
from collections import defaultdict
from collections import deque


def scrape_tree(pcode: str, verbose=False):
    """
    Takes in a product code and spits out a JSON with all the relevant information

    Args:
        pcode: product code as it might be queried by a user on the frontend

    Returns:
        JSON with format as in to_json(...)
    """

    adj_list = form_tree(pcode, verbose=verbose)
    nodes, values = get_node_val(adj_list, pcode)
    return to_json(pcode, adj_list, nodes, values)


def scrape_branch(knumber, verbose=False):
    """
    Takes in a knumber and spits out a JSON with all the relevant information

    Args:
        knumber: knumber as might be queried by a user on the frontend

    Returns:
        JSON with format as in to_json(...)
    """

    root_path = to_root(knumber)
    adj_list, pcode = form_branch(root_path)
    nodes, values = get_node_val(adj_list, pcode)
    return to_json(pcode, adj_list, nodes, values)


def find_predicate(knum: str) -> str:
    """
    Return the predicate knumber for an input knumber. Searches a pdf for all occurrences of the word 
    "PREDICATE" then adds the closest found knumber to an array. Returns the most commonly occuring knumber in this array.

    Args:
        knum: knumber of interest

    Returns:
        A string representing the presumed predicate for knum
    """

    # Extract year from product code
    if knum[0] == 'K':
        yr = knum[1:3]
    else:
        return None

    url = f'https://www.accessdata.fda.gov/cdrh_docs/pdf{yr}/{knum}.pdf'

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
        print(f'could not open pdf for {knum}')
        return None

    for pg in doc.pages:
        try:
            pg_content = (pg.extract_text() + '\n').upper()
            regex = re.search('PREDICATE', pg_content)

            # Find all product codes after each occurrence of 'predicate' sorted in order of appearance
            if regex is not None:
                chunks = re.findall(
                    '(P|DEN|K)([0-9]{6})', pg_content[regex.span()[1]:])
                knums = [p1+p2 for p1, p2 in chunks]
                for cand in knums:
                    if cand != knum:
                        found.append(cand)
                        break

        except Exception as e:
            pass

    # Return most occuring element in found, just an extra layer of assurance
    return max(set(found), key=found.count) if len(found) else None


def get_nums(pcode: str, limit: int) -> List[str]:
    """
    Pulls a list of all corresponding knumbers for any product code

    Args:
        pcode: product code of interest
        limit: rate limit for openFDA API

    Returns:
        List[str]: A list of all found knumbers for the given product code
    """

    url = f'https://api.fda.gov/device/510k.json?search={pcode}&limit={limit}'

    response = urllib.request.urlopen(url)
    db = json.loads(response.read())

    return [d["k_number"] for d in db["results"]]


def to_root(src: str) -> List[str]:
    """
    Finds the root path for a given source knumber

    Args:
        src: knumber from which to start search

    Returns:
        List[str]: A list where list[i] represents the ith predicate of src

    Example:
        to_root('K190072') -> ['K190072', 'K180647', 'DEN170073']
    """

    res = [src]

    while res[-1][0] == 'K':
        pred = find_predicate(res[-1])
        if pred is None or pred in res:
            break
        res.append(pred)

    return res


def form_tree(pcode: str, verbose=False) -> Dict[str, List[str]]:
    """
    Finds the  product tree for an input product code in the format of an adjacency list

    Args:
        pcode: product code of interest
        verbose: if True, prints out logs

    Returns:
        Dict[str, List[str]]: A dictionary where dictionary[knumber] is a list of all direct descendents of knumber

    Example:
        form_tree('MYN') -> 

            {
                'P000041': ['K201560', 'K210666'], 
                'P980025': ['K210365', 'K212519', 'K213795'], 
                'MYN': ['P000041', 'P980025']
            }
    """

    nums = get_nums(pcode, 500)  # Get all knumbers

    adj_list = defaultdict(list)
    visited = set()
    in_degree = defaultdict(int)

    for i, num in enumerate(nums):
        path = to_root(num)  # Scrapes the root path for each knum in nums

        if verbose:
            print(f'Starting new path at {num}, iter {i+1}/{len(nums)}')
            print(path, '\n')

        # Iterate up the root path, adding parent-child relationships to adj_list as necessary
        for i in range(len(path)-1, 0, -1):
            parent, child = path[i], path[i-1]
            visited.update([parent, child])
            in_degree[child] += 1
            if child not in adj_list[parent]:
                adj_list[parent].append(child)

    # Add all "origin" devices to adj_list as descendents of the product code itself
    for node in visited:
        if in_degree[node] == 0:
            adj_list[pcode].append(node)

    return adj_list


def form_branch(root_path: List[str]) -> Tuple[Dict[str, List[str]], str]:
    """
    For a given root path (via to_root(...)), converts to an adjacency list of all predicates and descendents

    Args:
        root_path: a list of knumbers as provided by to_root(...)

    Returns:
        Dict[str, List[str]]: A dictionary where dictionary[knumber] is a list of all direct descendents of knumber
        str: The corresponding product code for input root_path
    """

    # Determines the corresponding product for this root path
    url = f'https://api.fda.gov/device/510k.json?search={root_path[0]}'
    response = urllib.request.urlopen(url)
    db = json.loads(response.read())
    pcode = db['results'][0]['product_code']

    # Intializes adjacency list and adds all predicate relationships
    adj_list = defaultdict(list)
    for i in range(len(root_path)-1):
        adj_list[root_path[i+1]].append(root_path[i])
    adj_list[pcode].append(root_path[-1])

    """
    Now we need to add all descendents of the queried knumber.
    Ultimately, instead of rescraping the entire product code for any given submission number, 
    you should just pull the tree from some sort of cache/database
    """
    entire_tree = form_tree(pcode)
    q = deque([root_path[0]])
    seen = [root_path[0]]

    # Simple BFS starting from root_path[0]
    while (q):
        cur = q.popleft()
        adj_list[cur] = entire_tree[cur]
        for child in adj_list[cur]:
            if child not in seen:
                seen.append(child)
                q.append(child)

    return adj_list, pcode


def get_node_val(adj_list: Dict[str, List[str]], pcode: str) -> Tuple[List[str], Dict[str, int]]:
    """
    Calculates generation value for each node in adjacency list

    Args:
        adj_list: Adjacency list as returned by form_branch(...) or form_tree(...)
        pcode: product code 

    Returns:
        List[str]: list of all unique nodes present in adj_list
        Dict[str, int]: dictionary where Dict[knum] represents generation value for knum
    """

    nodes = []
    values = {}

    stk = []
    stk.append((pcode, 0))

    # Simple DFS on the adjacency list
    while stk:
        node, level = stk.pop()
        if node in nodes:
            continue

        nodes.append(node)
        values[node] = level

        for child in adj_list[node]:
            stk.append((child, level+1))

    return nodes, values


def to_json(pcode: str, adj_list: Dict[str, List[str]], nodes: List[str], values: Dict[str, int]):
    """
    Takes all the relevant information for a product/knumber tree and dumps it in a JSON

    Args:
        pcode: product code
        adj_list: adjacency list as returned by form_branch(...) or form_tree(...)
        nodes, values: as returned by get_node_val(...)

    Returns:    
        A JSON with the following shape...
        {
            {'tree': ... },
            {'info': ... }
        }
    """

    res = {}
    res['tree'] = adj_list
    res['info'] = {}

    # Pull relevant information from openFDA API for each node
    url = f'https://api.fda.gov/device/510k.json?search={pcode}&limit=500'

    response = urllib.request.urlopen(url)
    db = json.loads(response.read())

    # Append all the information to result
    for doc in db['results']:
        if doc['k_number'] in nodes:
            res['info'][doc['k_number']] = {
                'DECISION_DATE': doc['decision_date'],
                'PRODUCT_CODES': doc['product_code'],
                'DEVICE_TRADE_NAME': doc['device_name'],
                'GENERATION': values[doc['k_number']]
            }

    # Add generation values for each node to JSON
    for n in nodes:
        if n not in res['info']:
            res['info'][n] = {}
            res['info'][n]['GENERATION'] = values[n]

    return json.dumps(res)
