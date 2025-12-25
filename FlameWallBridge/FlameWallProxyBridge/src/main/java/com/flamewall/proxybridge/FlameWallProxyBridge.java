package com.flamewall.proxybridge;

import com.google.common.io.ByteArrayDataInput;
import com.google.common.io.ByteArrayDataOutput;
import com.google.common.io.ByteStreams;
import com.google.inject.Inject;
import com.velocitypowered.api.command.CommandManager;
import com.velocitypowered.api.command.CommandMeta;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.connection.DisconnectEvent;
import com.velocitypowered.api.event.connection.PluginMessageEvent;
import com.velocitypowered.api.event.proxy.ProxyInitializeEvent;
import com.velocitypowered.api.event.proxy.ProxyShutdownEvent;
import com.velocitypowered.api.plugin.Plugin;
import com.velocitypowered.api.plugin.annotation.DataDirectory;
import com.velocitypowered.api.proxy.Player;
import com.velocitypowered.api.proxy.ProxyServer;
import com.velocitypowered.api.proxy.ServerConnection;
import com.velocitypowered.api.proxy.messages.ChannelIdentifier;
import com.velocitypowered.api.proxy.messages.MinecraftChannelIdentifier;
import com.velocitypowered.api.scheduler.ScheduledTask;
import io.socket.client.IO;
import io.socket.client.Socket;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import com.velocitypowered.api.event.connection.PostLoginEvent;
import com.flamewall.proxybridge.command.FlameCommand;
import com.flamewall.proxybridge.command.LinkCommand;
import com.flamewall.proxybridge.manager.PrivateMessageManager;

import java.io.*;
import java.net.URI;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
@Plugin(
        id = "flamewallproxybridge",
        name = "FlameWallProxyBridge",
        version = "1.0-SNAPSHOT",
        description = "The main proxy bridge for FlameWall website integration.",
        authors = {"Sknery"}
)
public class FlameWallProxyBridge {
    private final ProxyServer server;
    private final Logger logger;
    private Socket socket;
    private ApiClient apiClient;
    private final Path dataDirectory;
    private PrivateMessageManager messageManager;
    private final Map<UUID, Map<String, Integer>> pendingRequests = new ConcurrentHashMap<>();
    private ScheduledTask pendingCommandsTask;
    private static final ChannelIdentifier FLAMEWALL_CHANNEL = MinecraftChannelIdentifier.create("flamewall", "main");

    private String backendUrl;
    private String apiKey;

    @Inject
    public FlameWallProxyBridge(ProxyServer server, Logger logger, @DataDirectory Path dataDirectory) {
        this.server = server;
        this.logger = logger;
        this.dataDirectory = dataDirectory;
    }

    public ApiClient getApiClient() {
        return apiClient;
    }

    @Subscribe
    public void onProxyInitialization(ProxyInitializeEvent event) {
        logger.info("🚀 [Startup] Initializing FlameWallProxyBridge...");
        loadConfig();

        this.apiClient = new ApiClient(this, server, logger, this.backendUrl, this.apiKey);
        this.messageManager = new PrivateMessageManager();
        logger.info("🔧 [Startup] Registering commands...");
        CommandManager commandManager = server.getCommandManager();
        CommandMeta flameMeta = commandManager.metaBuilder("flame").aliases("fw").build();
        commandManager.register(flameMeta, new FlameCommand(this, server, logger, messageManager));
        CommandMeta linkMeta = commandManager.metaBuilder("link").build();
        commandManager.register(linkMeta, new LinkCommand(this));
        logger.info("🔧 [Startup] Registering plugin channels...");
        server.getChannelRegistrar().register(FLAMEWALL_CHANNEL);
        connectToWebSocket();
        logger.info("⏰ [Startup] Starting scheduler for shop command checks...");
        this.pendingCommandsTask = server.getScheduler()
                .buildTask(this, () -> apiClient.fetchAndExecutePendingCommands())
                .repeat(1, TimeUnit.MINUTES)
                .delay(1, TimeUnit.MINUTES)
                .schedule();
        logger.info("✅ [Startup] FlameWallProxyBridge started successfully!");
    }

