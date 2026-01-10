package com.shengxi45.jsondatabase;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

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
        if (truncateBio && bio.length() > 50) {
            bio = bio.substring(0, 50) + "...";
        }
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
    @PostMapping("/character")
    public Map<String, String> addCharacter(@RequestBody Map<String, String> data) {
        System.out.println("收到请求：添加角色 " + data.get("name"));
        db.addData(
            data.get("name"),
            data.get("alias"),
            data.get("tags"),
            data.get("bio")
        );
        return Collections.singletonMap("status", "success");
    }

    // 4. 删除角色 (DELETE /api/character/{char_id})
    @DeleteMapping("/character/{char_id}")
    public Map<String, String> deleteCharacter(@PathVariable("char_id") String charId) {
        db.deleteData(charId);
        return Collections.singletonMap("status", "deleted");
    }

    // 5. 更新角色 (PUT /api/character/{char_id})
    @PutMapping("/character/{char_id}")
    public Map<String, String> updateCharacter(@PathVariable("char_id") String charId, 
                                              @RequestBody Map<String, String> data) {
        db.updateData(
            charId,
            data.get("name"),
            data.get("alias"),
            data.get("tags"),
            data.get("bio")
        );
        return Collections.singletonMap("status", "updated");
    }
}
