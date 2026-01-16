export {};//因为要让js共存所以使用这个
// 1. 定义“接口” (Interface)
// 这是 TS 最强大的地方。我们把 Java 后端传回来的数据结构，在前端也通过代码“画”了出来。
// 这样，如果你在代码里试图访问 char.age (不存在的字段)，编辑器立刻就会标红报错。
interface Character {
    id: string;
    name: string;
    alias: string;
    image: string;
    tags: string[]; // 这是一个字符串数组
    desc: string;
}

// 接口：定义后端返回的操作结果格式
interface ApiResponse {
    status: string;
    id?: string; // 问号表示这个字段可能有时候没有
}

// --- 全局变量 ---

// 明确告诉 TS：这个数组里只能放 Character 类型的对象
let allCharacters: Character[] = [];

// 明确告诉 TS：这个变量要么是字符串(ID)，要么是 null，不能是数字或其他
let currentEditId: string | null = null;

// --- 核心逻辑 ---

/**
 * 加载所有数据
 * Promise<void> 表示这个异步函数不返回具体数值，只是完成一个任务
 */
async function loadCharacters(): Promise<void> {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/characters');
        // 这里用 'as' 断言，告诉 TS：我很确定后端返回的一定是 Character 数组
        const data = await response.json() as Character[];
        
        allCharacters = data;
        renderCards(data);
    } catch (error) {
        console.error("加载失败:", error);
    }
}

/**
 * 渲染卡片
 * characterList: Character[] -> 强制要求传入的必须是马娘数组
 */
const renderCards = (characterList: Character[]): void => {
    // 这里我们要断言 container 一定存在，并且是个 HTML 元素
    const container = document.getElementById('app') as HTMLElement;

    if (!characterList || characterList.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">没有找到匹配的马娘</p>';
        return;
    }

    container.innerHTML = '';

    const cardsHTML = characterList.map(char => `
        <div class="card" onclick="openDetailModal('${char.id}')" style="cursor: pointer;">
            <div class="card-image">
                <img src="${char.image}" alt="${char.name}">
            </div>
            <div class="card-content">
                <h2>${char.name}</h2>
                <p>${char.alias || ''}</p>
                <div class="tags">
                    ${char.tags.map(tag => `<span class="tag tag-grass">${tag}</span>`).join('')}
                </div>
                <p class="description" style="-webkit-line-clamp: 3; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;">
                    ${char.desc}
                </p>
            </div>
            <!-- 注意：在 HTML 字符串里调用 TS 函数需要确保编译后的 JS 在全局作用域能访问到 -->
            <button class="button" onclick="event.stopPropagation(); deleteCharacter('${char.id}')">删除</button>
            <button class="button" onclick="event.stopPropagation(); prepareEdit('${char.id}')">编辑</button>
        </div>
    `).join('');

    container.innerHTML = cardsHTML;
}

/**
 * 搜索逻辑
 * keyword: string -> 必须传字符串
 */
const performSearch = async (keyword: string): Promise<void> => {
    if (keyword.trim() === "") {
        loadCharacters();
        return;
    }

    const response = await fetch(`http://127.0.0.1:5000/api/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await response.json() as Character[];
    renderCards(data);
};

/**
 * 删除逻辑
 */
async function deleteCharacter(id: string): Promise<void> {
    if (!confirm("确定要删除这位马娘吗？此操作不可撤销。")) return;

    const response = await fetch(`http://127.0.0.1:5000/api/character/${id}`, {
        method: 'DELETE'
    });

    const result = await response.json() as ApiResponse;
    if (result.status === "deleted") {
        loadCharacters();
    } else {
        alert("删除失败");
    }
}

// --- 弹窗与表单逻辑 ---

// 为了让下面的代码更简洁，我们定义一个辅助函数来获取输入框
// 并告诉 TS 这个元素是 "HTMLInputElement" (因为普通的 HTMLElement 没有 .value 属性)
function getInputElement(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement;
}

function openFormModal(): void {
    if (!currentEditId) {
        // 清空表单
        const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
        inputs.forEach(el => (el as HTMLInputElement).value = '');
        
        const title = document.getElementById('formTitle');
        if (title) title.innerText = "✨ 添加新马娘";
        
        const btn = document.querySelector('button[onclick="saveCharacter()"]') as HTMLElement;
        if (btn) btn.innerText = "确认提交";
    }
    
    const modal = document.getElementById('formModal');
    if (modal) modal.style.display = 'block';
}

