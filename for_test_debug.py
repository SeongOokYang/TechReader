import wikipediaapi
import pandas as pd
import numpy as np
import re

wiki = wikipediaapi.Wikipedia('201803851@o.cnu.ac.kr','ko')

wikiReader = wiki.page('갤럭시')
print(wikiReader.text)