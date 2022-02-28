/**
 * tts.js
 * by IceFlom
 *
 * Text-To-Speech
 */
(function() {
    // disabled by default
    $.getSetIniDbBoolean('modules', './ice/tts.js', false);

    var fixedcost = $.getSetIniDbNumber('ttssettings', 'fixedcost', 0),
        multipliercost = $.getSetIniDbNumber('ttssettings', 'multipliercost', 1),
        maxlength = $.getSetIniDbNumber('ttssettings', 'maxlength', 280),
        wsurl = $.getSetIniDbString('ttssettings', 'wsurl', "");

    /**
     * @function updateTts (reload settings)
     */
    function updateTts() {
        fixedcost = $.getIniDbNumber('ttssettings', 'fixedcost');
        multipliercost = $.getIniDbNumber('ttssettings', 'multipliercost');
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
     * @function setMaxlength
     * @param {int} length
     */
    function setMaxlength(length) {
        maxlength = length;
        $.inidb.set('ttssettings', 'maxlength', maxlength);
    }

    /**
     * @function setFixedcost
     * @param {int} cost
     */
    function setFixedcost(cost) {
        fixedcost = cost;
        $.inidb.set('ttssettings', 'fixedcost', fixedcost);
    }

    /**
     * @function setMultipliercost
     * @param {int} cost
     */
    function setMultipliercost(cost) {
        multipliercost = cost;
        $.inidb.set('ttssettings', 'multipliercost', multipliercost);
    }

    /**
     * @function calculatecost
     * @param {int} msglength
     * @returns {int}
     */
    function calculatecost(msglength) {
        var cost = 0;
        if (fixedcost > 0) {
            cost += fixedcost;
        }
        if (multipliercost > 0) {
            cost += msglength * multipliercost;
        }
        return cost;
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
            numberOfChars = argsString.length(),
            cost = calculatecost(numberOfChars),
            value = "";

        if (command.equalsIgnoreCase('tts')) {
            // Subcommand check
            if (typeof subcommand !== 'undefined') {
                if (subcommand.equalsIgnoreCase("info")) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.usage'));
                    return;
                }
                if (subcommand.equalsIgnoreCase("wsurl")) {
                    value = args[1];
                    if (value != null) {
                        setWsurl(value);
                        $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.wsurl.updated', wsurl));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.wsurl.usage', wsurl));
                    }
                    return;
                }
                if (subcommand.equalsIgnoreCase("fixedcost")) {
                    value = args[1];
                    if (value != null && !isNaN(value)) {
                        setFixedcost(value);
                        $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.fixedcost.updated', wsurl));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.fixedcost.usage', wsurl));
                    }
                    return;
                }
            }
            // ws url set?
            if (wsurl.equalsIgnoreCase("")) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.nowsurl'));
                return;
            }
            // channel live?
            if (!$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.offlinewarning'));
                return;
            }
            // message empty?
            if (numberOfChars < 1) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.usage'));
                return;
            }
            // message too long?
            if (numberOfChars > maxlength) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.toolong', maxlength, numberOfChars));
                return;
            }
            // enough points?
            if (!$.isModv3(sender, tags) && senderPoints < cost) {
                $.say($.whisperPrefix(sender) + $.lang.get('ttscommand.notenoughpoints', $.getPointsString(senderPoints), $.getPointsString(fixedcost), $.getPointsString(multipliercost), $.getPointsString(cost)));
                return;
            }

            // process tts
            var urlAndMessage = wsurl + sender + $.lang.get('ttscommand.write') + ": " + argsString
            $.alertspollssocket.triggerTts(urlAndMessage);
            if (!$.isModv3(sender, tags)) {
                $.inidb.decr('points', sender, cost);
            }
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