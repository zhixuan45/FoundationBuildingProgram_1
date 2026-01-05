let allCharacters = [];

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
    
    console.log("拿到数据啦：", data);

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
    const cardsHTML = characterList.map(char => `
        <div class="card">
            <div class="card-image">
                <img src="${char.image}" alt="${char.name}">
            </div>
            <div class="card-content">
                <h2>${char.name}</h2>
                <p>${alias = char.alias ? char.alias : ''}</p>
                <div class="tags">
                    <!-- 标签也是个数组，所以我们再用一次 map 把每个标签变成 <span> -->
                    ${char.tags.map(tag => `<span class="tag tag-grass">${tag}</span>`).join('')}
                </div>
                <p class="description">${char.desc}</p>
            </div>
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
 * 5. 事件监听
 * 找到输入框，监听它的 'input' 事件（即用户打字动作）。
 * 使用 debounce 包裹搜索函数，设定 300 毫秒的延迟。
 */
document.getElementById('searchInput').addEventListener('input', debounce((e) => {
    performSearch(e.target.value);
}, 300));
async function addCharacter() {
    // 1. 收集输入框里的数据
    const name = document.getElementById('newName').value;
    const desc = document.getElementById('newDesc').value;
    const alias = document.getElementById('newAlias').value;
    const tagsRaw = document.getElementById('newTags').value;

    if (!name || !desc) {
        alert("名字和简介不能为空哦！");
        return;
    }

    // 后端 jsondatabase.py 期望 tags 是用 "." 分隔的字符串
    // 我们把用户输入的逗号统一换成点
    const formattedTags = tagsRaw.replace(/[,，]/g, '.');

    const newChar = {
        name: name,
        alias: alias,
        tags: formattedTags,
        bio: desc  // 注意：后端接收的字段名是 bio，不是 desc
    };

    // 2. 发送 POST 请求给 Python
    // 注意：接口地址应为 /api/character (单数)
    const response = await fetch('http://127.0.0.1:5000/api/character', {
        method: 'POST', // 告诉服务器我要“发送”数据
        headers: {
            'Content-Type': 'application/json' // 告诉服务器我发的是JSON
        },
        body: JSON.stringify(newChar) // 把JS对象变成字符串发过去
    });

    const result = await response.json();
    if (result.status === "success") {
        alert("添加成功！");
        // 清空输入框并刷新列表
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(i => i.value = '');
        loadCharacters();
    } else {
        alert("添加失败，请检查后端日志");
    }
}
// 6. 页面一打开，先执行一次加载，把初始数据展示出来
loadCharacters();