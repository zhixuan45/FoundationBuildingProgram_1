package com.shengxi45.jsondatabase;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;

import java.util.*;
import java.util.stream.Collectors;

@SpringBootApplication
@RestController
@RequestMapping("/api")
@CrossOrigin // 允许跨域请求，对应 Python 的 CORS(app)
public class app {

    private final JsonDatabase db = new JsonDatabase();

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(app.class);
        // 将端口设置为 5000，以匹配你之前的 Python 后端和前端配置
        application.setDefaultProperties(Collections.singletonMap("server.port", "5000"));
        application.run(args);
    }

    /**
     * 辅助方法：将原始数据格式化为前端需要的 JSON 结构
     * 对应 Python 中的格式化循环逻辑
     */
    private Map<String, Object> formatCharacter(JsonDatabase.IndexEntry item, boolean truncateBio) {
        Map<String, Object> fullInfo = db.readData(item.id);
        Map<String, Object> formatted = new HashMap<>();
        
        formatted.put("id", item.id);
        formatted.put("name", item.name);
        formatted.put("alias", fullInfo != null ? fullInfo.get("alias") : item.alias);
        formatted.put("image", fullInfo != null ? fullInfo.get("imagepath") : "");
        
        // 标签处理：优先使用 full_tags 数组，否则切割 tags 字符串
        Object tags = (fullInfo != null && fullInfo.get("full_tags") != null) 
                      ? fullInfo.get("full_tags") 
                      : Arrays.asList(item.tags.replace(".", ",").split(","));
        formatted.put("tags", tags);
        
        // 简介处理
        String bio = (fullInfo != null && fullInfo.get("bio") != null) ? (String) fullInfo.get("bio") : "暂无描述";
        formatted.put("desc", bio);
        
        return formatted;
    }

    // 1. 获取所有角色 (GET /api/characters)
    @GetMapping("/characters")
    public List<Map<String, Object>> getCharacters() {
        // 使用 searchData("") 获取所有数据
        System.out.println("收到请求：获取所有角色列表");
        return db.searchData("").stream()
                .map(item -> formatCharacter(item, true))
                .collect(Collectors.toList());
    }

    // 2. 搜索角色 (GET /api/search)
    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam(defaultValue = "") String keyword) {
        System.out.println("搜索关键词：" + keyword);
        return db.searchData(keyword).stream()
                .map(item -> formatCharacter(item, false))
                .collect(Collectors.toList());
    }

    // 3. 添加角色 (POST /api/character)
    // 修改为接收 MultipartFile 和 @RequestParam，以支持图片上传
    @PostMapping("/character")
    public Map<String, Object> addCharacter(
            @RequestParam("name") String name,
            @RequestParam("alias") String alias,
            @RequestParam("tags") String tags,
            @RequestParam("bio") String bio,
            @RequestParam(value = "image", required = false) MultipartFile imageFile
    ) {
        System.out.println("收到请求：添加角色 " + name);
        // 调用数据库添加数据，并获取返回的 ID
        String newId = db.addData(name, alias, tags, bio);

        // 如果有图片，保存图片
        if (imageFile != null && !imageFile.isEmpty()) {
            saveImageFile(newId, imageFile);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("id", newId);
        return response;
    }

    // 4. 删除角色 (DELETE /api/character/{char_id})
    @DeleteMapping("/character/{char_id}")
    public Map<String, String> deleteCharacter(@PathVariable("char_id") String charId) {
        db.deleteData(charId);
        return Collections.singletonMap("status", "deleted");
    }

    // 5. 更新角色 (PUT /api/character/{char_id})
    @PutMapping("/character/{char_id}")
    public Map<String, String> updateCharacter(
            @PathVariable("char_id") String charId,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "alias", required = false) String alias,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "image", required = false) MultipartFile imageFile
    ) {
        db.updateData(charId, name, alias, tags, bio);

        // 如果上传了新图片，覆盖旧图片
        if (imageFile != null && !imageFile.isEmpty()) {
            saveImageFile(charId, imageFile);
        }

        return Collections.singletonMap("status", "updated");
    }

    // 辅助方法：保存图片
    private void saveImageFile(String id, MultipartFile file) {
        try {
            // 确保 images 目录存在 (相当于 Python 的 os.makedirs)
            File dir = new File("images");
            if (!dir.exists()) dir.mkdirs();
            
            // 保存文件，强制命名为 {id}.png
            File dest = new File(dir, id + ".png");
            // 【修复】使用 getAbsoluteFile() 获取绝对路径，防止因相对路径导致的"找不到指定路径"错误
            file.transferTo(dest.getAbsoluteFile()); 
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