    private void loadConfig() {
        try {
            File pluginFolder = dataDirectory.toFile();
            if (!pluginFolder.exists()) {
                pluginFolder.mkdirs();
            }

            File configFile = new File(pluginFolder, "config.properties");
            Properties props = new Properties();

            if (!configFile.exists()) {
                logger.info("config.properties not found, creating a new one with default settings...");
                props.setProperty("backend-url", "http:
                props.setProperty("api-key", "SuperSecretKeyForFlameWallNoMistakes123");
                try (FileOutputStream out = new FileOutputStream(configFile)) {
                    props.store(out, "FlameWall Proxy Bridge Configuration");
                }
            }

            try (FileInputStream in = new FileInputStream(configFile)) {
                props.load(in);
            }

            this.backendUrl = props.getProperty("backend-url", "http:
            this.apiKey = props.getProperty("api-key", "");

            if (this.apiKey.isEmpty()) {
                logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                logger.error("!!! API KEY (api-key) IS NOT SET in config.properties !!!");
                logger.error("!!! THE PLUGIN WILL NOT BE ABLE TO CONNECT TO THE WEBSITE !!!");
                logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            }
            logger.info("✅ Configuration loaded successfully.");

        } catch (IOException e) {
            logger.error("❌ Failed to load or create config.properties!", e);
        }
    }

    @Subscribe
    public void onProxyShutdown(ProxyShutdownEvent event) {
        logger.info("🔌 [Shutdown] Disabling proxy plugin...");
        if (pendingCommandsTask != null) {
            pendingCommandsTask.cancel();
            logger.info("⏰ [Shutdown] Scheduler stopped.");
        }
        if (socket != null) {
            socket.disconnect();
            logger.info("🔌 [Shutdown] WebSocket connection closed.");
        }
    }

    @Subscribe
    public void onPluginMessage(@NotNull PluginMessageEvent event) {

        if (!event.getIdentifier().equals(FLAMEWALL_CHANNEL)) {
            return;
        }
        logger.info("[DEBUG] Received a message on the flamewall:main channel.");
        logger.info("[DEBUG] Source: " + event.getSource().getClass().getName());

        ByteArrayDataInput in = ByteStreams.newDataInput(event.getData());
        String subChannel = in.readUTF();
        logger.info("[DEBUG] Subchannel is: '{}'", subChannel);
        try {
            switch (subChannel) {
                case "GameEvent": {
                    String eventJsonString = in.readUTF();
                    JSONObject payload = new JSONObject(eventJsonString);
                    if (apiClient != null) {
                        apiClient.sendEvent(payload);
                    }
                    break;
                }
                case "RankSync": {
                    String rankJsonString = in.readUTF();
                    JSONObject payload = new JSONObject(rankJsonString);
                    String uuid = payload.getString("minecraftUuid");
                    String rankName = payload.getString("newRankSystemName");
                    if (apiClient != null) {
                        apiClient.syncRank(uuid, rankName);
                    }
                    break;
                }
                case "RegisterTargets": {

                    logger.info("[DEBUG] Processing 'RegisterTargets' subchannel...");
                    String targetsJsonString = in.readUTF();
                    JSONObject payload = new JSONObject(targetsJsonString);
                    if (apiClient != null) {
                        apiClient.registerTargets(payload);
                    }
                    break;
                }
                default:

                    logger.warn("[DEBUG] Received unknown subchannel message from Spigot: {}", subChannel);
                    break;
            }
        } catch (Exception e) {
            logger.error("Failed to process plugin message from Spigot with subchannel " + subChannel, e);
        }
    }

    @Subscribe
    public void onPlayerJoin(PostLoginEvent event) {
        logger.info("👤 [Status] Player {} joined the server.", event.getPlayer().getUsername());
        sendStatusUpdate(event.getPlayer(), true);
    }

    @Subscribe
    public void onPlayerQuit(DisconnectEvent event) {
        logger.info("👤 [Status] Player {} left the server.", event.getPlayer().getUsername());
        pendingRequests.remove(event.getPlayer().getUniqueId());
        sendStatusUpdate(event.getPlayer(), false);
    }

    private void sendStatusUpdate(Player player, boolean isOnline) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("minecraftUuid", player.getUniqueId().toString());
            payload.put("isOnline", isOnline);
            logger.info("➡️ [WS] Sending status for {}: {}", player.getUsername(), payload.toString());
            sendJsonPayload("minecraftPlayerStatus", payload);
        } catch (JSONException e) {
            logger.error("❌ [WS] Could not create JSON for player status update for " + player.getUsername(), e);
        }
    }

    public Map<UUID, Map<String, Integer>> getPendingRequests() {
        return pendingRequests;
    }

    public void sendJsonPayload(String eventName, JSONObject payload) {
        if (socket != null && socket.connected()) {
            socket.emit(eventName, payload);
        } else {
            logger.warn("🔌 [WS] WebSocket is not connected. Could not send event: {}", eventName);
        }
    }

