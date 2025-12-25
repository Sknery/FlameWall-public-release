
package com.flamewall.spigothelper.util;

import org.bukkit.Material;
import org.bukkit.entity.EntityType;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class TargetScanner {

    public static List<JSONObject> scanInChunks() {
        List<JSONObject> chunks = new ArrayList<>();
        String pluginName = "VanillaMinecraft";
        JSONObject miningChunkTargets = new JSONObject();
        JSONArray miningTargets = new JSONArray();
        Arrays.stream(Material.values())
                .filter(Material::isBlock).filter(m -> !m.isAir())
                .forEach(material -> miningTargets.put("vanilla:break:" + material.name()));
        miningChunkTargets.put("Mining", miningTargets);

        JSONObject miningPayload = new JSONObject();
        miningPayload.put("pluginName", pluginName);
        miningPayload.put("targets", miningChunkTargets);
        chunks.add(miningPayload);

        JSONObject killingChunkTargets = new JSONObject();
        JSONArray killingTargets = new JSONArray();
        Arrays.stream(EntityType.values())
                .filter(EntityType::isAlive).filter(type -> type != EntityType.PLAYER)
                .forEach(entityType -> killingTargets.put("vanilla:kill:" + entityType.name()));
        killingChunkTargets.put("Killing", killingTargets);

        JSONObject killingPayload = new JSONObject();
        killingPayload.put("pluginName", pluginName);
        killingPayload.put("targets", killingChunkTargets);
        chunks.add(killingPayload);

        JSONObject itemChunkTargets = new JSONObject();
        JSONArray itemTargets = new JSONArray();
        Arrays.stream(Material.values())
                .filter(Material::isItem)
                .forEach(material -> itemTargets.put("vanilla:item:" + material.name()));
        itemChunkTargets.put("Items", itemTargets);

        JSONObject itemPayload = new JSONObject();
        itemPayload.put("pluginName", pluginName);
        itemPayload.put("targets", itemChunkTargets);
        chunks.add(itemPayload);

        return chunks;
    }

}