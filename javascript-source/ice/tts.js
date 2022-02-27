/**
 * tts.js
 * by IceFlom
 *
 * Text-To-Speech
 */
(function() {
    var fixedcost = $.getSetIniDbNumber('ttssettings', 'fixedcost', 100),
        multipliercost = $.getSetIniDbNumber('ttssettings', 'multipliercost', 1),
        mintime = $.getSetIniDbNumber('ttssettings', 'mintime', 20) * 3600,
        maxlength = $.getSetIniDbNumber('ttssettings', 'maxlength', 140);

    /**
     * @function updateTts (reload settings)
     */
    function updateTts() {
        fixedcost = $.getIniDbNumber('ttssettings', 'fixedcost');
        multipliercost = $.getIniDbNumber('ttssettings', 'multipliercost');
        mintime = $.getIniDbNumber('ttssettings', 'mintime') * 3600;
        maxlength = $.getIniDbNumber('ttssettings', 'maxlength');
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            argsString = event.getArguments(),
            tags = event.getTags(),
            subcommand = args[0],
            senderPoints = $.getUserPoints(sender),
            cost = argsString.length() * multipliercost;

        if (command.equalsIgnoreCase('tts')) {
            // Subcommand check
            if (typeof subcommand !== 'undefined') {
                if (subcommand.equalsIgnoreCase("info")) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.usage', $.getPointsString(multipliercost), $.getTimeString(mintime, true)));
                    return;
                }
            }
            // Nachricht vorhanden?
            if (argsString.length() < 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.usage', $.getPointsString(multipliercost), $.getTimeString(mintime, true)));
                return;
            }
            // Kanal online?
            if (!$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.offlinewarning'));
                return;
            }
            // Points check, Mods for free
            if (!$.isModv3(sender, tags) && senderPoints < cost) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.notenoughpoints', $.getPointsString(senderPoints), $.getPointsString(cost)));
                return;
            } else {
                // Mod pay with rest if under cost
                if ($.isModv3(sender, tags)) {
                    if (senderPoints < cost) {
                        $.inidb.decr('points', sender, senderPoints);
                    } else {
                        $.inidb.decr('points', sender, cost);
                    }
                } else {
                    $.inidb.decr('points', sender, cost);
                }
            }
            $.alertspollssocket.triggerTts(sender + " schreibt: " + argsString);
            $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.success', $.getPointsString(cost)));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./commands/ttsCommand.js')) {
            $.registerChatCommand('./commands/ttsCommand.js', 'tts', 7);
            $.registerChatSubcommand('tts', 'info', 7);
        }
    });
    $.updateTts = updateTts;
})();