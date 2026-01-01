import json
import os
from unittest import result
import uuid
INDEX_FILE='index_file.json'
DETAILS_FILE='details_file.json'
class JsonDatabase:
    def load_data(filename,default_type):
        if not os.path.exists(filename):
            os.new_file=open(filename,"w",encoding="utf-8")
            return default_type
        else: #如果有文件则读入文件
            with open(filename,"r",encoding="utf-8") as f:
                return json.load(f)
    def save_data(filename,data):
        if not os.path.exists(filename): #如果没有文件则创建
            os.new_file=open(filename,"w",encoding="utf-8")
        with open(filename,"w",encoding="utf-8") as f:
            json.dump(data,f,ensure_ascii=False,indent=4)
        print(f"数据已经存储至 {filename} ")
    def add_data(name,alias,tags,bio):
        #准备旧数据
        index_data=load_data(INDEX_FILE,[])
        details_data=load_data(DETAILS_FILE,{})
            #添加自动 id 生成#
        id=uuid.uuid4().hex[:8]
        #注意这里需要比对uuid是否重复
        while id in index_data: #如果id重复，则重新生成
            id=uuid.uuid4().hex[:8]
        #准备新数据格式
        new_index_data={"id":id,"name":name,"alias":alias,"tags":tags}
        new_details_data={"bio":bio,'full_tags':tags.split("."),"imagepath":f"images/{id}.png"}
        #向数据内部下新数据
        index_data.append(new_index_data)
        details_data[id]=new_details_data
        #写入
        save_data(INDEX_FILE,index_data)
        save_data(DETAILS_FILE,details_data)
        print(f"已经写入名称为{name}的数据")
    def seach_data(keyword):#搜索函数
        index_data=load_data(INDEX_FILE,[])
        results=[]
        keyword=keyword.lower()
        for item in index_data:
            name=str(item.get("name","")).lower()
            alias=str(item.get("alias","")).lower()
            tags=str(item.get("tags","")).lower()
            seach_soup=f"{name} {alias} {tags}"
            if keyword in seach_soup :
                results.append(item)
        return results
    def read_data(read_id):
        details_data=load_data(DETAILS_FILE,{})
        index_data=load_data(INDEX_FILE,[])
        details_info=details_data.get(read_id)
        found_info=None
        for item in index_data:
            if item["id"]==read_id:
                found_info=item
                break
        if found_info and details_info:
            full_info={**found_info,**details_info}
            return full_info
        elif found_info:
            return found_info
        print("未找到该ID")
        return None