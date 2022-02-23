/*
 * by IceFlom
 */

(function() {
    // disabled by default
    $.getSetIniDbBoolean('modules', './ice/safe.js', false);

    var onlineOnly = $.getSetIniDbBoolean('safeSettings', 'onlineonly', true),
        joinTime = $.getSetIniDbNumber('safeSettings', 'joinTime', 120),
        costs = $.getSetIniDbNumber('safeSettings', 'costs', 100),
        minPlayer = $.getSetIniDbNumber('safeSettings', 'minPlayer', 5),
        cooldownMinutes = $.getSetIniDbNumber('safeSettings', 'cooldownminutes', 120),
        cooldownTimestamp = $.getSetIniDbNumber('safeSettings', 'cooldowntimestamp', 0),
        cooldownRaise = $.getSetIniDbNumber('safeSettings', 'cooldownraise', 15),
        enterMessage = $.getSetIniDbBoolean('safeSettings', 'enterMessage', true),
        warningMessage = $.getSetIniDbBoolean('safeSettings', 'warningMessage', true),
        randActive = $.getSetIniDbBoolean('safeSettings', 'randActive', false),
        randMinPoints = $.getSetIniDbNumber('safeSettings', 'randMinPoints', 200),
        randMaxPoints = $.getSetIniDbNumber('safeSettings', 'randMaxPoints', 500),
        randMinTime = $.getSetIniDbNumber('safeSettings', 'randMinTime', 60),
        randMaxTime = $.getSetIniDbNumber('safeSettings', 'randMaxTime', 120),
        discordAnnounce = $.getSetIniDbBoolean('safeSettings', 'discordAnnounce', false),
        discordChannel = $.getSetIniDbString('safeSettings', 'discordChannel', '0'),
        discordMessage = $.getSetIniDbString('safeSettings', 'discordMessage', '(user) wants to start a heist. You have (jointime) seconds to open (url) and join the heist. There are currently (safeamount) in the safe.'),
        contentOfSafe = $.getSetIniDbNumber('police', 'safe', 0),
        currentHeist = {},
        stories = [],
        lastStory,
        raiseCooldownTimestamp = 0;

    function reloadSafe() {
        onlineOnly = $.getIniDbBoolean('safeSettings', 'onlineonly');
        joinTime = $.getIniDbNumber('safeSettings', 'joinTime');
        costs = $.getIniDbNumber('safeSettings', 'costs');
        minPlayer = $.getIniDbNumber('safeSettings', 'minPlayer');
        cooldownMinutes = $.getIniDbNumber('safeSettings', 'cooldownminutes');
        cooldownTimestamp = $.getIniDbNumber('safeSettings', 'cooldowntimestamp');
        cooldownRaise = $.getIniDbNumber('safeSettings', 'cooldownraise');
        enterMessage = $.getIniDbBoolean('safeSettings', 'enterMessage');
        warningMessage = $.getIniDbBoolean('safeSettings', 'warningMessage');
        randActive = $.getIniDbBoolean('safeSettings', 'randActive');
        randMinPoints = $.getIniDbNumber('safeSettings', 'randMinPoints');
        randMaxPoints = $.getIniDbNumber('safeSettings', 'randMaxPoints');
        randMinTime = $.getIniDbNumber('safeSettings', 'randMinTime');
        randMaxTime = $.getIniDbNumber('safeSettings', 'randMaxTime');
        discordAnnounce = $.getIniDbBoolean('safeSettings', 'discordAnnounce');
        discordChannel = $.getIniDbString('safeSettings', 'discordChannel');
        discordMessage = $.getIniDbString('safeSettings', 'discordMessage');
    }

    /**
     * transfer timestamp to readable time format
     * @param timestamp
     * @returns {string}
     */
    function getFormattedTime(timestamp) {
        var hours,
            minutes,
            seconds;

        hours = Math.trunc(timestamp / 1000 / 60 / 60);
        timestamp = timestamp - Math.trunc(hours * 1000 * 60 * 60);
        minutes = Math.trunc(timestamp / 1000 / 60);
        timestamp = timestamp - Math.trunc(minutes * 1000 * 60);
        seconds = Math.trunc(timestamp / 1000);

        return hours + ":" + minutes + ":" + seconds;
    }

    function givePointsInterval() {
        var intervalMs,
            points;
        
        intervalMs = $.randRange(randMinTime, randMaxTime) * 60 * 1e3;
        points = $.randRange(randMinPoints, randMaxPoints);
        var t = setTimeout(function() {
            if ($.isOnline($.channelName)) {
                $.inidb.incr('police', 'safe', points);
                $.say($.lang.get('safe.randompoints', $.getPointsString(points)));
            }
            if (randActive) {
                givePointsInterval();
            }
        }, intervalMs);
        $.consoleLn($.lang.get('safe.randptlog', $.getPointsString(points), getFormattedTime(intervalMs)));
    }

    /**
     * @function setCooldown
     */
    function setCooldown() {
        var cooldownMinutesMs = cooldownMinutes * 60 * 1e3;
        cooldownTimestamp = new Date().getTime() + cooldownMinutesMs;
        $.setIniDbNumber('safeSettings', 'cooldowntimestamp', cooldownTimestamp);
    }

    /**
     * @function raiseCooldown
     */
    function raiseCooldown() {
        cooldownTimestamp = cooldownTimestamp + (cooldownRaise * 60 * 1e3);
        $.setIniDbNumber('safeSettings', 'cooldowntimestamp', cooldownTimestamp);
        raiseCooldownTimestamp = new Date().getTime() + (60 * 1e3);
    }

    /**
     * @function isRaiseOk
     * @returns {boolean}
     */
    function isRaiseOk() {
        return raiseCooldownTimestamp < new Date().getTime();
    }

    /**
     * @function isOnCooldown
     * @returns {boolean}
     */
    function isOnCooldown() {
        return cooldownTimestamp > new Date().getTime();
    }

    /**
     * @function getRemainingCooldown
     * @returns {integer}
     */
    function getRemainingCooldown() {
        return Math.ceil((cooldownTimestamp - new Date().getTime()) / 1000 / 60);
    }

    /**
     * @function getOverallProfit
     * @returns {integer}
     */
    function getOverallProfit() {
        var minPercent = 30,
            maxPercent = 100,
            randPercent,
            contentOfSafe = $.getIniDbNumber('police', 'safe');
        randPercent = $.randRange(minPercent, maxPercent);
        return Math.floor((contentOfSafe / 100) * randPercent);
    }

    /**
     * @function loadStories
     */
    function loadStories() {
        var storyId = 1,
            chapterId,
            lines;

        currentHeist.users = [];
        currentHeist.survivors = [];
        currentHeist.caught = [];
        currentHeist.gameState = 0;

        stories = [];

        for (storyId; $.lang.exists('safe.stories.' + storyId + '.title'); storyId++) {
            lines = [];
            for (chapterId = 1; $.lang.exists('safe.stories.' + storyId + '.chapter.' + chapterId); chapterId++) {
                lines.push($.lang.get('safe.stories.' + storyId + '.chapter.' + chapterId));
            }

            stories.push({
                game: ($.lang.exists('safe.stories.' + storyId + '.game') ? $.lang.get('safe.stories.' + storyId + '.game') : null),
                title: $.lang.get('safe.stories.' + storyId + '.title'),
                lines: lines,
            });
        }

        $.consoleDebug($.lang.get('safe.loaded', storyId - 1));

        for (var i in stories) {
            if (stories[i].game === null) {
                return;
            }
        }

        $.log.warn('You need at least one story, which is not bound to a specific game!');
        currentHeist.gameState = 2;
    }

    /**
     * @function checkUserAlreadyJoined
     * @param {string} username
     * @returns {boolean}
     */
    function checkUserAlreadyJoined(username) {
        var i;
        for (i in currentHeist.users) {
            if (currentHeist.users[i].username == username) {
                return true;
            }
        }
        return false;
    }

    /**
     * @function safeUsersListJoin
     * @param {Array} list
     * @returns {string}
     */
    function safeUsersListJoin(list) {
        var temp = [],
            i;
        for (i in list) {
            temp.push($.username.resolve(list[i].username));
        }
        return temp.join(', ');
    }

    /**
     * @function calculateResult
     */
    function calculateResult() {
        var i;
        for (i in currentHeist.users) {
            if ($.randRange(1, 100) > 50) {
                currentHeist.survivors.push(currentHeist.users[i]);
            } else {
                currentHeist.caught.push(currentHeist.users[i]);
            }
        }
    }

    /**
     * @function refund
     * @param {Array} userslist
     */
    function refund(userslist) {
        for (i in userslist) {
            $.inidb.incr('points', userslist[i].username, costs);
        }
    }

    /**
     * @function replaceTags
     * @param {string} line
     * @returns {string}
     */
    function replaceTags(line) {
        if (line.indexOf('(caught)') > -1) {
            if (currentHeist.caught.length > 0) {
                return line.replace('(caught)', safeUsersListJoin(currentHeist.caught));
            } else {
                return '';
            }
        }
        if (line.indexOf('(survivors)') > -1) {
            if (currentHeist.survivors.length > 0) {
                return line.replace('(survivors)', safeUsersListJoin(currentHeist.survivors));
            } else {
                return '';
            }
        }
        return line
    }

    function announceDiscord(username) {
        var message = discordMessage;
        if (message.match(/\(user\)/g)) {
            message = $.replace(message, '(user)', $.resolveRank(username));
        }
        if (message.match(/\(jointime\)/g)) {
            message = $.replace(message, '(jointime)', joinTime);
        }
        if (message.match(/\(url\)/g)) {
            message = $.replace(message, '(url)', 'https://twitch.tv/' + $.channelName);
        }
        if (message.match(/\(safeamount\)/g)) {
            message = $.replace(message, '(safeamount)', $.getPointsString($.getIniDbNumber('police', 'safe')));
        }
        $.discord.say(discordChannel, message);
    }

    /**
     * @function startHeist
     * @param {string} username
     */
    function startHeist(username) {
        currentHeist.gameState = 1;

        var t = setTimeout(function() {
            if (currentHeist.users.length >= minPlayer) {
                runStory();
            } else {
                // not enough player
                refund(currentHeist.users);
                $.say($.lang.get('safe.start.notenough', minPlayer, currentHeist.users.length));
                clearCurrentAdventure();
            }
        }, joinTime * 1e3);

        if (discordAnnounce) {
            announceDiscord(username)
        }
        $.say($.lang.get('safe.start.success', $.resolveRank(username), $.pointNameMultiple, minPlayer, $.getPointsString(costs)));
    }

    /**
     * @function joinHeist
     * @param {string} username
     * @param {Number} bet
     * @returns {boolean}
     */
    function joinHeist(username) {
        if (stories.length < 1) {
            $.log.error('No story found; Cannot start heist!');
            return;
        }

        if (currentHeist.gameState > 1) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('safe.join.notpossible'));
            return;
        }

        if (checkUserAlreadyJoined(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('safe.alreadyjoined'));
            return;
        }

        if (costs > $.getUserPoints(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('safe.join.needpoints', $.getPointsString($.getUserPoints(username)), $.getPointsString(costs)));
            return;
        }
        
        if (currentHeist.gameState == 0) {
            startHeist(username);
        } else {
            if (enterMessage) {
                $.say($.whisperPrefix(username) + $.lang.get('safe.join.success', $.getPointsString(costs)));
            }
        }

        currentHeist.users.push({
            username: username,
            costs: parseInt(costs),
        });

        $.inidb.decr('points', username, costs);
        return true;
    }

    /**
     * @function runStory
     */
    function runStory() {
        var progress = 0,
            temp = [],
            story,
            line,
            t;

        currentHeist.gameState = 2;
        calculateResult();

        var game = $.getGame($.channelName);

        for (var i in stories) {
            if (stories[i].game != null) {
                if (game.equalsIgnoreCase(stories[i].game)) {
                    temp.push({
                        title: stories[i].title,
                        lines: stories[i].lines
                    });
                }
            } else {
                temp.push({
                    title: stories[i].title,
                    lines: stories[i].lines
                });
            }
        }

        do {
            story = $.randElement(temp);
        } while (story == lastStory && stories.length != 1);

        $.say($.lang.get('safe.runstory', story.title, currentHeist.users.length));

        t = setInterval(function() {
            if (progress < story.lines.length) {
                line = replaceTags(story.lines[progress]);
                if (line != '') {
                    $.say(line.replace(/\(game\)/g, $.twitchcache.getGameTitle() + ''));
                }
            } else {
                endHeist();
                clearInterval(t);
            }
            progress++;
        }, 5e3);
    }

    /**
     * @function endHeist
     */
    function endHeist() {
        var i, pay = 0, overallProfit = 0, username, maxlength = 0;
        var temp = [];
        
        // survivors available
        if (currentHeist.survivors.length > 0) {
            overallProfit = getOverallProfit();
            pay = Math.floor(overallProfit / currentHeist.survivors.length);

            for (i in currentHeist.survivors) {
                $.inidb.decr('police', 'safe', pay);
                $.inidb.incr('heistPayoutsTEMP', currentHeist.survivors[i].username, pay);
                $.inidb.incr('points', currentHeist.survivors[i].username, currentHeist.survivors[i].costs + pay);
            }

            for (i in currentHeist.survivors) {
                username = currentHeist.survivors[i].username;
                maxlength += username.length();
                temp.push($.username.resolve(username) + ' (+' + $.getPointsString($.inidb.get('heistPayoutsTEMP', currentHeist.survivors[i].username)) + ')');
            }
        }
        if (overallProfit > 0) {
            $.say($.lang.get('safe.pointsummary', $.getPointsString(overallProfit)));
        }
        if (temp.length == 0) {
            $.say($.lang.get('safe.completed.no.win'));
        } else if (((maxlength + 14) + $.channelName.length) > 512) {
            $.say($.lang.get('safe.completed.win.total', currentHeist.survivors.length, currentHeist.caught.length)); //in case too many people enter.
        } else {
            $.say($.lang.get('safe.completed', temp.join(', ')));
        }
        setCooldown();
        clearCurrentAdventure();
        temp = "";
    }

    /**
     * @function clearCurrentAdventure
     */
    function clearCurrentAdventure() {
        currentHeist = {
            gameState: 0,
            users: [],
            survivors: [],
            caught: [],
        }
        $.inidb.RemoveFile('heistPayoutsTEMP');
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        if (command.equalsIgnoreCase('safe') || command.equalsIgnoreCase('tresor')) {
            var safe = $.getIniDbNumber('police', 'safe');
            $.say($.lang.get('safe.content', $.getPointsString(safe)));
        }

        if (command.equalsIgnoreCase('heist') || command.equalsIgnoreCase('tresorraub')) {
            if (onlineOnly && !$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('safe.onlineonly'));
                return;
            }
            // check cooldown
            if (isOnCooldown()) {
                $.say($.whisperPrefix(sender) + $.lang.get('safe.oncooldown', getRemainingCooldown()));
                if (isRaiseOk() && $.randRange(1, 100) < 31) {
                    var t = setTimeout(function() {
                        raiseCooldown();
                        $.say($.whisperPrefix(sender) + $.lang.get('safe.caught', cooldownRaise, getRemainingCooldown()));
                    }, 2e3);
                }
                return;
            }

            if ($.getIniDbNumber('police', 'safe') < 10) {
                $.say($.whisperPrefix(sender) + $.lang.get('safe.empty'));
                return;
            }
            if (currentHeist.gameState == 0 && (typeof action === 'undefined' || !action.equalsIgnoreCase('start'))) {
                $.say($.whisperPrefix(sender) + $.lang.get('safe.adventure.usage', $.getPointsString(costs)));
                return;
            }
            joinHeist(sender);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./ice/safe.js', 'heist', 7);
        $.registerChatCommand('./ice/safe.js', 'safe', 7);
        // german commands
        $.registerChatCommand('./ice/safe.js', 'tresorraub', 7);
        $.registerChatCommand('./ice/safe.js', 'tresor', 7);
        loadStories();
        if (randActive) {
            givePointsInterval();
        }
    });

    $.reloadSafe = reloadSafe;
})();
