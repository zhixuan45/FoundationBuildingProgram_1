import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from jsondatabase import JsonDatabase
app = Flask(__name__)
CORS(app)  # 允许跨域请求，方便前端调用
db = JsonDatabase()

@app.route('/api/characters', methods=['GET'])
def get_characters():
    # 获取所有索引数据
    # 注意：为了配合你的 script.js，我们可能需要合并一些详情数据
    index_data = db.load_data('index_file.json', [])
    
    # 格式化数据以匹配 script.js 的需求 (image, name, tags, desc)
    formatted_data = []
    for item in index_data:
        full_info = db.read_data(item['id'])
        # 如果详情不存在，至少保留索引信息
        info = full_info if full_info else item
        formatted_data.append({
            "id": item['id'],
            "name": item['name'],
            "alias": info.get('alias', ''),
            "image": info.get('imagepath', ''),
            # 兼容处理：如果 full_tags 不存在，则尝试切割 tags 字符串
            "tags": info.get('full_tags') or item.get('tags', '').replace('.', ',').split(','),
            "desc": info.get('bio', '暂无描述')[:50] + "..."  # 截取前50字符作为简介
        })
    return jsonify(formatted_data)

@app.route('/api/search', methods=['GET'])
def search():
    keyword = request.args.get('keyword',"")
    print(f"搜索关键词：{keyword}")
    search_results = db.search_data(keyword)
    
    # 格式化搜索结果，确保包含图片和描述，以便前端 renderCards 函数正常显示
    formatted_data = []
    for item in search_results:
        full_info = db.read_data(item['id'])
        info = full_info if full_info else item
        formatted_data.append({
            "id": item['id'],
            "name": item['name'],
            "alias": info.get('alias', ''),
            "image": info.get('imagepath', ''),
            # 统一将点号或逗号分隔的标签转为数组
            "tags": info.get('full_tags') or item.get('tags', '').replace('.', ',').split(','),
            "desc": info.get('bio', '暂无描述')
        })
    return jsonify(formatted_data)
@app.route('/api/character', methods=['POST'])
def add_character():
    # 检查请求类型，支持 JSON 或 multipart/form-data (带图片上传)
    if request.is_json:
        data = request.get_json()
        name = data.get('name')
        alias = data.get('alias')
        tags = data.get('tags')
        bio = data.get('bio')
        image_file = None
    else:
        name = request.form.get('name')
        alias = request.form.get('alias')
        tags = request.form.get('tags')
        bio = request.form.get('bio')
        image_file = request.files.get('image')

    new_id = db.add_data(
        name=name,
        alias=alias,
        tags=tags,
        bio=bio
    )

    # 如果有图片上传，保存图片
    if image_file and new_id:
        # 确保 images 目录存在
        if not os.path.exists('images'):
            os.makedirs('images')
        
        # 保存图片，文件名与 ID 关联 (数据库中硬编码了 images/{id}.png)
        # 注意：这里强制保存为 png 后缀以匹配数据库逻辑
        image_path = os.path.join('images', f"{new_id}.png")
        image_file.save(image_path)

    return jsonify({"status": "success", "id": new_id})
@app.route('/api/character/<char_id>', methods=['DELETE'])
def delete_character(char_id):
    db.del_data(char_id)
    return jsonify({"status": "deleted"})
@app.route('/api/character/<char_id>', methods=['PUT'])
def update_character(char_id):
    # 1. 检查请求类型，支持 JSON 或 multipart/form-data (带图片上传)
    if request.is_json:
        data = request.get_json()
        name = data.get('name')
        alias = data.get('alias')
        tags = data.get('tags')
        bio = data.get('bio')
        image_file = None
    else:
        name = request.form.get('name')
        alias = request.form.get('alias')
        tags = request.form.get('tags')
        bio = request.form.get('bio')
        image_file = request.files.get('image')

    db.update_data(
        char_id,
        name=name,
        alias=alias,
        tags=tags,
        bio=bio
    )

    # 2. 如果上传了新图片，则覆盖旧图片
    if image_file:
        if not os.path.exists('images'):
            os.makedirs('images')
        image_path = os.path.join('images', f"{char_id}.png")
        image_file.save(image_path)

    return jsonify({"status": "updated"})
if __name__ == '__main__':
    app.run(debug=True, port=5000)