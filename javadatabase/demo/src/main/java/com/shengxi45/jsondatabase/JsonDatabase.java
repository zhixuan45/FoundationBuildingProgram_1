package com.shengxi45.jsondatabase;
// 导入必要的库
// Gson 是 Google 提供的 JSON 处理库
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.io.*;
import java.lang.reflect.Type;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Java 版 JsonDatabase
 */
public class JsonDatabase {
    // 定义常量：存储数据的文件名
    private static final String INDEX_FILE = "index_file.json";
    private static final String DETAILS_FILE = "details_file.json";
    
    // Gson 是核心类
    private final Gson gson;

    public JsonDatabase() {
        // 使用 GsonBuilder 来配置 Gson
        this.gson = new GsonBuilder()
                .setPrettyPrinting() // 启用缩进输出，让 JSON 更好看
                .disableHtmlEscaping() // 防止特殊字符（如 < >）被转义
                .create();
        
        // 初始化检查：确保文件存在
        initializeFiles();
    }

    /**
     * 检查并初始化 JSON 文件
     */
    private void initializeFiles() {
        ensureFileExists(INDEX_FILE, new ArrayList<IndexEntry>());
        ensureFileExists(DETAILS_FILE, new HashMap<String, DetailsEntry>());
    }

    private void ensureFileExists(String fileName, Object defaultContent) {
        File file = new File(fileName);
        if (!file.exists()) {
            System.out.println("检测到文件缺失，正在创建默认文件: " + file.getAbsolutePath());
            try (Writer writer = new FileWriter(file)) {
                gson.toJson(defaultContent, writer);
            } catch (IOException e) {
                System.err.println("无法创建初始化文件 " + fileName + ": " + e.getMessage());
            }
        } else {
            System.out.println("已加载数据库文件: " + file.getAbsolutePath());
        }
    }

    // --- 数据模型 (POJO) ---
    // 在 Java 中，我们习惯定义专门的类来描述数据的结构，这比 Python 的字典更安全

    // 索引条目：只存最基础的信息，方便快速搜索
    public static class IndexEntry {
        public String id;
        public String name;
        public String alias;
        public String tags;

        // Gson 同样建议保留无参构造函数
        public IndexEntry() {} 
        
        public IndexEntry(String id, String name, String alias, String tags) {
            this.id = id;
            this.name = name;
            this.alias = alias;
            this.tags = tags;
        }
    }

    // 详细条目：存储背景故事、图片路径等大数据
    public static class DetailsEntry {
        public String bio;
        public List<String> full_tags; // 标签列表
        public String imagepath;

        public DetailsEntry() {}
        
        public DetailsEntry(String bio, List<String> full_tags, String imagepath) {
            this.bio = bio;
            this.full_tags = full_tags;
            this.imagepath = imagepath;
        }
    }

    // --- 核心方法 ---

