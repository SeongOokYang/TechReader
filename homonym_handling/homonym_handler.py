from konlpy.tag import Okt
from sklearn.feature_extraction.text import TfidfVectorizer
import threading


def checkSimilarity(texts, useParaList):
    okt = Okt()
    tfvect = TfidfVectorizer()
    similarArr = []
    threads = []

    for i in range(len(texts)):
        similarArr.append(i)
    print(similarArr)
    
    def checkThread(id, text):
        Y = tfvect.transform(text)
        dtm = Y.toarray()
        print(f'{id} {dtm}')
        similarArr[id] = sum(dtm)
    
    oktUseParas = []
    for usepara in useParaList:
        oktUsePara = okt.morphs(usepara)
        oktUseParas.append(" ".join(oktUsePara))
    
    X = tfvect.fit_transform(oktUseParas)

    idNum = 0
    for text in texts:
        oktText = okt.morphs(text)
        thread = threading.Thread(target=checkThread, args=(idNum, oktText))
        threads.append(thread)
        thread.start()
        idNum = idNum + 1
    
    for thread in threads:
        thread.join()

    print(similarArr)

    result = texts[similarArr.index(max(similarArr))]

    return result