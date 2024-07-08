import wikipediaapi
import asyncio
from aiohttp import web #need 'pip install aiohttp'
import json
import pandas as pd
import numpy as np
import re
from pecab import PeCab

WIKI = wikipediaapi.Wikipedia('201803851@o.cnu.ac.kr','ko')
ADDRESS = '127.0.0.1'
PORT = 8888

def wiki_data_json(word, summary, explain, related):
    result = {'word': word, 'summary': summary, 'explain' : explain, 'related': related}
    return json.dumps(result, ensure_ascii=False)
    
#def re_search(homonym:str):
#    '''
##    동음이의어 페이지로 넘어갔을 때, 동음이의어들의 정의가 존재하는지 확인하는 함수
#    '''
#    result_arr = {}
#    re_texts = homonym.split('\n')[2:]
#    for re_text in re_texts:
#        re_text = remove_section(re_text)
#        exist_finder = WIKI.page(re_text)
#        result_arr[re_text] = exist_finder.exists()
#
#    return result_arr

#def remove_section(text:str):
#    '''
#    chatGPT 생성 코드 - wikipedia의 단어가 ~~~(section)과 같이 되어 있을때 검색 결과가 나오지 않으므로 제거해주어야 함
#    '''
#
#    pattern = r"\([^()]*\)"
#    result = re.sub(pattern, "", text)
#
#    return result

def search_wiki(text:str):
    wikiReader = WIKI.page(text)
    if(wikiReader.exists()):
        #if(list(wikiReader.categories.keys())[0] == '분류:동음이의어 문서'):
        #    exist_check = re_search(wikiReader.text)
        #else:
        print(wikiReader.text)
        word = text
        summary = wikiReader.summary
        explain = wikiReader.text
        related = wikiReader.links
        related = str(related)
        result = wiki_data_json(word, summary, explain, related)
        return result
    else:
        print('해당 단어가 존재하지 않습니다.')
        return '해당 단어가 존재하지 않습니다.'

async def handle_request(request):
    data = await request.json()
    data = data.get('request')
    print(data)
    return web.Response(text = search_wiki(data))

def main():
    app = web.Application()
    app.router.add_post('/',handle_request)
    web.run_app(app, host=ADDRESS, port=PORT)

if __name__ == "__main__":

    main()