let allCharacters = [];
let currentEditId = null; // 用于追踪当前正在编辑的 ID，null 表示处于“新增”模式

/**
 * 1. 加载所有马娘数据
 * 使用 async 关键字表示这是一个“异步函数”。
 * 因为从服务器获取数据需要时间（网络延迟），我们不能让网页卡住等它，
 * 所以用 await 告诉浏览器：“你先去忙别的，等数据传回来了再继续执行下一行。”
 */
async function loadCharacters() {
    // fetch 就像是给后端发个短信：“请把所有马娘的数据发给我。”
    const response = await fetch('http://127.0.0.1:5000/api/characters'); 
    
    // response.json() 把后端传回来的原始文本转换成 JavaScript 能操作的“对象数组”
    const data = await response.json();
    
    // 【修复】将数据存入全局变量，方便编辑时读取原始信息
    allCharacters = data;

    // 拿到数据后，调用渲染函数把它们显示在网页上
    renderCards(data);
}

/**
 * 2. 渲染函数：负责把数据变成网页上的 HTML 卡片
 * @param {Array} characterList - 包含马娘信息的数组
 */
const renderCards = (characterList) => {
    // 获取 HTML 中 id 为 'app' 的那个 <div> 容器
    const container = document.getElementById('app');

    // 如果数组是空的（没搜到东西），显示提示文字
    if (!characterList || characterList.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">没有找到匹配的马娘</p>';
        return;
    }

    // 每次渲染前先清空容器，否则旧的卡片会一直堆在下面
    container.innerHTML = '';

    // .map() 是 JS 的神技：它遍历数组里的每一个马娘对象(char)，
    // 并根据模板生成一段 HTML 字符串。
    // `${char.name}` 这种写法叫“模板字符串”，可以直接把变量塞进字符串里。
    // 【修改】给 card 添加 onclick 事件，点击整个卡片打开详情
    // 【修改】给 button 添加 event.stopPropagation()，防止点击按钮时也触发卡片点击
    const cardsHTML = characterList.map(char => `
        <div class="card" onclick="openDetailModal('${char.id}')" style="cursor: pointer;">
            <div class="card-image">
                <img src="${char.image}" alt="${char.name}">
            </div>
            <div class="card-content">
                <h2>${char.name}</h2>
                <p>${char.alias || ''}</p>
                <div class="tags">
                    <!-- 标签也是个数组，所以我们再用一次 map 把每个标签变成 <span> -->
                    ${char.tags.map(tag => `<span class="tag tag-grass">${tag}</span>`).join('')}
                </div>
                <!-- CSS 中建议限制行数，这里只显示一部分 -->
                <p class="description" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${char.desc}</p>
            </div>
            <button class="button" onclick="event.stopPropagation(); deleteCharacter('${char.id}')">删除</button>
            <button class="button" onclick="event.stopPropagation(); prepareEdit('${char.id}')">编辑</button>
        </div>
    `).join(''); // map 完后是一个数组，用 .join('') 把它们拼成一整个长字符串

    // 最后一步：把拼好的 HTML 字符串塞进网页容器里
    container.innerHTML = cardsHTML;
}

/**
 * 3. 防抖函数 (Debounce)
 * 想象你在电梯里，每进来一个人（按一次键），电梯门就会重新等 5 秒再关。
 * 只有当没人再进来时，电梯才会启动。这能防止用户打字太快导致后端服务器崩溃。
 */
