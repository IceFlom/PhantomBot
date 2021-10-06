/**
 * hiCommand.js
 * by IceFlom
 *
 * Individual greetings
 */
(function() {
    var cost = $.getSetIniDbNumber('hisettings', 'cost', 0),
        defaultMessage = $.getSetIniDbString('hisettings', 'defaultmsg', ''),
        onlineonly = $.getSetIniDbBoolean('hisettings', 'onlineonly', false);

    /**
     * @function updateHi (reload settings)
     */
    function updateHi() {
        cost = $.getIniDbNumber('hisettings', 'cost');
        defaultMessage = $.getIniDbString('hisettings', 'defaultmsg');
        onlineonly = $.getIniDbNumber('hisettings', 'onlineonly');
    }

    /**
     *
     */
    function toggleOnlineonly() {
        onlineonly = !onlineonly;
        $.setIniDbBoolean('hisettings', 'onlineonly', onlineonly);
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

    /**
     * Save custom message
     */
    function setMessage(username, args) {
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
        // remove line breaks (spam protection)
        fullMessage = $.replace(fullMessage, '\n', ' ');
        // add space after ! (security)
        fullMessage = $.replace(fullMessage, '!', '! ');
        // add space after / (security)
        fullMessage = $.replace(fullMessage, '/', '/ ');
        // no sound
        fullMessage = $.replace(fullMessage, 'alert', '');
        // no alert
        fullMessage = $.replace(fullMessage, 'playsound', '');
        // Save in db
        $.setIniDbString('himessages', username, fullMessage);
        // remove points
        $.inidb.decr('points', username, cost);
        // write answer
        $.say($.lang.get('hicommand.saved', fullMessage));
    }

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
                doGreeting(sender);
                return;
            }
            // Subcommand check
            if (subcommand.equalsIgnoreCase("help")) {
                $.say($.whisperPrefix(sender) + $.lang.get('hicommand.usage', $.getPointsString(cost)));
            } else if (subcommand.equalsIgnoreCase("set")) {
                setMessage(sender, args)
            } else if (subcommand.equalsIgnoreCase("test")) {
                // Anderen Nutzer testen
                doGreeting(args[1].toLowerCase());
            } else if (subcommand.equalsIgnoreCase("onlineonly")) {
                // Umschalten, ob Kanal online sein muss
                toggleOnlineonly();
                if (onlineonly) {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.onlineonly.active'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('hicommand.onlineonly.inactive'));
                }
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('hicommand.usage', $.getPointsString(cost)));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./custom/hiCommand.js')) {
            $.registerChatCommand('./custom/hiCommand.js', 'hi', 7);
            $.registerChatSubcommand('hi', 'help', 7);
            $.registerChatSubcommand('hi', 'set', 7);
            $.registerChatSubcommand('hi', 'test', 1);
            $.registerChatSubcommand('hi', 'onlineonly', 1);
        }
    });
    $.updateHi = updateHi;
})();