import wikipediaapi
import pandas as pd
import numpy as np
import re
from pecab import PeCab

def remove_section(text:str):
    '''
    chatGPT 생성 코드 - wikipedia의 단어가 ~~~(section)과 같이 되어 있을때 검색 결과가 나오지 않으므로 제거해주어야 함
    '''

    pecab = PeCab()

    pattern = r"\([^()]*\)"
    result = re.sub(pattern, "", text)
    pecab_pos = pecab.pos(result)
    print(pecab_pos)

    return result

def search_wiki(text:str):
    wikiReader = wiki.page(text)

    if(wikiReader.exists()):
        if(list(wikiReader.categories.keys())[0] == '분류:동음이의어 문서'):
            re_searchs = wikiReader.text.split('\n')[2:]
            for re_text in re_searchs:
                re_text = remove_section(re_text)
                search_wiki(re_text)
        else:
            print(wikiReader.text)
    else:
        print('해당 단어가 존재하지 않습니다.')

wiki = wikipediaapi.Wikipedia('201803851@o.cnu.ac.kr','ko')

search_wiki('SDP')