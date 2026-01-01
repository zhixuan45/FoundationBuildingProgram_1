import jsondatabase

# 创建数据库实例
db = jsondatabase.JsonDatabase()

def seach():
    user_input = input("请输入搜索关键词: ") 
    
    # === 第一步：链接搜索函数 ===
    search_results = db.seach_data(user_input)
    
    if not search_results:
        print("没找到相关内容。")
        return

    # === 第二步：展示搜索结果列表 ===
    print(f"找到了 {len(search_results)} 个结果：")
    for i, item in enumerate(search_results):
        # 打印序号、名称和 ID
        print(f"[{i}] 名称: {item['name']} 别名：{item['alias']} (ID: {item['id']})")

    # === 第三步：用户选择 ===
    choice = input("请输入你想查看的序号 (0, 1, ...): ")
    try:
        index = int(choice)
        selected_item = search_results[index] # 拿到用户选的那个字典
        selected_id = selected_item['id']     # 【关键点】拿到了 ID！
        
        # === 第四步：链接读取函数 ===
        full_content = db.read_data(selected_id) 
        
        if full_content:
            print("-" * 20)
            print(f"正在显示【{full_content['name']}】的详细内容...")
            print(f"别名：{full_content.get('alias')}")
            print(f"标签: {full_content.get('tags')}")
            print(f"详情: {full_content.get('bio1')}") # 假设详情存在 content 字段里
            print(f"图片: {full_content.get('imagepath')}")
            print("-" * 20)
            
    except (ValueError, IndexError):
        print("输入错误，请重新开始。")

def add():
    name = input("请输入名称: ")
    alias = input("请输入别名: ")
    tags = input("请输入标签（用点号分隔）: ")
    bio = input("请输入简介: ")
    
    # === 直接调用添加函数 ===
    db.add_data(name, alias, tags, bio)

def main():
    while True:
        action = input("请选择操作：1. 搜索 2. 添加 3. 退出 (输入数字): ")
        if action == '1':
            seach()
        elif action == '2':
            add()
        elif action == '3':
            print("退出程序。")
            break
        else:
            print("无效输入，请重新选择。")
if __name__ == "__main__":
    main()