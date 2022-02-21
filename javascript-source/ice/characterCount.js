/**
 * characterCount.js
 *
 * Count number of characters sent by user
 *
 * by IceFlom
 *
 */
(function() {
    var topAmount = $.getSetIniDbNumber('charcount_settings', 'topamount', 5),
        dbSaveMinutes = $.getSetIniDbNumber('charcount_settings', 'dbsaveminutes', 1),
        countingSince = $.getSetIniDbNumber('charcount_settings', 'countingsince', new Date().getTime()),
        charCountTable = 'charcount',
        charCountRecords = [],
        userCache = {};
    /*
     * @function reloadCharacterCount
     */
    function reloadCharacterCount() {
        topAmount = $.getIniDbNumber('charcount_settings', 'topamount');
        dbSaveMinutes = $.getIniDbNumber('charcount_settings', 'dbsaveminutes');
    }

    function loadCharcountTable() {
        charCountRecords = $.inidb.GetKeyValueList(charCountTable, '');
        charCountRecords.sort((a, b) => {
            return b.getValue() - a.getValue();
        });
    }

    /**
     * @function getUserPosition()
     * @param {string} sender
     */
    function getUserPosition(sender) {
        return (charCountRecords.findIndex((record) => record.getKey().equalsIgnoreCase(sender)) + 1);
    }

    function getNumberOfRecords() {
        return charCountRecords.length;
    }

    /*
     * @function getTop
     *
     * @returns {Array}
     */
    function getTop() {
        // Load two more from db because of streamer/bot filtering
        var list = [],
            i,
            ctr = 0;

        for (i in charCountRecords) {
            if (!$.isBot(charCountRecords[i].getKey()) && !$.isOwner(charCountRecords[i].getKey())) {
                if (ctr++ == topAmount) {
                    break;
                }
                list.push({
                    username: charCountRecords[i].getKey(),
                    value: charCountRecords[i].getValue()
                });
            }
        }
        return list.slice(0, topAmount);
    }

    /* @function reset
     * Deletes one or all entries in the database
     */
    function reset(username) {
        // reset all?
        if (username.equalsIgnoreCase('all')) {
            userCache = {};
            countingSince = new Date().getTime();
            $.setIniDbNumber('charcount_settings', 'countingsince', countingSince);
            $.inidb.RemoveFile(charCountTable);
            $.say($.lang.get('charactercount.reset.all'));
        } else {
            if (!$.inidb.exists(charCountTable, username)) {
                $.say($.lang.get('charactercount.reset.notfound', username));
            } else {
                $.inidb.del(charCountTable, username);
                $.say($.lang.get('charactercount.reset.user', $.resolveRank(username)));
            }
        }
    }

    /*
     * @function saveInDatabase
     * Save the cached informations in the database
     */
    function saveInDatabase() {
        var keys = [],
            values = [];
        for (username in userCache) {
            var charsInDb = $.getIniDbNumber(charCountTable, username),
                charCount;
            if (charsInDb !== undefined) {
                charCount = charsInDb + userCache[username];
            } else {
                charCount = userCache[username];
            }
            keys.push(username);
            values.push(charCount);
            delete userCache[username];
        }
        $.inidb.setbatch(charCountTable, keys, values);
    }

    function getFormattedDate(timestamp) {
        var date = new Date(timestamp);
        return ("0" + date.getDate()).slice(-2) + "."
            + ("0" + (date.getMonth() + 1)).slice(-2) + "."
            + date.getFullYear();
    }

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        if ($.isOnline($.channelName)) {
            var username = event.getSender().toLowerCase(),
                msgCharCount = event.getMessage().length(),
                cachedCount = userCache[username];
            if (cachedCount !== undefined) {
                userCache[username] = cachedCount + msgCharCount;
            } else {
                userCache[username] = msgCharCount;
            }
        }
    });

    // Set the timer for character db save
    var interval = setInterval(function() {
        saveInDatabase();
        loadCharcountTable();
    }, dbSaveMinutes * 60 * 1e3, 'scripts::commands::characterCount.js');

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var command = event.getCommand(),
            args = event.getArgs(),
            sender = event.getSender().toLowerCase(),
            subcmd = args[0],
            value = args[1];

        /**
         * @commandpath toptext - Display the top people with the most points
         */
        if (command.equalsIgnoreCase('toptext')) {
            // Subcommand check
            if (subcmd !== undefined) {
                if (subcmd.equalsIgnoreCase('set')) {
                    if (value !== undefined && !isNaN(parseInt(value))) {
                        topAmount = value;
                        $.setIniDbNumber('charcount_settings', 'topamount', topAmount);
                        $.say($.whisperPrefix(sender) + $.lang.get('charactercount.set.success', topAmount));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('charactercount.set.usage'));
                    return;
                }
                if (subcmd.equalsIgnoreCase('reset')) {
                    if (value !== undefined) {
                        reset(value.toLowerCase());
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('charactercount.reset.usage'));
                    return;
                }
                $.say($.whisperPrefix(sender) + $.lang.get('charactercount.usage'));
                return;
            }
            // send topliste to chat
            var temp = getTop(),
                top = [],
                i;

            for (i in temp) {
                top.push((parseInt(i) + 1) + '. ' + $.username.resolve(temp[i].username) + ' ' + temp[i].value + ' ' + $.lang.get('charactercount.unit'));
            }
            $.say($.lang.get('charactercount.top', topAmount, top.join(', '), getFormattedDate(countingSince)));
        } else if (command.equalsIgnoreCase('text')) {
            // send user specific character count to chat
            var userCount = $.getIniDbNumber('charcount', sender, 0);
            if (userCount > 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('charactercount.usercount.result', userCount + ' ' + $.lang.get('charactercount.unit'), getUserPosition(sender), getNumberOfRecords()));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('charactercount.usercount.notfound'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./ice/characterCount.js', 'toptext', 7);
        $.registerChatSubcommand('toptext', 'set', 1);
        $.registerChatSubcommand('toptext', 'reset', 1);
        $.registerChatCommand('./ice/characterCount.js', 'text', 7);
    });
    loadCharcountTable();
    $.reloadCharacterCount = reloadCharacterCount;
})();
