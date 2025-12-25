package com.flamewall.proxybridge.command;

import com.flamewall.proxybridge.ApiClient;
import com.flamewall.proxybridge.FlameWallProxyBridge;
import com.flamewall.proxybridge.manager.PrivateMessageManager;
import com.velocitypowered.api.command.SimpleCommand;
import com.velocitypowered.api.proxy.Player;
import com.velocitypowered.api.proxy.ProxyServer;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import org.json.JSONObject;
import org.slf4j.Logger;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
public class FlameCommand implements SimpleCommand {
    private final FlameWallProxyBridge plugin;
    private final PrivateMessageManager messageManager;
    private final ApiClient apiClient;
    private final ProxyServer server;
    private final Logger logger;

    public FlameCommand(FlameWallProxyBridge plugin, ProxyServer server, Logger logger, PrivateMessageManager messageManager) {
        this.plugin = plugin;
        this.server = server;
        this.logger = logger;
        this.messageManager = messageManager;
        this.apiClient = plugin.getApiClient();
    }

    @Override
    public void execute(final Invocation invocation) {
        if (!(invocation.source() instanceof Player)) {
            invocation.source().sendMessage(Component.text("This command can only be used by a player.").color(NamedTextColor.RED));
            return;
        }

        Player player = (Player) invocation.source();
        String[] args = invocation.arguments();

        logger.info("👨‍💻 [Command] Player {} executed command: /flame {}", player.getUsername(), String.join(" ", args));

        if (args.length == 0) {
            sendHelpMessage(player);
            return;
        }

        String subCommand = args[0].toLowerCase();
        String[] subArgs = Arrays.copyOfRange(args, 1, args.length);

        switch (subCommand) {
            case "msg":
                handleMessageCommand(player, subArgs);
                break;
            case "r":
            case "reply":
                handleReplyCommand(player, subArgs);
                break;
            case "friend":
                handleFriendCommand(player, subArgs);
                break;
            case "gc":
                handleGlobalChat(player, subArgs);
                break;
            case "gcr":
                handleGlobalChatReply(player, subArgs);
                break;
            default:
                sendHelpMessage(player);
                break;
        }
    }

    private void handleGlobalChat(Player sender, String[] args) {
        if (args.length < 1) {
            sender.sendMessage(Component.text("Usage: /flame gc <message>").color(NamedTextColor.RED));
            return;
        }
        String messageContent = String.join(" ", args);
        try {
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", sender.getUniqueId().toString());
            payload.put("content", messageContent);
            plugin.sendJsonPayload("gameGlobalChatMessage", payload);
        } catch (Exception e) {
            sender.sendMessage(Component.text("An error occurred while sending your message.").color(NamedTextColor.RED));
            logger.error("Could not send GC message to backend", e);
        }
    }

    private void handleGlobalChatReply(Player sender, String[] args) {
        if (args.length < 2) {
            sender.sendMessage(Component.text("This command is used by clicking on a message. Usage: /flame gcr <id> <message>").color(NamedTextColor.RED));
            return;
        }
        try {
            int parentId = Integer.parseInt(args[0]);
            String messageContent = String.join(" ", Arrays.copyOfRange(args, 1, args.length));
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", sender.getUniqueId().toString());
            payload.put("content", messageContent);
            payload.put("parentId", parentId);
            plugin.sendJsonPayload("gameGlobalChatReply", payload);
        } catch (NumberFormatException e) {
            sender.sendMessage(Component.text("Invalid message ID for reply.").color(NamedTextColor.RED));
        } catch (Exception e) {
            sender.sendMessage(Component.text("An error occurred while sending your reply.").color(NamedTextColor.RED));
            logger.error("Could not send GCR to backend", e);
        }
    }
    private void handleFriendCommand(Player player, String[] args) {
        if (args.length == 0) {
            player.sendMessage(Component.text("Usage: /flame friend <add|remove|list|accept|deny>").color(NamedTextColor.RED));
            return;
        }
        String action = args[0].toLowerCase();
        String[] actionArgs = Arrays.copyOfRange(args, 1, args.length);

        switch(action) {
            case "add": {
                if (actionArgs.length < 1) {
                    player.sendMessage(Component.text("Usage: /flame friend add <player>").color(NamedTextColor.RED));
                    return;
                }
                if (player.getUsername().equalsIgnoreCase(actionArgs[0])) {
                    player.sendMessage(Component.text("You cannot add yourself as a friend.").color(NamedTextColor.RED));
                    return;
                }
                apiClient.sendFriendRequest(player, actionArgs[0]);
                break;
            }
            case "remove": {
                if (actionArgs.length < 1) {
                    player.sendMessage(Component.text("Usage: /flame friend remove <player>").color(NamedTextColor.RED));
                    return;
                }
                apiClient.removeFriend(player, actionArgs[0]);
                break;
            }
            case "list": {
                apiClient.getFriendsList(player);
                break;
            }
            case "accept": {
                if (actionArgs.length < 1) {
                    player.sendMessage(Component.text("Usage: /flame friend accept <player>").color(NamedTextColor.RED));
                    return;
                }
                String requesterName = actionArgs[0].toLowerCase();
                Map<String, Integer> playerRequests = plugin.getPendingRequests().get(player.getUniqueId());

                if (playerRequests == null || !playerRequests.containsKey(requesterName)) {
                    player.sendMessage(Component.text("You don't have a friend request from " + actionArgs[0] + ".").color(NamedTextColor.RED));
                    return;
                }
                int requestId = playerRequests.remove(requesterName);
                apiClient.acceptFriendRequest(player, requestId);
                break;
            }
            case "deny": {
                if (actionArgs.length < 1) {
                    player.sendMessage(Component.text("Usage: /flame friend deny <player>").color(NamedTextColor.RED));
                    return;
                }
                String requesterName = actionArgs[0].toLowerCase();
                Map<String, Integer> playerRequests = plugin.getPendingRequests().get(player.getUniqueId());

                if (playerRequests == null || !playerRequests.containsKey(requesterName)) {
                    player.sendMessage(Component.text("You don't have a friend request from " + actionArgs[0] + ".").color(NamedTextColor.RED));
                    return;
                }
                int requestId = playerRequests.remove(requesterName);
                apiClient.denyFriendRequest(player, requestId);
                break;
            }
            default:
                player.sendMessage(Component.text("Unknown friend command. Use: add, remove, list, accept, deny.").color(NamedTextColor.RED));
                break;
        }
    }