    private void connectToWebSocket() {
        try {
            final ChannelIdentifier bungeeChannel = MinecraftChannelIdentifier.create("bungeecord", "main");

            String url = this.backendUrl;
            String apiKey = this.apiKey;
            if (apiKey == null || apiKey.isEmpty()) {
                logger.error("🛑 CRITICAL: api-key is not set! The plugin will not work.");
                return;
            }
            Map<String, List<String>> headers = new HashMap<>();
            headers.put("x-api-key", Collections.singletonList(apiKey));
            IO.Options options = IO.Options.builder()
                    .setExtraHeaders(headers)
                    .setTransports(new String[]{"websocket"})
                    .setPath("/socket.io/")
                    .build();
            socket = IO.socket(URI.create(url), options);
            socket.on(Socket.EVENT_CONNECT, args -> logger.info("✅ [WS] Successfully connected to the website backend!"));
            socket.on(Socket.EVENT_DISCONNECT, args -> logger.warn("🔌 [WS] Disconnected from the website backend. Reason: {}", args.length > 0 ? args[0] : "unknown"));
            socket.on(Socket.EVENT_CONNECT_ERROR, args -> logger.error("❌ [WS] WebSocket connection error: {}", args.length > 0 ? args[0] : "unknown"));

            socket.on("incomingFriendRequest", args -> {
                logger.info("💌 [WS] Received incoming friend request from the website.");
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        UUID receiverUuid = UUID.fromString(data.getString("receiverUuid"));
                        int requestId = data.getInt("requestId");
                        JSONObject requesterData = data.getJSONObject("requester");
                        String requesterUsername = requesterData.getString("username");
                        String requesterMcUsername = requesterData.optString("minecraftUsername", null);
                        String profileUrl = requesterData.getString("profileUrl");
                        String rankName = requesterData.getString("rankName");
                        int reputation = requesterData.getInt("reputation");
                        pendingRequests.computeIfAbsent(receiverUuid, k -> new HashMap<>()).put(requesterUsername.toLowerCase(), requestId);

                        server.getPlayer(receiverUuid).ifPresent(receiver -> {
                            Component hoverText = Component.text()
                                    .append(Component.text("Rank: ", NamedTextColor.GOLD))
                                    .append(Component.text(rankName, NamedTextColor.WHITE))
                                    .append(Component.newline())
                                    .append(Component.text("Reputation: ", NamedTextColor.GOLD))
                                    .append(Component.text(reputation, NamedTextColor.WHITE))
                                    .append(Component.newline())
                                    .append(Component.text("Click to view profile on website", NamedTextColor.GREEN))
                                    .build();
                            Component requesterComponent = Component.text(requesterUsername, NamedTextColor.AQUA);
                            if (requesterMcUsername != null && !requesterMcUsername.isEmpty()) {
                                requesterComponent = requesterComponent.append(
                                        Component.text(" [" + requesterMcUsername + "]", NamedTextColor.GRAY)
                                );
                            }
                            requesterComponent = requesterComponent
                                    .hoverEvent(HoverEvent.showText(hoverText))
                                    .clickEvent(ClickEvent.openUrl(profileUrl));

                            receiver.sendMessage(Component.text("------------------------------------------").color(NamedTextColor.GOLD));
                            receiver.sendMessage(Component.text("Player ").color(NamedTextColor.YELLOW)
                                    .append(requesterComponent)
                                    .append(Component.text(" wants to be your friend!", NamedTextColor.YELLOW)));
                            Component acceptButton = Component.text("[ACCEPT]", NamedTextColor.GREEN)
                                    .clickEvent(ClickEvent.runCommand("/flame friend accept " + requesterUsername))
                                    .hoverEvent(HoverEvent.showText(Component.text("Click to accept " + requesterUsername)));
                            Component denyButton = Component.text("[DENY]", NamedTextColor.RED)
                                    .clickEvent(ClickEvent.runCommand("/flame friend deny " + requesterUsername))
                                    .hoverEvent(HoverEvent.showText(Component.text("Click to deny " + requesterUsername)));

                            receiver.sendMessage(Component.text("    ").append(acceptButton).append(Component.text("    ")).append(denyButton));
                            receiver.sendMessage(Component.text("------------------------------------------").color(NamedTextColor.GOLD));
                        });
                    } catch (JSONException e) {
                        logger.error("❌ [WS] Failed to parse 'incomingFriendRequest' JSON", e);
                    }
                }
            });