function debounce(func, delay) {
    let timer; // 记录计时器
    return function (...args) {
        clearTimeout(timer); // 如果在 delay 时间内又触发了，就清除上一次的计时
        // 重新开始计时
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 4. 搜索逻辑
 */
const performSearch = async (keyword) => {
    // 如果搜索框是空的，就加载全部数据
    if (keyword.trim() === "") {
        loadCharacters();
        return;
    }

    // 向后端的搜索接口发请求。encodeURIComponent 是为了处理中文搜索词，防止乱码。
    const response = await fetch(`http://127.0.0.1:5000/api/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await response.json();
    // 用搜索到的结果重新画一遍卡片
    renderCards(data);
};

/**
 * 5. 删除逻辑
 */
async function deleteCharacter(id) {
    if (!confirm("确定要删除这位马娘吗？此操作不可撤销。")) return;

    const response = await fetch(`http://127.0.0.1:5000/api/character/${id}`, {
        method: 'DELETE'
    });

    const result = await response.json();
    if (result.status === "deleted") {
        loadCharacters(); // 刷新列表
    } else {
        alert("删除失败");
    }
}

/**
 * --- 弹窗控制逻辑 ---
 */

// 打开表单弹窗（新增模式）
function openFormModal() {
    // 如果不是编辑模式（即点击了加号按钮），清空表单
    if (!currentEditId) {
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(i => i.value = '');
        document.getElementById('formTitle').innerText = "✨ 添加新马娘";
        document.querySelector('button[onclick="saveCharacter()"]').innerText = "确认提交";
    }
    document.getElementById('formModal').style.display = 'block';
}

// 关闭表单弹窗
function closeFormModal() {
    document.getElementById('formModal').style.display = 'none';
    currentEditId = null; // 重置编辑状态
}

// 打开详情弹窗
function openDetailModal(id) {
    const char = allCharacters.find(c => c.id === id);
    if (!char) return;

    const content = document.getElementById('detailContent');
    content.innerHTML = `
        <img id="detailImage" src="${char.image}" alt="${char.name}">
        <h2>${char.name}</h2>
        <p style="color: #666;">${char.alias || ''}</p>
        <div class="tags" style="margin: 10px 0;">
            ${char.tags.map(tag => `<span class="tag tag-grass">${tag}</span>`).join('')}
        </div>
        <p style="line-height: 1.6; white-space: pre-wrap;">${char.desc}</p>
    `;
    document.getElementById('detailModal').style.display = 'block';
}

// 关闭详情弹窗
function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// 点击弹窗外部区域关闭弹窗
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
        if (event.target.id === 'formModal') currentEditId = null;
    }
}

/**
 * 6. 编辑准备逻辑：将数据填回表单
 */
function prepareEdit(id) {
    // 从全局数据中查找，确保获取到完整的简介（而不是卡片上被截断的）
    const char = allCharacters.find(c => c.id === id);
    if (!char) return;
    
    document.getElementById('newName').value = char.name;
    document.getElementById('newAlias').value = char.alias;
    document.getElementById('newDesc').value = char.desc;
    document.getElementById('newTags').value = char.tags.join('.'); // 数组转回字符串
    
    currentEditId = id; // 进入编辑模式
    document.getElementById('formTitle').innerText = "📝 编辑马娘";
    document.querySelector('button[onclick="saveCharacter()"]').innerText = "保存修改";
    
    // 打开弹窗
    document.getElementById('formModal').style.display = 'block';
}

/**
document.getElementById('searchInput').addEventListener('input', debounce((e) => {
    performSearch(e.target.value);
}, 300));

/**
 * 7. 提交表单（新增或更新）
 */
async function saveCharacter() {
    // 1. 集输入框里的数据
    const name = document.getElementById('newName').value;
    const desc = document.getElementById('newDesc').value;
    const alias = document.getElementById('newAlias').value;
    const tagsRaw = document.getElementById('newTags').value;
    const imageInput = document.getElementById('newImage'); // 获取文件输入框

    // 验证必要字段是否为空
    // 如果名称或描述为空，则显示警告并退出函数
    if (!name || !desc) {
        alert("名字和简介不能为空哦！");
        return;
    }

    // 后端 jsondatabase.py 期望 tags 是用 "." 分隔的字符串
    // 我们把用户输入的逗号统一换成点
    const formattedTags = tagsRaw.replace(/[,，、]/g, '.');

    // 使用 FormData 替代 JSON，以便支持文件上传
    const formData = new FormData();
    formData.append('name', name);
    formData.append('alias', alias);
    formData.append('tags', formattedTags);
    formData.append('bio', desc);

    // 如果用户选择了文件，才添加到 formData 中
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    // 2. 根据是否有 currentEditId 决定是 POST 还是 PUT
    const url = currentEditId 
        ? `http://127.0.0.1:5000/api/character/${currentEditId}`
        : 'http://127.0.0.1:5000/api/character';
    
    const method = currentEditId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method: method,
        // 注意：使用 FormData 时，不要手动设置 Content-Type
        // 浏览器会自动识别并设置为 multipart/form-data
        body: formData
    });

    const result = await response.json();
    if (result.status === "success" || result.status === "updated") {
        alert(currentEditId ? "修改成功！" : "添加成功！");
        
        // 重置状态
        closeFormModal(); // 关闭弹窗
        
        // 清空输入框
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(i => i.value = '');
        imageInput.value = ''; // 额外清空文件选择框
        loadCharacters();
    } else {
        alert("操作失败，请检查后端日志");
    }
}
// 6. 页面一打开，先执行一次加载，把初始数据展示出来
loadCharacters();