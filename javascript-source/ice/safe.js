/*
 * by IceFlom
 */

(function() {
    var onlineOnly = $.getSetIniDbBoolean('tresorSettings', 'onlineonly', true),
        joinTime = $.getSetIniDbNumber('tresorSettings', 'joinTime', 120),
        costs = $.getSetIniDbNumber('tresorSettings', 'costs', 100),
        minPlayer = $.getSetIniDbNumber('tresorSettings', 'minPlayer', 5),
        sperrzeitMin = $.getSetIniDbNumber('tresorSettings', 'sperrzeitminuten', 120),
        sperrTimestamp = $.getSetIniDbNumber('tresorSettings', 'sperrtimestamp', 0),
        sperrErhoehung = $.getSetIniDbNumber('tresorSettings', 'sperrerhoehung', 15),
        enterMessage = $.getSetIniDbBoolean('tresorSettings', 'enterMessage', true),
        warningMessage = $.getSetIniDbBoolean('tresorSettings', 'warningMessage', true),
        randActive = $.getSetIniDbBoolean('tresorSettings', 'randActive', true),
        randMinPoints = $.getSetIniDbNumber('tresorSettings', 'randMinPoints', 200),
        randMaxPoints = $.getSetIniDbNumber('tresorSettings', 'randMaxPoints', 500),
        randMinTime = $.getSetIniDbNumber('tresorSettings', 'randMinTime', 60),
        randMaxTime = $.getSetIniDbNumber('tresorSettings', 'randMaxTime', 120),
        discordAnnounce = $.getSetIniDbBoolean('tresorSettings', 'discordAnnounce', false),
        discordChannel = $.getSetIniDbString('tresorSettings', 'discordChannel', '0'),
        discordMessage = $.getSetIniDbString('tresorSettings', 'discordMessage', '(user) möchte einen Tresorraub starten. Du hast (jointime) Sekunden Zeit, um auf (url) daran teilzunehmen. Im Tresor befinden sich aktuell (safeamount).'),
        currentTresorraub = {},
        stories = [],
        lastStory,
        erhoehungSperrTS = 0;

    function reloadTresor() {
        onlineOnly = $.getIniDbBoolean('tresorSettings', 'onlineonly');
        joinTime = $.getIniDbNumber('tresorSettings', 'joinTime');
        costs = $.getIniDbNumber('tresorSettings', 'costs');
        minPlayer = $.getIniDbNumber('tresorSettings', 'minPlayer');
        sperrzeitMin = $.getIniDbNumber('tresorSettings', 'sperrzeitminuten');
        sperrTimestamp = $.getIniDbNumber('tresorSettings', 'sperrtimestamp');
        sperrErhoehung = $.getIniDbNumber('tresorSettings', 'sperrerhoehung');
        enterMessage = $.getIniDbBoolean('tresorSettings', 'enterMessage');
        warningMessage = $.getIniDbBoolean('tresorSettings', 'warningMessage');
        randActive = $.getIniDbBoolean('tresorSettings', 'randTresorActive');
        randMinPoints = $.getIniDbNumber('tresorSettings', 'randMinPoints');
        randMaxPoints = $.getIniDbNumber('tresorSettings', 'randMaxPoints');
        randMinTime = $.getIniDbNumber('tresorSettings', 'randMinTime');
        randMaxTime = $.getIniDbNumber('tresorSettings', 'randMaxTime');
        discordAnnounce = $.getIniDbBoolean('tresorSettings', 'discordAnnounce');
        discordChannel = $.getIniDbString('tresorSettings', 'discordChannel');
        discordMessage = $.getIniDbString('tresorSettings', 'discordMessage');
    };

    function givePointsInterval() {
        var intervalMs,
            points;
        
        intervalMs = $.randRange(randMinTime, randMaxTime) * 60 * 1e3;
        points = $.randRange(randMinPoints, randMaxPoints);
        var t = setTimeout(function() {
            if ($.isOnline($.channelName)) {
                $.inidb.incr('polizei', 'tresor', points);
                $.say($.lang.get('tresorsystem.randompoints', $.getPointsString(points)));
            }
            if (randActive) {
                givePointsInterval();
            }
        }, intervalMs);
        $.consoleLn($.lang.get('tresorsystem.randptlog', $.getPointsString(points), $.getFormattedTime(intervalMs)));
    };

    /**
     * @function setSperrzeit
     */
    function setSperrzeit() {
        var sperrMinutenMs = sperrzeitMin * 60 * 1e3;
        sperrTimestamp = new Date().getTime() + sperrMinutenMs;
        $.setIniDbNumber('tresorSettings', 'sperrtimestamp', sperrTimestamp);
    };

    /**
     * @function erhoeheSperrzeit
     */
    function erhoeheSperrzeit() {
        sperrTimestamp = sperrTimestamp + (sperrErhoehung * 60 * 1e3);
        $.setIniDbNumber('tresorSettings', 'sperrtimestamp', sperrTimestamp);
        erhoehungSperrTS = new Date().getTime() + (60 * 1e3);
    };

    /**
     * @function isErhoehungOk
     * @returns {boolean}
     */
    function isErhoehungOk() {
        return erhoehungSperrTS < new Date().getTime();
    };

    /**
     * @function isGesperrt
     * @returns {boolean}
     */
    function isGesperrt() {
        return sperrTimestamp > new Date().getTime();
    };

    /**
     * @function getSperrRest
     * @returns {integer}
     */
    function getSperrRest() {
        return Math.ceil((sperrTimestamp - new Date().getTime()) / 1000 / 60);
    };

    /**
     * @function getGesamtgewinn
     * Zufallsprozentzahl zwischen 30 und 100, Anteil am Tresorinhalt
     * @returns {integer}
     */
    function getGesamtgewinn() {
        var minProzent = 30,
            maxProzent = 100,
            randProzent,
            tresorinhalt = $.getIniDbNumber('polizei', 'tresor');
        randProzent = $.randRange(minProzent, maxProzent);
        return Math.floor((tresorinhalt / 100) * randProzent);
    }

    /**
     * @function loadStories
     */
    function loadStories() {
        var storyId = 1,
            chapterId,
            lines;

        currentTresorraub.users = [];
        currentTresorraub.survivors = [];
        currentTresorraub.caught = [];
        currentTresorraub.gameState = 0;

        stories = [];

        for (storyId; $.lang.exists('tresorsystem.stories.' + storyId + '.title'); storyId++) {
            lines = [];
            for (chapterId = 1; $.lang.exists('tresorsystem.stories.' + storyId + '.chapter.' + chapterId); chapterId++) {
                lines.push($.lang.get('tresorsystem.stories.' + storyId + '.chapter.' + chapterId));
            }

            stories.push({
                game: ($.lang.exists('tresorsystem.stories.' + storyId + '.game') ? $.lang.get('tresorsystem.stories.' + storyId + '.game') : null),
                title: $.lang.get('tresorsystem.stories.' + storyId + '.title'),
                lines: lines,
            });
        }

        $.consoleDebug($.lang.get('tresorsystem.loaded', storyId - 1));

        for (var i in stories) {
            if (stories[i].game === null) {
                return;
            }
        }

        $.log.warn('Du musst mindestens eine Tresorraub-Geschichte haben, bei dem nicht ein bestimmtes Spiel gesetzt ist.');
        currentTresorraub.gameState = 2;
    };

    /**
     * @function checkUserAlreadyJoined
     * @param {string} username
     * @returns {boolean}
     */
    function checkUserAlreadyJoined(username) {
        var i;
        for (i in currentTresorraub.users) {
            if (currentTresorraub.users[i].username == username) {
                return true;
            }
        }
        return false;
    };

    /**
     * @function tresorUsersListJoin
     * @param {Array} list
     * @returns {string}
     */
    function tresorUsersListJoin(list) {
        var temp = [],
            i;
        for (i in list) {
            temp.push($.username.resolve(list[i].username));
        }
        return temp.join(', ');
    };

    /**
     * @function calculateResult
     */
    function calculateResult() {
        var i;
        for (i in currentTresorraub.users) {
            if ($.randRange(1, 100) > 50) {
                currentTresorraub.survivors.push(currentTresorraub.users[i]);
            } else {
                currentTresorraub.caught.push(currentTresorraub.users[i]);
            }
        }
    };

    /**
     * @function rueckerstattung
     * @param {Array} userslist
     */
    function rueckerstattung(userslist) {
        for (i in userslist) {
            $.inidb.incr('points', userslist[i].username, costs);
        }
    };

    /**
     * @function replaceTags
     * @param {string} line
     * @returns {string}
     */
    function replaceTags(line) {
        if (line.indexOf('(caught)') > -1) {
            if (currentTresorraub.caught.length > 0) {
                return line.replace('(caught)', tresorUsersListJoin(currentTresorraub.caught));
            } else {
                return '';
            }
        }
        if (line.indexOf('(survivors)') > -1) {
            if (currentTresorraub.survivors.length > 0) {
                return line.replace('(survivors)', tresorUsersListJoin(currentTresorraub.survivors));
            } else {
                return '';
            }
        }
        return line
    };

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
            message = $.replace(message, '(safeamount)', $.getPointsString($.getIniDbNumber('polizei', 'tresor')));
        }
        $.discord.say(discordChannel, message);
    }

    /**
     * @function startHeist
     * @param {string} username
     */
    function startHeist(username) {
        currentTresorraub.gameState = 1;

        var t = setTimeout(function() {
            if (currentTresorraub.users.length >= minPlayer) {
                runStory();
            } else {
                // Mindestanzahl Spieler nicht erreicht
                rueckerstattung(currentTresorraub.users);
                $.say($.lang.get('tresorsystem.start.notenough', minPlayer, currentTresorraub.users.length));
                clearCurrentAdventure();
            }
        }, joinTime * 1e3);

        if (discordAnnounce) {
            announceDiscord(username)
        }
        $.say($.lang.get('tresorsystem.start.success', $.resolveRank(username), $.pointNameMultiple, minPlayer, $.getPointsString(costs)));
    };

    /**
     * @function joinHeist
     * @param {string} username
     * @param {Number} bet
     * @returns {boolean}
     */
    function joinHeist(username) {
        if (stories.length < 1) {
            $.log.error('Keine Tresorraub-Geschichte gefunden; Start nicht möglich!');
            return;
        }

        if (currentTresorraub.gameState > 1) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('tresorsystem.join.notpossible'));
            return;
        }

        if (checkUserAlreadyJoined(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('tresorsystem.alreadyjoined'));
            return;
        }

        if (costs > $.getUserPoints(username)) {
            if (!warningMessage) return;
            $.say($.whisperPrefix(username) + $.lang.get('tresorsystem.join.needpoints', $.getPointsString($.getUserPoints(username)), $.getPointsString(costs)));
            return;
        }
        
        if (currentTresorraub.gameState == 0) {
            startHeist(username);
        } else {
            if (enterMessage) {
                $.say($.whisperPrefix(username) + $.lang.get('tresorsystem.join.success', $.getPointsString(costs)));
            }
        }

        currentTresorraub.users.push({
            username: username,
            costs: parseInt(costs),
        });

        $.inidb.decr('points', username, costs);
        return true;
    };

    /**
     * @function runStory
     */
    function runStory() {
        var progress = 0,
            temp = [],
            story,
            line,
            t;

        currentTresorraub.gameState = 2;
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

        $.say($.lang.get('tresorsystem.runstory', story.title, currentTresorraub.users.length));

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
    };

    /**
     * @function endHeist
     */
    function endHeist() {
        var i, pay = 0, gesamtgewinn = 0, username, maxlength = 0;
        var temp = [];
        
        // Wenn es Überlebende gibt
        if (currentTresorraub.survivors.length > 0) {
            gesamtgewinn = getGesamtgewinn();
            pay = Math.floor(gesamtgewinn / currentTresorraub.survivors.length);

            for (i in currentTresorraub.survivors) {
                $.inidb.decr('polizei', 'tresor', pay);
                $.inidb.incr('tresorraubPayoutsTEMP', currentTresorraub.survivors[i].username, pay);
                $.inidb.incr('points', currentTresorraub.survivors[i].username, currentTresorraub.survivors[i].costs + pay);
            }

            for (i in currentTresorraub.survivors) {
                username = currentTresorraub.survivors[i].username;
                maxlength += username.length();
                temp.push($.username.resolve(username) + ' (+' + $.getPointsString($.inidb.get('tresorraubPayoutsTEMP', currentTresorraub.survivors[i].username)) + ')');
            }
        }
        if (gesamtgewinn > 0) {
            $.say($.lang.get('tresorsystem.pointsummary', $.getPointsString(gesamtgewinn)));
        }
        if (temp.length == 0) {
            $.say($.lang.get('tresorsystem.completed.no.win'));
        } else if (((maxlength + 14) + $.channelName.length) > 512) {
            $.say($.lang.get('tresorsystem.completed.win.total', currentTresorraub.survivors.length, currentTresorraub.caught.length)); //in case too many people enter.
        } else {
            $.say($.lang.get('tresorsystem.completed', temp.join(', ')));
        }
        setSperrzeit();
        clearCurrentAdventure();
        temp = "";
    };

    /**
     * @function clearCurrentAdventure
     */
    function clearCurrentAdventure() {
        currentTresorraub = {
            gameState: 0,
            users: [],
            survivors: [],
            caught: [],
        }
        $.inidb.RemoveFile('tresorraubPayoutsTEMP');
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        if (command.equalsIgnoreCase('tresor')) {
            var tresor = $.getIniDbNumber('polizei', 'tresor');
            $.say($.lang.get('tresorsystem.tresor', $.getPointsString(tresor)));
        }

        if (command.equalsIgnoreCase('tresorraub')) {
            if (onlineOnly && !$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('tresorsystem.onlineonly'));
                return;
            }
            // Prüfe Sperrung
            if (isGesperrt()) {
                $.say($.whisperPrefix(sender) + $.lang.get('tresorsystem.gesperrt', getSperrRest()));
                if (isErhoehungOk() && $.randRange(1, 100) < 31) {
                    var t = setTimeout(function() {
                        erhoeheSperrzeit();
                        $.say($.whisperPrefix(sender) + $.lang.get('tresorsystem.erwischt', sperrErhoehung, getSperrRest()));
                    }, 2e3);
                }
                return;
            }

            if ($.getIniDbNumber('polizei', 'tresor') < 10) {
                $.say($.whisperPrefix(sender) + $.lang.get('tresorsystem.leer'));
                return;
            }
            if (currentTresorraub.gameState == 0 && (typeof action === 'undefined' || !action.equalsIgnoreCase('start'))) {
                $.say($.whisperPrefix(sender) + $.lang.get('tresorsystem.adventure.usage', $.getPointsString(costs)));
                return;
            }
            joinHeist(sender);
            return;
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./games/tresorSystem.js', 'tresorraub', 7);
        $.registerChatCommand('./games/tresorSystem.js', 'tresor', 7);
        loadStories();
        if (randActive) {
            givePointsInterval();
        }
    });

    $.reloadTresor = reloadTresor;
})();
