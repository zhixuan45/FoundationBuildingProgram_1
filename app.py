from flask import Flask, jsonify, request
from flask_cors import CORS
from jsondatabase import JsonDatabase
from flask import request
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
@app.route('/api/character', methods=['post'])
def add_character():
    data = request.get_json()
    db.add_data(
        name=data['name'],
        alias=data['alias'],
        tags=data['tags'],
        bio=data['bio']
    )
    return jsonify({"status": "success"})
@app.route('/api/character/<char_id>', methods=['DELETE'])
def delete_character(char_id):
    db.del_data(char_id)
    return jsonify({"status": "deleted"})
@app.route('/api/character/<char_id>', methods=['PUT'])
def update_character(char_id):
    data = request.get_json()
    db.update_data(
        char_id,
        name=data.get('name'),
        alias=data.get('alias'),
        tags=data.get('tags'),
        bio=data.get('bio')
    )
    return jsonify({"status": "updated"})
if __name__ == '__main__':
    app.run(debug=True, port=5000)