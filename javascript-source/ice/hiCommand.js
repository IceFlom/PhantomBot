/**
 * hiCommand.js
 * by IceFlom
 *
 * Individual greetings
 */
(function() {
    // disabled by default
    $.getSetIniDbBoolean('modules', './ice/hiCommand.js', false);

    var cost = $.getSetIniDbNumber('hisettings', 'cost', 0),
        defaultMessage = $.getSetIniDbString('hisettings', 'defaultmsg', ''),
        onlineonly = $.getSetIniDbBoolean('hisettings', 'onlineonly', false),
        userCanSetMsg = $.getSetIniDbBoolean('hisettings', 'usercansetmsg', true),
        autogreeting = $.getSetIniDbBoolean('hisettings', 'autogreeting', false),
        autoCooldownMinutes = $.getSetIniDbNumber('hisettings', 'autocooldownminutes', 120),
        cachedTimePerUser = {};

    /**
     * @function updateHi (reload settings)
     */
    function updateHi() {
        cost = $.getIniDbNumber('hisettings', 'cost');
        defaultMessage = $.getIniDbString('hisettings', 'defaultmsg');
        onlineonly = $.getIniDbNumber('hisettings', 'onlineonly');
        userCanSetMsg = $.getIniDbBoolean('hisettings', 'usercansetmsg');
        autogreeting = $.getIniDbBoolean('hisettings', 'autogreeting');
        autoCooldownMinutes = $.getIniDbNumber('hisettings', 'autocooldownminutes')
    }

    /**
     * Toggles the onlineonly variable and saves the current state in database
     */
    function toggleOnlineonly() {
        onlineonly = !onlineonly;
        $.setIniDbBoolean('hisettings', 'onlineonly', onlineonly);
    }

    /**
     * Toggles the userCanSetMsg variable and saves the current state in database
     */
    function toggleUserCanSetMsg() {
        userCanSetMsg = !userCanSetMsg;
        $.setIniDbBoolean('hisettings', 'usercansetmsg', userCanSetMsg);
    }

    /**
     * Toggles the autogreeting variable and saves the current state in database
     */
    function toggleAutogreeting() {
        autogreeting = !autogreeting;
        $.setIniDbBoolean('hisettings', 'autogreeting', autogreeting);
    }

    /**
     * Updates the cost to set a new custom message
     */
    function updateCost(costparam) {
        cost = costparam
        $.setIniDbBoolean('hisettings', 'cost', cost);
    }

    /**
     * Updates the cooldown for automatic mode
     * (minues since last message of a user before the greeting will be posted again)
     */
    function updateAutoCooldownMinutes(autoCooldownMinutesParam) {
        autoCooldownMinutes = autoCooldownMinutesParam
        $.setIniDbBoolean('hisettings', 'autocooldownminutes', autoCooldownMinutes);
    }

    /**
     * Begrüßung auslösen
     * Wenn Indiviualbegrüßung vorhanden, diese nutzen,
     * sonst DB-Tabelle prüfen, wenn vorhanden, diese nutzen,
     * sonst allgemeine Standardbegrüßung
     */
    function doGreeting(username) {
        var message = "";
        // custom message available?
        if (!$.inidb.exists("himessages", username)) {
            // no, write default message
            message = defaultMessage;
        } else {
            // yes, write custom message
            message = $.getIniDbString('himessages', username);
        }

        // search/replace tag username
        if (message.match(/\(username\)/g)) {
            message = $.replace(message, '(username)', $.username.resolve(username));
        }
        // search/replace tag playsound
        if (message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/g)) {
            if (!$.audioHookExists(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1])) {
                $.log.error('Kann Audio Hook nicht abspielen: Audio Hook existiert nicht.');
            } else {
                $.alertspollssocket.triggerAudioPanel(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1]);
                message = $.replace(message, message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[0], '');
            }
        }
        // search replace tag alert
        if (message.match(/\(alert [,.\w\W]+\)/g)) {
            var filename = message.match(/\(alert ([,.\w\W]+)\)/)[1];
            $.alertspollssocket.alertImage(filename);
            message = (message + '').replace(/\(alert [,.\w\W]+\)/, '');
        }

        if (message === "") {
            return;
        }
        if (message.match('\n')) {
            var splitMessage = message.split('\n');

            for (var i = 0; i < splitMessage.length; ++i) {
                if (!splitMessage[i].equalsIgnoreCase("")) {
                    $.say(splitMessage[i]);
                }
                java.lang.Thread.sleep(1000);
            }
        } else {
            $.say(message);
        }
    }

    function removePoints(username, amount) {
        $.inidb.decr('points', username, amount);
    }

    function secureText(text) {
        // remove line breaks (spam protection)
        text = $.replace(text, '\n', ' ');
        // add space after ! (security)
        text = $.replace(text, '!', '! ');
        // add space after / (security)
        text = $.replace(text, '/', '/ ');
        // no sound
        text = $.replace(text, 'alert', '');
        // no alert
        text = $.replace(text, 'playsound', '');
        return text;
    }

    /**
     * Save custom message
     */
    function setMessage(username, isDefault, args) {
        // Check points
        var senderPoints = $.getUserPoints(username),
            fullMessage = "";
        if (senderPoints < cost) {
            $.say($.whisperPrefix(username) + $.lang.get('hicommand.notenoughpoints', senderPoints, $.getPointsString(cost)));
            return;
        }
        // Build message
        for (var i = 1, len = args.length; i < len; i++) {
            fullMessage += args[i] + " ";
        }

        // Usermessage
        if (!isDefault) {
            fullMessage = secureText(fullMessage);
            // Save in db
            $.setIniDbString('himessages', username, fullMessage);
            // remove points
            removePoints(username, cost);
        // Default message
        } else {
            defaultMessage = fullMessage;
            $.setIniDbString('hisettings', 'defaultmsg', fullMessage);
        }

        // write answer
        $.say($.lang.get('hicommand.saved', fullMessage));
    }

    /**
     * Save custom message for another user
     */
    function adminsetMessage(username, args) {
        var fullMessage = "";
        // Build message
        for (var i = 2, len = args.length; i < len; i++) {
            fullMessage += args[i] + " ";
        }
        $.setIniDbString('himessages', username, fullMessage);
        // write answer
        $.say($.lang.get('hicommand.adminsaved', $.resolveRank(username), fullMessage));
    }

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        if (!autogreeting) {
            return;
        }

        var sender = event.getSender().toLowerCase(),
            cachedTime = cachedTimePerUser[sender];

        if (onlineonly && !$.isOnline($.channelName)) {
            return;
        }
        if (!$.isBot(sender)) {
            if (cachedTime !== undefined) {
                var differenceMinutes = ($.systemTime() - cachedTime) / 1000 / 60;
                if (differenceMinutes < autoCooldownMinutes) {
                    cachedTimePerUser[sender] = $.systemTime();
                    return;
                }
            }
            cachedTimePerUser[sender] = $.systemTime();
            doGreeting(sender);
        }
    });

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            subcommand = args[0];

        if (command.equalsIgnoreCase('hi')) {

            if (typeof subcommand === 'undefined') {
                if (onlineonly && !$.isOnline($.channelName)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.onlineonly'));
                    return;
                }
                // Write message only, if autogreeting is disabled
                if (!autogreeting) {
                    doGreeting(sender);
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.autogreeting.info'));
                }
                return;
            }
            // Subcommand check
            if (subcommand.equalsIgnoreCase("help")) {
                $.say($.whisperPrefix(sender) + $.lang.get('hicommand.usage', $.getPointsString(cost)));
                if (cost > 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.cost.current', $.getPointsString(cost)));
                }
            } else if (subcommand.equalsIgnoreCase("set")) {
                if (userCanSetMsg) {
                    setMessage(sender, false, args)
                }
            } else if (subcommand.equalsIgnoreCase("test")) {
                var username = args[1].toLowerCase();
                doGreeting(username);
            } else if (subcommand.equalsIgnoreCase("onlineonly")) {
                toggleOnlineonly();
                if (onlineonly) {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.onlineonly.active'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.onlineonly.inactive'));
                }
            } else if (subcommand.equalsIgnoreCase("usermessage")) {
                toggleUserCanSetMsg();
                if (userCanSetMsg) {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.usercansetmsg.active'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.usercansetmsg.inactive'));
                }
            } else if (subcommand.equalsIgnoreCase("autogreeting")) {
                toggleAutogreeting();
                if (autogreeting) {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.autogreeting.active'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.autogreeting.inactive'));
                }
            } else if (subcommand.equalsIgnoreCase("cost")) {
                var costvalue = args[1];
                if (!isNaN(costvalue)) {
                    updateCost(costvalue);
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.cost.updated', $.getPointsString(cost)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.cost.current', $.getPointsString(cost)));
                }
            } else if (subcommand.equalsIgnoreCase("autocooldown")) {
                var autoCooldownMinutesValue = args[1];
                if (!isNaN(autoCooldownMinutesValue)) {
                    updateAutoCooldownMinutes(autoCooldownMinutesValue);
                }
                $.say($.whisperPrefix(sender) + $.lang.get('hicommand.autocooldownminutes.current', autoCooldownMinutes));
            } else if (subcommand.equalsIgnoreCase("default")) {
                setMessage(sender, true, args);
            } else if (subcommand.equalsIgnoreCase("adminset")) {
                var username = $.user.sanitize(args[1]).toLowerCase();
                adminsetMessage(username, args);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('hicommand.usage', $.getPointsString(cost)));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./ice/hiCommand.js')) {
            $.registerChatCommand('./ice/hiCommand.js', 'hi', 7);
            $.registerChatSubcommand('hi', 'help', 7);
            $.registerChatSubcommand('hi', 'set', 7);
            $.registerChatSubcommand('hi', 'test', 1);
            $.registerChatSubcommand('hi', 'onlineonly', 1);
            $.registerChatSubcommand('hi', 'usermessage', 1);
            $.registerChatSubcommand('hi', 'autogreeting', 1);
            $.registerChatSubcommand('hi', 'cost', 1);
            $.registerChatSubcommand('hi', 'autocooldown', 1);
            $.registerChatSubcommand('hi', 'default', 1);
            $.registerChatSubcommand('hi', 'adminset', 1);
        }
    });
    $.updateHi = updateHi;
})();