import wikipediaapi
import asyncio
from aiohttp import web #need 'pip install aiohttp'
import json
import pandas as pd
import numpy as np
import re
from pecab import PeCab
from concurrent.futures import ThreadPoolExecutor
from sklearn.feature_extraction.text import TfidfVectorizer #need 'pip install scikit-learn'
from sklearn.metrics.pairwise import cosine_similarity
import requests
from bs4 import BeautifulSoup
import threading
from konlpy.tag import Okt
from sentence_transformers import SentenceTransformer
from homonym_handler.homonym_handler import homonym_handling

WIKI = wikipediaapi.Wikipedia('201803851@o.cnu.ac.kr','ko')
ADDRESS = '127.0.0.1'
PORT = 8888

okt = Okt()
model = SentenceTransformer('homonym_handler/model')

def wiki_data_json(word, summary, explain, related):
    result = {'word': word, 'summary': summary, 'explain' : explain, 'related': related}
    return json.dumps(result, ensure_ascii=False)

# def fetch_page_text(link):
#     page = WIKI.page(link)
#     if page.exists():
#         return (link, page.text)
#     return (link, "")

# def get_top_related_words(related, text, top_n=5):
#     with ThreadPoolExecutor(max_workers=10) as executor:
#         future_to_link = {executor.submit(fetch_page_text, link): link for link in related.keys()}
#         related_texts = []
#         related_titles = []

#         for future in future_to_link:
#             link, page_text = future.result()
#             if page_text:  # 빈 페이지 텍스트는 제외
#                 related_texts.append(page_text)
#                 related_titles.append(link)

#     if not related_texts:
#         return []

    # # TF-IDF Vectorizer 적용
    # vectorizer = TfidfVectorizer()
    # vectors = vectorizer.fit_transform([text] + related_texts)
    
    # # 코사인 유사도 계산 (첫 번째 벡터는 검색어에 해당)
    # cosine_similarities = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    # # 유사도가 높은 상위 n개 관련 단어 선택
    # top_indices = cosine_similarities.argsort()[-top_n:][::-1]
    # top_related = [related_titles[i] for i in top_indices]

    # return top_related

def get_sections(sections, dept = 2):
    sections_str = []
    related = 'none'
    for section in sections:
        if(section != ''):
            sectionStr = str(dept) + "|" + section.title + "|" + section.text
            if(section.title == "같이 보기"):
                related = sectionStr
            else:
                sections_str.append(sectionStr)
                sections_str2,_ = get_sections(section.sections, dept = dept+1)
                if sections_str2:
                    sections_str = sections_str + sections_str2
        
    return sections_str, related

def get_text(wikiReader):
    # top_related = get_top_related_words(related, original_text)
    sections = wikiReader.sections
    sectionArr, related = get_sections(sections)
    str_section = '|-|'.join(sectionArr)
    return str_section, related

def check_homonym(wikiReader):
    for category in list(wikiReader.categories.keys()):
            if('동음이의' in category or '동명이인' in category):
                return True
    return False

    
# def clean_text(text):
#     # LaTeX 형식의 수식 및 기호 제거
#     text = re.sub(r'\{\{[^{}]+\}\}', '', text)  # 중괄호 내부의 LaTeX 수식 제거
#     text = re.sub(r'\{\\displaystyle [^{}]+\}', '', text)  # \displaystyle 제거
#     text = re.sub(r'\{\\mathcal [^{}]+\}', '', text)  # \mathcal 제거
#     text = re.sub(r'\\displaystyle', '', text)  # \displaystyle 제거
#     text = re.sub(r'\\mathcal', '', text)  # \mathcal 제거
#     text = re.sub(r'\$[^\$]*\$', '', text)  # $...$ 형식의 LaTeX 수식 제거

#     # 연속된 공백을 하나의 공백으로 축소
#     text = re.sub(r'\s+', ' ', text)
#     text = re.sub(r'\{\{[^\}]+\}\}', '', text)  # 중괄호 내부 내용 제거
#     text = re.sub(r'\[\[[^\]]+\]\]', '', text)  # 대괄호 내부 내용 제거
#     text = re.sub(r'{[^{}]+}', '', text)  # 중괄호 내부 내용 제거

#     return text

def pre_text(text): #출처 : https://icedhotchoco.tistory.com/entry/DAY-64 // 뉴스 토픽 분류 - KoNLpy, 어간 추출, 불용어 제거, tfidfVectorizer
    word_list = []
    okt_pos = okt.pos(text, norm=True, stem=True)

    for word in okt_pos:
        if word[1] not in ['Josa', 'Eomi', 'Punctuation']:
            word_list.append(word[0])
    
    result = " ".join(word_list)

    return result

def handle_homonym(links, original_text):
    best_match = None
    # highest_similarity = 0
    # vectorizer = TfidfVectorizer()
    # original_text = ' '.join(original_text)
    # original_text = pre_text(original_text)
    # origin_transform = vectorizer.fit_transform([original_text])
    # original_vector = origin_transform.toarray()[0]
    link_unhomonym = []
    threadArr = []
    
    # def thread_function(link, original_vector, id, vectorizer):
    def thread_function(link, original_text, id, model):
        linkReader = WIKI.page(link)
        # link_text = linkReader.text
        # link_text = pre_text(link_text)
        # link_vector = vectorizer.transform([link_text]).toarray()[0]
        # similarity = cosine_similarity([original_vector], [link_vector])[0][0]
        link_summary = linkReader.summary + "\n"
        link_summary = link_summary.split('\n')[0]
        similarity = homonym_handling(model, original_text, link_summary)

        print(linkReader.title+"||"+str(similarity))
        similarities[id] = similarity

    for link in links:
        if '동음이의' in link or '동명이인' in link:
            continue
        else:
            link_unhomonym.append(link)
            
    similarities = [0.0]*len(link_unhomonym)
    idNum = 0    
    for link in link_unhomonym:    
        # thread = threading.Thread(target = thread_function, args = (link, original_vector, idNum, vectorizer))
        thread = threading.Thread(target = thread_function, args = (link, original_text, idNum, model))
        thread.start()
        threadArr.append(thread)
        idNum = idNum+1
    
    for thread in threadArr:
        thread.join()

    best_match = link_unhomonym[similarities.index(max(similarities))]
    return best_match

def re_search(wikiReader, original_text):
    links = wikiReader.links
    best_match_text = handle_homonym(links, original_text)
    result_page = WIKI.page(best_match_text)
    return result_page


def search_wiki(data):
    text = data['text']
    # usePara = data['usePara']
    usePara = data['usePara'][0]
    wikiReader = WIKI.page(text)
    if(wikiReader.exists()):
        if check_homonym(wikiReader):
            wikiReader = re_search(wikiReader, usePara)
        print(wikiReader.text)
        word = text
        summary = wikiReader.summary
        explain, related = get_text(wikiReader)
        result = wiki_data_json(word, summary, explain, related)
        return result
    else:
        return wiki_data_json(text, '해당 단어가 존재하지 않습니다.', '해당 단어가 존재하지 않습니다.', '해당 단어가 존재하지 않습니다.')

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