    // 从文件加载索引列表
    private List<IndexEntry> loadIndex() {
        File file = new File(INDEX_FILE);
        if (!file.exists()) {
            // 如果 initializeFiles 正常工作，这里理论上不会触发
            return new ArrayList<>();
        }

        try (Reader reader = new FileReader(file)) {
            // Gson 使用 TypeToken 来处理泛型（如 List<IndexEntry>）
            Type listType = new TypeToken<ArrayList<IndexEntry>>(){}.getType();
            List<IndexEntry> data = gson.fromJson(reader, listType);
            return data != null ? data : new ArrayList<>();
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    /**
     * 从文件中加载DetailsEntry映射数据
     * 该方法读取DETAILS_FILE指定的文件，将其解析为Map<String, DetailsEntry>格式返回
     * 如果文件不存在或解析失败，则返回一个新的空HashMap
     *
     * @return 包含DetailsEntry对象的Map，键为String类型，值为DetailsEntry类型
     *         如果文件不存在或解析出错，则返回空的HashMap
     */
    private Map<String, DetailsEntry> loadDetails() {
        File file = new File(DETAILS_FILE);
        if (!file.exists()) return new HashMap<>();

        try (Reader reader = new FileReader(file)) {
            Type mapType = new TypeToken<HashMap<String, DetailsEntry>>(){}.getType();
            // 从JSON文件中反序列化出Map数据
            Map<String, DetailsEntry> data = gson.fromJson(reader, mapType);
            return data != null ? data : new HashMap<>();
        } catch (IOException e) {
            // 如果发生IO异常，返回空的HashMap
            return new HashMap<>();
        }
    }

    private void saveFiles(List<IndexEntry> indexData, Map<String, DetailsEntry> detailsData) {
        // 使用 try-with-resources 自动关闭文件流
        try (Writer indexWriter = new FileWriter(INDEX_FILE);
             Writer detailsWriter = new FileWriter(DETAILS_FILE)) {
            
            gson.toJson(indexData, indexWriter);
            gson.toJson(detailsData, detailsWriter);
            
            System.out.println("数据已成功存储。");
        } catch (IOException e) {
            System.err.println("存储失败: " + e.getMessage());
        }
    }

    // 添加新数据
    public void addData(String name, String alias, String tags, String bio) {
        // 1. 先把旧数据读出来
        List<IndexEntry> indexData = loadIndex();
        Map<String, DetailsEntry> detailsData = loadDetails();

        // 2. 生成唯一 ID (取 UUID 的前8位)
        String id = UUID.randomUUID().toString().substring(0, 8);
        
        // 3. 创建新的对象
        IndexEntry newIndex = new IndexEntry(id, name, alias, tags);
        // 将 "术士.近卫" 这种字符串按点分割成列表
        List<String> fullTags = Arrays.asList(tags.split("\\."));
        DetailsEntry newDetails = new DetailsEntry(bio, fullTags, "images/" + id + ".png");

        // 4. 存入集合
        indexData.add(newIndex);
        detailsData.put(id, newDetails);

        saveFiles(indexData, detailsData);
        System.out.println("已经写入名称为 " + name + " 的数据");
    }

    // 搜索数据
    public List<IndexEntry> searchData(String keyword) {
        String finalKeyword = keyword.toLowerCase();
        // 使用 Java 8 的 Stream API，这比写 for 循环更优雅
        return loadIndex().stream()
                // 过滤：检查 名字+别名+标签 是否包含关键词
                .filter(item -> {
                    // 拼接成一个大字符串进行模糊匹配
                    String searchSoup = (item.name + " " + item.alias + " " + item.tags).toLowerCase();
                    return searchSoup.contains(finalKeyword);
                })
                .collect(Collectors.toList());
    }

    // 读取完整数据（合并索引和详情）
    public Map<String, Object> readData(String id) {
        List<IndexEntry> indexData = loadIndex();
        Map<String, DetailsEntry> detailsData = loadDetails();

        // 在列表中寻找匹配 ID 的索引项
        Optional<IndexEntry> indexOpt = indexData.stream().filter(i -> i.id.equals(id)).findFirst();
        // 在 Map 中直接通过 ID 获取详情
        DetailsEntry details = detailsData.get(id);

        if (indexOpt.isPresent() && details != null) {
            // 如果都找到了，手动拼装成一个 Map 返回给前端或调用者
            Map<String, Object> fullInfo = new HashMap<>();
            IndexEntry index = indexOpt.get();
            fullInfo.put("id", index.id);
            fullInfo.put("name", index.name);
            fullInfo.put("alias", index.alias);
            fullInfo.put("tags", index.tags);
            fullInfo.put("bio", details.bio);
            fullInfo.put("full_tags", details.full_tags);
            fullInfo.put("imagepath", details.imagepath);
            return fullInfo;
        }
        System.out.println("未找到该ID");
        return null;
    }

    // 删除数据
    public boolean deleteData(String id) {
        List<IndexEntry> indexData = loadIndex();
        Map<String, DetailsEntry> detailsData = loadDetails();

        // removeIf 会遍历列表并删除符合条件的项
        boolean removed = indexData.removeIf(item -> item.id.equals(id));
        if (removed) {
            // 同时删除详情 Map 里的数据
            detailsData.remove(id);
            saveFiles(indexData, detailsData);
            System.out.println("成功删除 ID 为 " + id + " 的数据");
            return true;
        }
        return false;
    }

    // 更新数据
    public void updateData(String id, String name, String alias, String tags, String bio) {
        List<IndexEntry> indexData = loadIndex();
        Map<String, DetailsEntry> detailsData = loadDetails();

        boolean found = false;
        // 遍历索引列表找到对应的项进行修改
        for (IndexEntry item : indexData) {
            if (item.id.equals(id)) {
                if (name != null) item.name = name;
                if (alias != null) item.alias = alias;
                if (tags != null) {
                    item.tags = tags;
                    // 如果标签改了，详情里的 full_tags 也要同步更新
                    if (detailsData.containsKey(id)) {
                        detailsData.get(id).full_tags = Arrays.asList(tags.split("\\."));
                    }
                }
                found = true;
                break;
            }
        }

        if (found) {
            // 更新详情里的简介
            if (bio != null && detailsData.containsKey(id)) {
                detailsData.get(id).bio = bio;
            }
            saveFiles(indexData, detailsData);
        }
    }

    // 程序入口，用于手动测试
    public static void main(String[] args) {
        JsonDatabase db = new JsonDatabase();
        // 测试添加
        db.addData("阿米娅", "小驴子", "术士.近卫", "罗德岛公开领袖");
        
        // 测试搜索
        List<IndexEntry> results = db.searchData("术士");
        results.forEach(r -> System.out.println("搜索结果: " + r.name));
    }
}