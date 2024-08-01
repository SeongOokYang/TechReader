import wikipediaapi
import asyncio
from aiohttp import web #need 'pip install aiohttp'
import json
import pandas as pd
import numpy as np
import re
from pecab import PeCab
import requests
from bs4 import BeautifulSoup
import homonym_handling.homonym_handler as homonym_handler

WIKI = wikipediaapi.Wikipedia('201803851@o.cnu.ac.kr','ko')
ADDRESS = '127.0.0.1'
PORT = 8888

def wiki_data_json(word, summary, explain, related):
    result = {'word': word, 'summary': summary, 'explain' : explain, 'related': related}
    return json.dumps(result, ensure_ascii=False)

def related2str(related):
    result = []
    for link in related.values():
        link, _ = str(link).split(" (id:")
        result.append(link)

    return str(result)

def check_homonym(wikiReader):
    for category in list(wikiReader.categories.keys()):
            if('동음이의' in category or '동명이인' in category):
                return True
    return False

def handle_homonym(fullText, links, usePara):
    linkArr = []
    texts = fullText.split('\n')
    textArr = []
    linkStrs = related2str(links)
    linkStrs = re.sub(r'^\[|\]$',"",linkStrs)
    links = linkStrs.split(",")
    for link in links:
        if('동음이의' in link or '동명이인' in link):
            continue
        linkArr.append(link)

    for link in linkArr:
        for text in texts:
            if link in text:
                textArr.append(text)
    result_Reader = homonym_handler.checkSimilarity(textArr, usePara)
    # similarArr = checkSimilarity(linkArr, usePara)    
    # max_index = similarArr.index(max(similarArr))
    # result_Reader = WIKI.page(links[max_index])

    return result_Reader
    

def re_search(wikiReader, usePara):
    '''
    동음이의어 페이지로 넘어갔을 때, 동음이의어들의 정의가 존재하는지 확인하는 함수
    '''
    links = wikiReader.links
    text = wikiReader.text
    result_page = WIKI.page(handle_homonym(text, links, usePara))
    return result_page

def search_wiki(data):
    text = data['text']
    usePara = data['usePara']
    wikiReader = WIKI.page(text)
    if(wikiReader.exists()):
        if(check_homonym(wikiReader)):
            wikiReader = re_search(wikiReader, usePara)
        print(wikiReader.text)
        word = text
        summary = wikiReader.summary
        explain = wikiReader.text
        related = wikiReader.links
        related = related2str(related)
        result = wiki_data_json(word, summary, explain, related)
        return result
    else:
        print('해당 단어가 존재하지 않습니다.') 
        return wiki_data_json(text, '해당 단어가 존재하지 않습니다.','해당 단어가 존재하지 않습니다.','해당 단어가 존재하지 않습니다.')

async def handle_request(request):
    data = await request.json()
    data = data.get('request')
    print(data)
    return web.Response(text = search_wiki(data))

def crawl_text(url):
    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, 'html.parser')
        result = re.sub("\n+", "\n", soup.get_text())
        return result
    else:
        print(response.status_code)
        return 'error in crawl_text'

async def get_web_text(request):
    data = await request.json()
    data = data.get('request')
    print(data)
    return web.Response(text = crawl_text(data))

def main():
    app = web.Application()
    app.router.add_post('/',handle_request)
    app.router.add_post('/get_text', get_web_text)
    web.run_app(app, host=ADDRESS, port=PORT)

if __name__ == "__main__":

    main()