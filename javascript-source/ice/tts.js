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
        maxlength = $.getSetIniDbNumber('ttssettings', 'maxlength', 140),
        wsurl = $.getSetIniDbString('ttssettings', 'wsurl', "");

    /**
     * @function updateTts (reload settings)
     */
    function updateTts() {
        fixedcost = $.getIniDbNumber('ttssettings', 'fixedcost');
        multipliercost = $.getIniDbNumber('ttssettings', 'multipliercost');
        mintime = $.getIniDbNumber('ttssettings', 'mintime') * 3600;
        maxlength = $.getIniDbNumber('ttssettings', 'maxlength');
        wsurl = $.getSetIniDbString('ttssettings', 'wsurl');
    }

    /**
     * @function setWsurl
     * @param {string} url
     */
    function setWsurl(url) {
        wsurl = url;
        $.inidb.set('ttssettings', 'wsurl', wsurl);
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
                if (subcommand.equalsIgnoreCase("wsurl")) {
                    if (args[1] != null) {
                        setWsurl(args[1]);
                        $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.wsurl.updated', wsurl));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.wsurl.usage', wsurl));
                    }
                    return;
                }
            }
            // ws url set?
            if (wsurl.equalsIgnoreCase("")) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.nowsurl'));
                return;
            }
            // message empty?
            if (argsString.length() < 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.usage', $.getPointsString(multipliercost), $.getTimeString(mintime, true)));
                return;
            }
            // channel live?
            if (!$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.offlinewarning'));
                return;
            }
            // enough points?
            if (!$.isModv3(sender, tags) && senderPoints < cost) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.notenoughpoints', $.getPointsString(senderPoints), $.getPointsString(cost)));
                return;
            } else {
                // mod pay only what they have, if they dont have enough points
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
            var urlAndMessage = wsurl + sender + $.lang.get('ttscommand.write') + ": " + argsString;
            $.alertspollssocket.triggerTts(urlAndMessage);
            $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.success', $.getPointsString(cost)));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./ice/tts.js')) {
            $.registerChatCommand('./ice/tts.js', 'tts', 7);
            $.registerChatSubcommand('tts', 'info', 7);
        }
    });
    $.updateTts = updateTts;
})();