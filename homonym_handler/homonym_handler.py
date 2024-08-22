from sklearn.metrics.pairwise import cosine_similarity

def homonym_handling(model, select_para, link_summary):
    para_encode = model.encode(select_para)
    link_encode = model.encode(link_summary)

    similarity = cosine_similarity([link_encode], [para_encode])[0][0]


    return similarity