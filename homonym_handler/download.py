from sentence_transformers import SentenceTransformer

model = SentenceTransformer('bongsoo/albert-small-kor-sbert-v1')

model.save('model')