function closeFormModal(): void {
    const modal = document.getElementById('formModal');
    if (modal) modal.style.display = 'none';
    currentEditId = null;
}

function openDetailModal(id: string): void {
    const char = allCharacters.find(c => c.id === id);
    if (!char) return;

    const content = document.getElementById('detailContent');
    if (content) {
        content.innerHTML = `
            <img id="detailImage" src="${char.image}" alt="${char.name}">
            <h2>${char.name}</h2>
            <p style="color: #666;">${char.alias || ''}</p>
            <div class="tags" style="margin: 10px 0;">
                ${char.tags.map(tag => `<span class="tag tag-grass">${tag}</span>`).join('')}
            </div>
            <p style="line-height: 1.6; white-space: pre-wrap;">${char.desc}</p>
        `;
    }
    
    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'block';
}

function closeDetailModal(): void {
    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';
}

// 这里的 event 类型是 MouseEvent
window.onclick = function(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
        target.style.display = "none";
        if (target.id === 'formModal') currentEditId = null;
    }
}

function prepareEdit(id: string): void {
    const char = allCharacters.find(c => c.id === id);
    if (!char) return;
    
    // TS 知道 getInputElement 返回的是 Input 元素，所以允许访问 .value
    getInputElement('newName').value = char.name;
    getInputElement('newAlias').value = char.alias;
    getInputElement('newDesc').value = char.desc; // textarea 也可以被断言为 HTMLInputElement (或 HTMLTextAreaElement)
    getInputElement('newTags').value = char.tags.join('.');
    
    currentEditId = id;
    
    const title = document.getElementById('formTitle');
    if (title) title.innerText = "📝 编辑马娘";
    
    const btn = document.querySelector('button[onclick="saveCharacter()"]') as HTMLElement;
    if (btn) btn.innerText = "保存修改";
    
    const modal = document.getElementById('formModal');
    if (modal) modal.style.display = 'block';
}

async function saveCharacter(): Promise<void> {
    const name = getInputElement('newName').value;
    const desc = getInputElement('newDesc').value; // 这里其实应该是 HTMLTextAreaElement，但为了方便通用处理
    const alias = getInputElement('newAlias').value;
    const tagsRaw = getInputElement('newTags').value;
    const imageInput = document.getElementById('newImage') as HTMLInputElement;

    if (!name || !desc) {
        alert("名字和简介不能为空哦！");
        return;
    }

    const formattedTags = tagsRaw.replace(/[,，、]/g, '.');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('alias', alias);
    formData.append('tags', formattedTags);
    formData.append('bio', desc);

    if (imageInput.files && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    const url = currentEditId 
        ? `http://127.0.0.1:5000/api/character/${currentEditId}`
        : 'http://127.0.0.1:5000/api/character';
    
    const method = currentEditId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        const result = await response.json() as ApiResponse;
        
        if (result.status === "success" || result.status === "updated") {
            alert(currentEditId ? "修改成功！" : "添加成功！");
            closeFormModal();
            
            // 清空
            const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
            inputs.forEach(el => (el as HTMLInputElement).value = '');
            imageInput.value = '';
            
            loadCharacters();
        } else {
            alert("操作失败");
        }
    } catch (e) {
        console.error(e);
        alert("网络请求出错");
    }
}

// 暴露给全局 (因为 HTML onclick 需要用到这些函数)
// 在模块化开发中，通常不需要这样做，但为了兼容现有的 script 标签引入方式：
(window as any).loadCharacters = loadCharacters;
(window as any).renderCards = renderCards;
(window as any).performSearch = performSearch;
(window as any).deleteCharacter = deleteCharacter;
(window as any).openFormModal = openFormModal;
(window as any).closeFormModal = closeFormModal;
(window as any).openDetailModal = openDetailModal;
(window as any).closeDetailModal = closeDetailModal;
(window as any).prepareEdit = prepareEdit;
(window as any).saveCharacter = saveCharacter;

// 启动
loadCharacters();