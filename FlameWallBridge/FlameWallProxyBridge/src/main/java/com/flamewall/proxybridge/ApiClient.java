package com.flamewall.proxybridge;

import com.velocitypowered.api.proxy.Player;
import com.velocitypowered.api.proxy.ProxyServer;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;

import java.io.IOException;
import java.util.List;

public class ApiClient {

    private final FlameWallProxyBridge plugin;
    private final ProxyServer server;
    private final Logger logger;
    private final OkHttpClient httpClient;
    private final String baseUrl;
    private final String apiKey;

    public ApiClient(FlameWallProxyBridge plugin, ProxyServer server, Logger logger, String baseUrl, String apiKey) {
        this.plugin = plugin;
        this.server = server;
        this.logger = logger;
        this.httpClient = new OkHttpClient();
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        logger.info("✅ [API] ApiClient initialized. Backend URL: {}", this.baseUrl);
    }

    public void sendFriendRequest(Player sender, String receiverName) {
        logger.info("🤝 [API] Player {} is sending a friend request to player {}", sender.getUsername(), receiverName);
        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("requesterUuid", sender.getUniqueId().toString());
            jsonBody.put("receiverName", receiverName);
            RequestBody body = RequestBody.create(jsonBody.toString(), MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/friendships/from-plugin/add")
                    .header("x-api-key", apiKey)
                    .post(body)
                    .build();
            httpClient.newCall(request).enqueue(new HttpCallback(sender, "Friend request sent to " + receiverName + "!"));
        } catch (JSONException e) {
            handlePluginError(sender, "Could not create JSON for friend request", e);
        }
    }

    public void removeFriend(Player sender, String friendToRemoveName) {
        logger.info("💔 [API] Player {} is removing {} from friends", sender.getUsername(), friendToRemoveName);
        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("removerUuid", sender.getUniqueId().toString());
            jsonBody.put("friendToRemoveName", friendToRemoveName);
            RequestBody body = RequestBody.create(jsonBody.toString(), MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/friendships/from-plugin/remove")
                    .header("x-api-key", apiKey)
                    .delete(body)
                    .build();
            httpClient.newCall(request).enqueue(new HttpCallback(sender, friendToRemoveName + " has been removed from your friends list."));
        } catch (JSONException e) {
            handlePluginError(sender, "Could not create JSON for friend removal", e);
        }
    }

    public void acceptFriendRequest(Player sender, int requestId) {
        logger.info("✅ [API] Player {} is accepting friend request #{}", sender.getUsername(), requestId);
        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("responderUuid", sender.getUniqueId().toString());
            jsonBody.put("requestId", requestId);
            RequestBody body = RequestBody.create(jsonBody.toString(), MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/friendships/from-plugin/accept")
                    .header("x-api-key", apiKey)
                    .post(body)
                    .build();
            httpClient.newCall(request).enqueue(new HttpCallback(sender, "Friend request accepted!"));
        } catch (JSONException e) {
            handlePluginError(sender, "Could not create JSON for accepting friend request", e);
        }
    }

    public void denyFriendRequest(Player sender, int requestId) {
        logger.info("❌ [API] Player {} is denying friend request #{}", sender.getUsername(), requestId);
        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("responderUuid", sender.getUniqueId().toString());
            jsonBody.put("requestId", requestId);
            RequestBody body = RequestBody.create(jsonBody.toString(), MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/friendships/from-plugin/deny")
                    .header("x-api-key", apiKey)
                    .post(body)
                    .build();
            httpClient.newCall(request).enqueue(new HttpCallback(sender, "Friend request denied."));
        } catch (JSONException e) {
            handlePluginError(sender, "Could not create JSON for denying friend request", e);
        }
    }

