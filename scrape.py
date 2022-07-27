from bs4 import BeautifulSoup
import pandas as pd
import requests
from typing import List
import tempfile
import urllib.request
from os import path
import PyPDF2 as ppdf
import re


def get_sub_numbers(pcodes: List[str]) -> List[str]:
    """
    Returns all 510(k) premarket submission numbers for given product codes

    Params
    ______
    pcodes :: list of interested product codes

    Returns
    _______
    list[str] :: list of scraped submission document numbers
    """

    res = []
    for pcode in pcodes:
        # TODO: Might need to add more options to this URL
        src = requests.get(
            f'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?start_search=1&Center=CDRH&Panel=&ProductCode={pcode}&KNumber=&Applicant=&DeviceName=&Type=Traditional&ThirdPartyReviewed=&ClinicalTrials=&Decision=&DecisionDateFrom=&DecisionDateTo=07%2F13%2F2022&IVDProducts=&Redact510K=&CombinationProducts=&ZNumber=&PAGENUM=500').text

        soup = BeautifulSoup(src, 'lxml')
        table = soup.find_all('table')[3]  # table of devices
        # skip all the boilerplate entries
        entries = table.tbody.find_all('tr')[4:]

        for e in entries:
            res.append(e.find_all('td')[2].text)

    return res


def get_labels(labels: List[str], sub_numbers: List[str]) -> pd.DataFrame:
    """
    Returns a DataFrame of document-specific information

    Params
    ______
    labels :: categories from the 510(k) database (e.g. Product Codes, Applicant)
    sub_numbers :: a list of submission document numbers 

    Returns
    _______
    DataFrame :: with labels as as columns and documents as rows
    """
    db = []
    for sub_num in sub_numbers:
        res = {'Submission Number': id}

        src = requests.get(
            f'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID={sub_num}').text
        soup = BeautifulSoup(src, 'lxml')
        table = soup.find_all('table')[8]  # single out the central table
        specs = table.find_all('tr')

        # Parse for relevant labels
        for s in specs:
            if s.th and s.th.text in labels:
                res[s.th.text] = s.td.text

        # Default for values not found
        for lab in labels:
            if lab not in res.keys():
                res[lab] = None

        db.append(res)

    return pd.DataFrame(db)


def clean_dates():
    pass


def clean_applicants():
    pass


# TODO: Build the string
def scan_pdf(keywords: List[str], sz=50, url: str = "https://www.accessdata.fda.gov/cdrh_docs/pdf22/K220499.pdf") -> List[str]:
    """
    Pull out relevant keyword fragments or information from document summary
    (still need to figure out what exactly should be parsed/should this be broken into more functions)

    Params
    ______
    TBD

    Returns
    _______
    TBD
    """

    res = []  # Parsed fragments
    print(type(res))

    # Pull pdf data from url
    response = urllib.request.urlopen(url)
    pg_data = response.read()

    # Write information to tempfile object
    temp_file = path.join(tempfile.gettempdir(), 'temp.pdf')
    pdf_file = open(temp_file, 'wb')
    pdf_file.write(pg_data)

    # Read tempfile object with PyPDF
    pdfDoc = ppdf.PdfFileReader(open(temp_file, 'rb'))
    for pg in pdfDoc.pages:
        pg_content = (pg.extractText() + '\n').lower()

        # regex match for keywords
        for kw in keywords:
            reSearch = re.search(kw, pg_content)
            # TODO: Figure out a better way to parse the keyword fragments?
            if reSearch is not None:
                start = reSearch.span()[0]
                end = min(start+sz, len(pg_content))
                res.append(pg_content[start:end])

    return res


if __name__ == '__main__':
    snums = get_sub_numbers(['QAS'])
    df = get_labels(['Device Classification Number',
                    'Date Received', 'Due Date'], snums)
