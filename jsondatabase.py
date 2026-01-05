import json
import os
from unittest import result
import uuid
INDEX_FILE='index_file.json'
DETAILS_FILE='details_file.json'
class JsonDatabase:
    def load_data(self, filename, default_type):
        if not os.path.exists(filename):
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(default_type, f)
            return default_type
        else: #如果有文件则读入文件
            with open(filename,"r",encoding="utf-8") as f:
                return json.load(f)
    def save_data(self, filename, data):
        with open(filename,"w",encoding="utf-8") as f:
            json.dump(data,f,ensure_ascii=False,indent=4)
        print(f"数据已经存储至 {filename} ")
    def add_data(self, name, alias, tags, bio):
        #准备旧数据
        index_data=self.load_data(INDEX_FILE,[])
        details_data=self.load_data(DETAILS_FILE,{})
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
        self.save_data(INDEX_FILE,index_data)
        self.save_data(DETAILS_FILE,details_data)
        print(f"已经写入名称为{name}的数据")
    def search_data(self, keyword):  # 搜索函数
        """
        参数:
            keyword (str): 要搜索的关键词，函数内部会将其转换为小写进行匹配
        返回:
            list: 包含所有匹配项的列表，每个匹配项都是一个字典对象
        """
        index_data = self.load_data(INDEX_FILE, [])  # 从索引文件加载数据
        results = []  # 初始化结果列表
        keyword = keyword.lower()  # 将关键词转换为小写以进行不区分大小写的搜索
        
        for item in index_data:  # 遍历所有索引数据
            name = str(item.get("name", "")).lower()  # 获取项目名称并转为小写
            alias = str(item.get("alias", "")).lower()  # 获取项目别名并转为小写
            tags = str(item.get("tags", "")).lower()  # 获取项目标签并转为小写
            search_soup = f"{name} {alias} {tags}"  # 组合所有字段用于搜索匹配
            
            if keyword in search_soup:  # 检查关键词是否在组合字符串中
                results.append(item)  # 将匹配的项目添加到结果列表
                
        return results
    def read_data(self, read_id):
        details_data=self.load_data(DETAILS_FILE,{})
        index_data=self.load_data(INDEX_FILE,[])
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