            socket.on("webPrivateMessage", args -> {
                logger.info("💬 [WS] Received private message from the website.");
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        UUID recipientUuid = UUID.fromString(data.getString("recipientUuid"));
                        String senderUsername = data.getString("senderUsername");
                        String content = data.getString("content");
                        server.getPlayer(recipientUuid).ifPresent(recipient -> {
                            Component prefix = Component.text().append(Component.text("[", NamedTextColor.DARK_GRAY)).append(Component.text(senderUsername, NamedTextColor.AQUA)).append(Component.text(" -> ", NamedTextColor.GRAY)).append(Component.text("Me", NamedTextColor.AQUA)).append(Component.text("] ", NamedTextColor.DARK_GRAY)).build();
                            Component messageBody = Component.text(content, NamedTextColor.WHITE);
                            Component fullMessage = prefix.append(messageBody).clickEvent(ClickEvent.suggestCommand("/flame msg " + senderUsername + " ")).hoverEvent(HoverEvent.showText(Component.text("Click to reply to " + senderUsername).color(NamedTextColor.GREEN)));
                            recipient.sendMessage(fullMessage);
                            server.getPlayer(senderUsername).ifPresent(sender -> messageManager.setLastPartner(recipient, sender));
                        });
                    } catch (JSONException e) {
                        logger.error("❌ [WS] Failed to parse 'webPrivateMessage' JSON", e);
                    }
                }
            });

            socket.on("privateMessageError", args -> {
                logger.warn("💬 [WS] Received a private message error from the website.");
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        UUID senderUuid = UUID.fromString(data.getString("senderUuid"));
                        String errorMessage = data.getString("error");
                        server.getPlayer(senderUuid).ifPresent(player -> {
                            player.sendMessage(Component.text(errorMessage).color(NamedTextColor.RED));
                        });
                    } catch (Exception e) {
                        logger.error("❌ [WS] Failed to parse 'privateMessageError' JSON", e);
                    }
                }
            });

            socket.on("senderNotLinked", args -> {
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        UUID senderUuid = UUID.fromString(data.getString("senderUuid"));
                        server.getPlayer(senderUuid).ifPresent(player -> {
                            player.sendMessage(
                                    Component.text("You must link your account on the website to use the integrated chat! Use /link to get a code.").color(NamedTextColor.RED)
                            );
                        });
                    } catch (Exception e) {
                        logger.error("❌ [WS] Failed to parse 'senderNotLinked' JSON", e);
                    }
                }
            });

            socket.on("deliverInGameDirectly", args -> {
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {

                        UUID senderUuid = UUID.fromString(data.getString("senderUuid"));
                        String recipientUsername = data.getString("recipientUsername");
                        String content = data.getString("content");

                        Optional<Player> recipientOpt = server.getPlayer(recipientUsername);

                        if (recipientOpt.isPresent()) {

                            Player recipient = recipientOpt.get();

                            server.getPlayer(senderUuid).ifPresent(sender -> {
                                Component prefix = Component.text()
                                        .append(Component.text("[", NamedTextColor.DARK_GRAY))
                                        .append(Component.text(sender.getUsername(), NamedTextColor.AQUA))
                                        .append(Component.text(" -> ", NamedTextColor.GRAY))
                                        .append(Component.text("Me", NamedTextColor.AQUA))
                                        .append(Component.text("] ", NamedTextColor.DARK_GRAY))
                                        .build();
                                Component messageBody = Component.text(content, NamedTextColor.WHITE);
                                recipient.sendMessage(prefix.append(messageBody));
                                messageManager.setLastPartner(recipient, sender);
                            });
                        } else {

                            server.getPlayer(senderUuid).ifPresent(sender -> {
                                sender.sendMessage(Component.text("Player '" + recipientUsername + "' not found or is offline.").color(NamedTextColor.RED));
                            });
                        }
                    } catch (Exception e) {
                        logger.error("❌ [WS] Failed to parse 'deliverInGameDirectly' JSON", e);
                    }
                }
            });

            socket.on("inGameMessageSuccess", args -> {
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        UUID senderUuid = UUID.fromString(data.getString("senderUuid"));
                        String recipientUsername = data.getString("recipientUsername");
                        String content = data.getString("content");
                        server.getPlayer(senderUuid).ifPresent(sender -> {
                            Component prefix = Component.text()
                                    .append(Component.text("[", NamedTextColor.DARK_GRAY))
                                    .append(Component.text("Me", NamedTextColor.AQUA))
                                    .append(Component.text(" -> ", NamedTextColor.GRAY))
                                    .append(Component.text(recipientUsername, NamedTextColor.AQUA))
                                    .append(Component.text("] ", NamedTextColor.DARK_GRAY))
                                    .build();
                            Component messageBody = Component.text(content, NamedTextColor.WHITE);
                            sender.sendMessage(prefix.append(messageBody));
                            server.getPlayer(recipientUsername).ifPresent(recipient -> {
                                messageManager.setLastPartner(sender, recipient);
                            });
                        });
                    } catch (Exception e) {
                        logger.error("❌ [WS] Failed to parse 'inGameMessageSuccess' JSON", e);
                    }
                }
            });
            socket.on("shop:new-command", args -> {
                logger.info("🛒 [WS] Received 'shop:new-command' signal from website, fetching commands.");
                apiClient.fetchAndExecutePendingCommands();
            });

            socket.on("globalMessageToGame", args -> {
                logger.info("🌐 [Global Chat] Received message from the website.");
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        int messageId = data.getInt("id");
                        String content = data.getString("content");
                        String authorName = data.getJSONObject("author").getString("username");
                        Component prefix = Component.text()
                                .append(Component.text("[", NamedTextColor.DARK_GRAY))
                                .append(Component.text("Global Chat", NamedTextColor.GOLD))
                                .append(Component.text("] ", NamedTextColor.DARK_GRAY))
                                .build();
                        Component authorComponent = Component.text(authorName, NamedTextColor.AQUA);
                        Component messageComponent = Component.text(" » ", NamedTextColor.GRAY)
                                .append(Component.text(content, NamedTextColor.WHITE));
                        Component finalMessage = prefix.append(authorComponent).append(messageComponent)
                                .clickEvent(ClickEvent.suggestCommand("/flame gcr " + messageId + " "))
                                .hoverEvent(HoverEvent.showText(Component.text("Click to reply to " + authorName).color(NamedTextColor.GREEN)));
                        server.getAllPlayers().forEach(p -> p.sendMessage(finalMessage));
                    } catch (Exception e) {
                        logger.error("❌ [Global Chat] Failed to parse 'globalMessageToGame' JSON", e);
                    }
                }
            });

            socket.on("requestTargets", args -> {
                logger.info("✅ [WS] Received request for target sync from the website. Forwarding via Bungee channel...");
                server.getServer("survival").ifPresent(registeredServer -> {
                    ByteArrayDataOutput out = ByteStreams.newDataOutput();
                    out.writeUTF("Forward");
                    out.writeUTF("survival");
                    out.writeUTF("flamewall:main");
                    ByteArrayDataOutput msgbytes = ByteStreams.newDataOutput();
                    msgbytes.writeUTF("RequestTargetsFromProxy");
                    out.writeShort(msgbytes.toByteArray().length);
                    out.write(msgbytes.toByteArray());
                    registeredServer.sendPluginMessage(bungeeChannel, out.toByteArray());
                    logger.info("✅ [Proxy] 'RequestTargetsFromProxy' message sent to 'survival' server.");
                });
            });

            socket.connect();
            logger.info("🔌 [WS] Attempting to connect to the website backend at {}...", url);
        } catch (Exception e) {
            logger.error("❌ [WS] Could not initialize WebSocket connection: {}", e.getMessage(), e);
        }
    }

    public void processPendingCommands(JSONArray commands) {
        List<Integer> executedIds = new ArrayList<>();
        for (int i = 0; i < commands.length(); i++) {
            try {
                JSONObject cmdObj = commands.getJSONObject(i);
                String commandStr = cmdObj.getString("command");
                int commandId = cmdObj.getInt("id");
                logger.info("✔️ [Shop] Processing command ID {}: '{}'", commandId, commandStr);
                String[] parts = commandStr.split(" ");
                String playerName = "";
                for (String part : parts) {
                    if (server.getPlayer(part).isPresent()) {
                        playerName = part;
                        break;
                    }
                }
                if (playerName.isEmpty()) {
                    logger.warn("⚠️ [Shop] Could not find an online player in command to execute: '{}'", commandStr);
                    continue;
                }
                final String finalPlayerName = playerName;
                server.getPlayer(playerName).ifPresent(player -> {
                    player.getCurrentServer().ifPresent(serverConnection -> {
                        ByteArrayDataOutput out = ByteStreams.newDataOutput();
                        out.writeUTF("ExecuteCommand");
                        out.writeUTF(commandStr);
                        serverConnection.sendPluginMessage(FLAMEWALL_CHANNEL, out.toByteArray());
                        executedIds.add(commandId);
                        logger.info("✅ [Shop] Sent command ID {} to server {} for player {}", commandId, serverConnection.getServerInfo().getName(), finalPlayerName);
                    });
                });
            } catch (JSONException e) {
                logger.error("❌ [Shop] Failed to parse command object from JSON array at index " + i, e);
            }
        }
        if (!executedIds.isEmpty()) {
            apiClient.clearExecutedCommands(executedIds);
        }
    }
}