    public void registerTargets(JSONObject payload) {
        logger.info("➡️ [API] Attempting to register targets for achievements...");
        logger.debug("➡️ [API] Payload: {}", payload.toString());

        RequestBody body = RequestBody.create(payload.toString(), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder()
                .url(baseUrl + "/api/achievements/admin/register-targets")
                .header("x-api-key", apiKey)
                .post(body)
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                logger.error("❌ [API] Failed to register targets. Network error: {}", e.getMessage());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                if (response.isSuccessful()) {
                    logger.info("✅ [API] Achievement targets successfully registered with the backend!");
                } else {
                    try (ResponseBody responseBody = response.body()) {
                        logger.warn("❌ [API] Backend responded with an error during target registration. Code: {}, Response: {}", response.code(), responseBody != null ? responseBody.string() : "null");
                    }
                }
            }
        });
    }

    public void sendEvent(JSONObject payload) {
        logger.info("➡️ [API] Sending game event to backend: {}", payload.toString());
        RequestBody body = RequestBody.create(payload.toString(), MediaType.get("application/json; charset=utf-8"));
        Request request = new Request.Builder()
                .url(baseUrl + "/api/internal/event-ingest")
                .header("x-api-key", apiKey)
                .post(body)
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                logger.error("❌ [API] Failed to send event to backend. Network error:", e);
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                if (!response.isSuccessful()) {
                    logger.warn("❌ [API] Backend responded with an error to the game event. Code: {}", response.code());
                } else {
                    logger.info("✅ [API] Game event successfully accepted by backend.");
                }
                response.close();
            }
        });
    }

    public void getFriendsList(Player sender) {
        logger.info("➡️ [API] Requesting friend list for {}", sender.getUsername());
        Request request = new Request.Builder()
                .url(baseUrl + "/api/friendships/from-plugin/list/" + sender.getUniqueId().toString())
                .header("x-api-key", apiKey)
                .get()
                .build();
        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                handleApiFailure(sender, e);
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                if (!response.isSuccessful()) {
                    handleApiError(sender, response);
                    return;
                }
                logger.info("✅ [API] Successfully fetched friend list for {}", sender.getUsername());
                try (ResponseBody responseBody = response.body()) {
                    JSONArray friendsArray = new JSONArray(responseBody.string());
                    server.getScheduler().buildTask(plugin, () -> {
                        sender.sendMessage(Component.text("--- Your Friends (" + friendsArray.length() + ") ---").color(NamedTextColor.GOLD));
                        if (friendsArray.length() == 0) {
                            sender.sendMessage(Component.text("Your friends list is empty. Use /flame friend add <player>").color(NamedTextColor.GRAY));
                        } else {
                            for (int i = 0; i < friendsArray.length(); i++) {
                                try {
                                    sender.sendMessage(Component.text("- " + friendsArray.getString(i)).color(NamedTextColor.AQUA));
                                } catch (JSONException e) {
                                    logger.warn("Could not get friend name from JSON array at index " + i, e);
                                }
                            }
                        }
                    }).schedule();
                } catch (Exception e) {
                    logger.error("❌ [API] Failed to parse friends list JSON", e);
                    runOnMainThread(() -> sender.sendMessage(Component.text("Error: Could not read response from the website.").color(NamedTextColor.RED)));
                }
            }
        });
    }

    public void fetchAndExecutePendingCommands() {
        logger.info("🛒 [Shop] Fetching pending commands from the website...");
        Request request = new Request.Builder()
                .url(baseUrl + "/api/shop/pending-commands")
                .header("x-api-key", apiKey)
                .get()
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                logger.warn("🛒 [Shop] Could not fetch commands: " + e.getMessage());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                if (!response.isSuccessful()) {
                    logger.warn("🛒 [Shop] Could not fetch commands, API response code: " + response.code());
                    response.close();
                    return;
                }
                try (ResponseBody body = response.body()) {
                    JSONArray commands = new JSONArray(body.string());
                    if (commands.length() > 0) {
                        logger.info("🛒 [Shop] Found {} pending commands. Processing...", commands.length());
                        plugin.processPendingCommands(commands);
                    }
                } catch (Exception e) {
                    logger.error("🛒 [Shop] Could not process pending commands", e);
                }
            }
        });
    }

    public void clearExecutedCommands(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        logger.info("🛒 [Shop] Confirming execution of {} commands with the website...", ids.size());
        try {
            JSONObject jsonBody = new JSONObject();
            jsonBody.put("commandIds", new JSONArray(ids));
            RequestBody body = RequestBody.create(jsonBody.toString(), MediaType.get("application/json; charset=utf-8"));

            Request request = new Request.Builder()
                    .url(baseUrl + "/api/shop/clear-pending-commands")
                    .header("x-api-key", apiKey)
                    .post(body)
                    .build();

            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(@NotNull Call call, @NotNull IOException e) {
                    logger.warn("🛒 [Shop] Could not confirm executed commands: " + e.getMessage());
                }

                @Override
                public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                    if (response.isSuccessful()) {
                        logger.info("🛒 [Shop] Successfully confirmed execution of {} commands.", ids.size());
                    } else {
                        logger.warn("🛒 [Shop] Could not confirm executed commands, API response code: " + response.code());
                    }
                    response.close();
                }
            });
        } catch (Exception e) {
            logger.error("🛒 [Shop] Could not create request to clear executed commands", e);
        }
    }

    private void runOnMainThread(Runnable task) {
        server.getScheduler().buildTask(plugin, task).schedule();
    }

    private void handlePluginError(Player sender, String logMessage, Exception e) {
        logger.error("❗ [Plugin Error] " + logMessage, e);
        runOnMainThread(() -> sender.sendMessage(Component.text("An internal plugin error occurred.").color(NamedTextColor.RED)));
    }

    private void handleApiFailure(Player player, IOException e) {
        logger.error("❌ [API] Failed to send request for {}: {}", player.getUsername(), e.getMessage());
        runOnMainThread(() -> player.sendMessage(Component.text("Error: Could not connect to the website API.").color(NamedTextColor.RED)));
    }

    private void handleApiError(Player player, Response response) {
        try (ResponseBody responseBody = response.body()) {
            String errorBody = responseBody != null ? responseBody.string() : "No error body";
            JSONObject errorJson = new JSONObject(errorBody);
            String message = errorJson.optString("message", "An unknown error occurred (" + response.code() + ")");
            logger.warn("❌ [API] API Error for {}. Code: {}. Message: {}", player.getUsername(), response.code(), message);
            runOnMainThread(() -> player.sendMessage(Component.text("Error: " + message).color(NamedTextColor.RED)));
        } catch (Exception e) {
            logger.warn("❌ [API] Could not parse error response from API.", e);
            runOnMainThread(() -> player.sendMessage(Component.text("An unknown error occurred while processing the server response.").color(NamedTextColor.RED)));
        }
    }

    private class HttpCallback implements Callback {
        private final Player sender;
        private final String successMessage;

        public HttpCallback(Player sender, String successMessage) {
            this.sender = sender;
            this.successMessage = successMessage;
        }

        @Override
        public void onFailure(@NotNull Call call, @NotNull IOException e) {
            handleApiFailure(sender, e);
        }

        @Override
        public void onResponse(@NotNull Call call, @NotNull Response response) {
            if (response.isSuccessful()) {
                runOnMainThread(() -> sender.sendMessage(Component.text(successMessage).color(NamedTextColor.GREEN)));
            } else {
                handleApiError(sender, response);
            }
        }
    }

    public void syncRank(String playerUuid, String rankName) {
        logger.info("🔄 [API] Syncing rank for UUID {} to rank {}", playerUuid, rankName);
        try {
            JSONObject payload = new JSONObject();
            payload.put("minecraftUuid", playerUuid);
            payload.put("newRankSystemName", rankName);

            RequestBody body = RequestBody.create(payload.toString(), MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                    .url(baseUrl + "/api/internal/rank-sync")
                    .header("x-api-key", apiKey)
                    .post(body)
                    .build();

            httpClient.newCall(request).enqueue(new Callback() {
                @Override public void onFailure(@NotNull Call call, @NotNull IOException e) {
                    logger.warn("❌ [API] Failed to sync rank for UUID {}: {}", playerUuid, e.getMessage());
                }
                @Override public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                    if (!response.isSuccessful()) {
                        logger.warn("❌ [API] Rank sync for UUID {} failed with code: {}", playerUuid, response.code());
                    }
                    response.close();
                }
            });
        } catch (Exception e) {
            logger.error("Could not create JSON for rank sync", e);
        }
    }
}