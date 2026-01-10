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
    def save_data(self, filename, data):#保存数据
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
        return id
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
        """从数据文件中读取指定ID的数据信息
        
        该方法会从details文件和index文件中加载数据，并根据提供的ID查找完整信息。
        如果两个文件中都存在对应ID的数据，则合并返回；如果只在index文件中存在，
        则返回index中的数据；如果都不存在，则返回None。
        
        Args:
            read_id: 要读取的数据的ID
            
        Returns:
            dict or None: 如果找到数据则返回包含完整信息的字典，否则返回None
        """
        # 从details文件加载数据，如果文件不存在则返回默认空字典
        details_data=self.load_data(DETAILS_FILE,{})
        # 从index文件加载数据，如果文件不存在则返回默认空列表
        index_data=self.load_data(INDEX_FILE,[])
        # 获取details数据中对应ID的信息
        details_info=details_data.get(read_id)
        
        # 在index数据中查找匹配ID的项目
        found_info=None
        for item in index_data:
            if item["id"]==read_id:
                found_info=item
                break
        # 根据details和index中数据的存在情况返回相应结果
        if found_info and details_info:
            full_info={**found_info,**details_info}
            return full_info
        elif found_info:
            return found_info
        print("未找到该ID")
        return None

    def del_data(self, del_id):
        """根据ID删除数据"""
        index_data = self.load_data(INDEX_FILE, [])
        details_data = self.load_data(DETAILS_FILE, {})
        
        # 检查是否存在该ID
        initial_len = len(index_data)
        #从index_data列表中过滤掉id等于del_id的项目，生成新的列表
        index_data = [item for item in index_data if item["id"] != del_id]
        
        if len(index_data) < initial_len:
            try:
                details_data.pop(del_id, None)
                self.save_data(INDEX_FILE, index_data)
                self.save_data(DETAILS_FILE, details_data)
                print(f"成功删除 ID 为 {del_id} 的数据")
                return True
            except Exception as e:
                print(f"删除过程中发生错误: {e}")
                return False
        else:
            print(f"未找到 ID 为 {del_id} 的数据，删除失败")
            return False

    def update_data(self, update_id, name=None, alias=None, tags=None, bio=None):
        """根据ID修改数据，仅更新传入的非空参数"""
        index_data = self.load_data(INDEX_FILE, [])
        details_data = self.load_data(DETAILS_FILE, {})
        
        found = False
        for item in index_data:
            if item["id"] == update_id:
                if name is not None: item["name"] = name
                if alias is not None: item["alias"] = alias
                if tags is not None: 
                    item["tags"] = tags
                    # 同步更新 details 中的 full_tags
                    if update_id in details_data:
                        details_data[update_id]["full_tags"] = tags.split(".")
                found = True
                break
        
        if found:
            if bio is not None and update_id in details_data:
                details_data[update_id]["bio"] = bio
            
            self.save_data(INDEX_FILE, index_data)
            self.save_data(DETAILS_FILE, details_data)
            print(f"成功更新 ID 为 {update_id} 的数据")
            return update_id
        else:
            print(f"未找到 ID 为 {update_id} 的数据，更新失败")
            return False