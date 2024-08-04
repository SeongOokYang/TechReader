import wikipediaapi
import asyncio
from aiohttp import web #need 'pip install aiohttp'
import json
import pandas as pd
import numpy as np
import re
from pecab import PeCab
from sklearn.feature_extraction.text import TfidfVectorizer #need 'pip install scikit-learn'
from sklearn.metrics.pairwise import cosine_similarity

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

    
def clean_text(text):
    # LaTeX 형식의 수식 및 기호 제거
    text = re.sub(r'\{\{[^{}]+\}\}', '', text)  # 중괄호 내부의 LaTeX 수식 제거
    text = re.sub(r'\{\\displaystyle [^{}]+\}', '', text)  # \displaystyle 제거
    text = re.sub(r'\{\\mathcal [^{}]+\}', '', text)  # \mathcal 제거
    text = re.sub(r'\\displaystyle', '', text)  # \displaystyle 제거
    text = re.sub(r'\\mathcal', '', text)  # \mathcal 제거
    text = re.sub(r'\$[^\$]*\$', '', text)  # $...$ 형식의 LaTeX 수식 제거

    # 연속된 공백을 하나의 공백으로 축소
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\{\{[^\}]+\}\}', '', text)  # 중괄호 내부 내용 제거
    text = re.sub(r'\[\[[^\]]+\]\]', '', text)  # 대괄호 내부 내용 제거
    text = re.sub(r'{[^{}]+}', '', text)  # 중괄호 내부 내용 제거

    return text
def handle_homonym(links, original_text):
    best_match = None
    highest_similarity = 0
    vectorizer = TfidfVectorizer()
    origin_transform = vectorizer.fit_transform([original_text])
    original_vector = origin_transform.toarray()[0]

    for link in links:
        if '동음이의' in link or '동명이인' in link:
            continue
        
        linkReader = WIKI.page(link)
        if linkReader.exists():
            link_text = linkReader.text
            link_vector = vectorizer.transform([link_text]).toarray()[0]
            similarity = cosine_similarity([original_vector], [link_vector])[0][0]

            if similarity > highest_similarity:
                highest_similarity = similarity
                best_match = link

    if best_match:
        return best_match
    else:
        return 'tree (명령어)'  # 적절한 기본값을 반환하는 부분으로 보임

def re_search(wikiReader, original_text):
    links = wikiReader.links
    best_match_text = handle_homonym(links, original_text)
    result_page = WIKI.page(best_match_text)
    return result_page

def search_wiki(text: str):
    wikiReader = WIKI.page(text)
    if wikiReader.exists():
        word = text
        summary = clean_text(wikiReader.summary)
        explain = clean_text(wikiReader.text)
        if check_homonym(wikiReader):
            wikiReader = re_search(wikiReader, wikiReader.text)
        word = text
        print(wikiReader.text)
        summary = wikiReader.summary
        explain = wikiReader.text
        related = wikiReader.links
        related = str(related)
        result = wiki_data_json(word, summary, explain, related)
        return result
    else:
        return wiki_data_json(text, '해당 단어가 존재하지 않습니다.', '해당 단어가 존재하지 않습니다.', '해당 단어가 존재하지 않습니다.')

async def handle_request(request):
    data = await request.json()
    data = data.get('request')
    print(data)
    print(data['usePara'])
    return web.Response(text = search_wiki(data['text']))

def main():
    app = web.Application()
    app.router.add_post('/',handle_request)
    web.run_app(app, host=ADDRESS, port=PORT)

if __name__ == "__main__":

    main()