    private void handleMessageCommand(Player sender, String[] args) {
        if (args.length < 2) {
            sender.sendMessage(Component.text("Usage: /flame msg <player> <message>").color(NamedTextColor.RED));
            return;
        }
        String recipientName = args[0];
        String message = String.join(" ", Arrays.copyOfRange(args, 1, args.length));

        if (sender.getUsername().equalsIgnoreCase(recipientName)) {
            sender.sendMessage(Component.text("You cannot send a message to yourself.").color(NamedTextColor.RED));
            return;
        }
        try {
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", sender.getUniqueId().toString());
            payload.put("recipientUsername", recipientName);
            payload.put("content", message);
            plugin.sendJsonPayload("inGamePrivateMessage", payload);
        } catch (Exception e) {
            sender.sendMessage(Component.text("An internal error occurred while packaging the message.").color(NamedTextColor.RED));
            logger.error("Could not create PM payload for " + sender.getUsername(), e);
        }
    }

    private void handleReplyCommand(Player sender, String[] args) {
        if (args.length < 1) {
            sender.sendMessage(Component.text("Usage: /flame reply <message>").color(NamedTextColor.RED));
            return;
        }
        UUID recipientUuid = messageManager.getReplyTarget(sender);
        if (recipientUuid == null) {
            sender.sendMessage(Component.text("There is no one to reply to.").color(NamedTextColor.RED));
            return;
        }

        server.getPlayer(recipientUuid).ifPresentOrElse(
                recipient -> handleMessageCommand(sender, new String[]{recipient.getUsername(), String.join(" ", args)}),
                () -> sender.sendMessage(Component.text("The player you are replying to has gone offline.").color(NamedTextColor.RED))
        );
    }

    private void sendMessage(Player sender, String recipientUsername, String content) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("senderUuid", sender.getUniqueId().toString());
            payload.put("recipientUsername", recipientUsername);
            payload.put("content", content);
            plugin.sendJsonPayload("inGamePrivateMessage", payload);

            Component prefix = Component.text()
                    .append(Component.text("[", NamedTextColor.DARK_GRAY))
                    .append(Component.text("Me", NamedTextColor.AQUA))
                    .append(Component.text(" -> ", NamedTextColor.GRAY))
                    .append(Component.text(recipientUsername, NamedTextColor.AQUA))
                    .append(Component.text("] ", NamedTextColor.DARK_GRAY))
                    .build();

            Component messageBody = Component.text(content, NamedTextColor.WHITE);

            Component fullMessage = prefix.append(messageBody)
                    .clickEvent(ClickEvent.suggestCommand("/flame msg " + recipientUsername + " "))
                    .hoverEvent(HoverEvent.showText(Component.text("Click to send another message to " + recipientUsername).color(NamedTextColor.GREEN)));

            sender.sendMessage(fullMessage);

            server.getPlayer(recipientUsername).ifPresent(recipient -> {
                messageManager.setLastPartner(sender, recipient);
            });
        } catch (Exception e) {
            sender.sendMessage(Component.text("An error occurred while sending the message.").color(NamedTextColor.RED));
            logger.error("Could not send PM to backend for " + sender.getUsername(), e);
        }
    }

    @Override
    public CompletableFuture<List<String>> suggestAsync(final Invocation invocation) {
        String[] args = invocation.arguments();
        if (args.length == 0 || args.length == 1) {
            List<String> subCommands = Arrays.asList("msg", "reply", "friend");
            String currentArg = args.length == 0 ? "" : args[0].toLowerCase();
            return CompletableFuture.completedFuture(
                    subCommands.stream().filter(s -> s.startsWith(currentArg)).collect(Collectors.toList())
            );
        }
        if (args.length == 2) {
            String subCommand = args[0].toLowerCase();
            String currentArg = args[1].toLowerCase();
            if (subCommand.equals("friend")) {
                List<String> friendActions = Arrays.asList("add", "remove", "list", "accept", "deny");
                return CompletableFuture.completedFuture(
                        friendActions.stream().filter(s -> s.startsWith(currentArg)).collect(Collectors.toList())
                );
            }
            if (subCommand.equals("msg")) {
                return server.getAllPlayers().stream()
                        .map(Player::getUsername)
                        .filter(name -> name.toLowerCase().startsWith(currentArg))
                        .collect(Collectors.collectingAndThen(Collectors.toList(), CompletableFuture::completedFuture));
            }
        }
        return CompletableFuture.completedFuture(List.of());
    }

    @Override
    public boolean hasPermission(final Invocation invocation) {
        return true;
    }

    private void sendHelpMessage(Player player) {
        player.sendMessage(Component.text("--- FlameWall Bridge Help ---").color(NamedTextColor.GOLD));
        player.sendMessage(Component.text("/flame msg <player> <message> - Send a private message").color(NamedTextColor.AQUA));
        player.sendMessage(Component.text("/flame reply <message> - Reply to the last message").color(NamedTextColor.AQUA));
        player.sendMessage(Component.text("/flame friend <add|remove|list> - Manage your friends").color(NamedTextColor.AQUA));
    }
}