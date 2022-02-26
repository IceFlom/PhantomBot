/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * killCommand.js
 *
 * Viewers can show each other the love of REAL friends by expressing it in pain.
 */
(function() {
    const killType = {
        SELF: 'self',
        ATTACKER: 'attacker',
        INJURED: 'injured',
        VICTIM: 'victim'
    }
    var selfMessageCount = 0,
        attackerMessageCount = 0,
        injuredMessageCount = 0,
        victimMessageCount = 0,
        lastSelfRand = -1,
        lastAttackerRand = -1,
        lastInjuredRand = -1,
        lastVictimRand = -1,
        killTimeout = $.getSetIniDbNumber('killSettings', 'killTimeoutTime', 60),
        jailTimeout = $.getSetIniDbNumber('killSettings', 'jailTimeoutTime', 120),
        minCostInjured = $.getSetIniDbNumber('killSettings', 'minCostInjured', 1),
        maxCostInjured = $.getSetIniDbNumber('killSettings', 'maxCostInjured', 49),
        minCostKill = $.getSetIniDbNumber('killSettings', 'minCostKill', 50),
        maxCostKill = $.getSetIniDbNumber('killSettings', 'maxCostKill', 100),
        timeoutEnabled = $.getSetIniDbBoolean('killSettings', 'timeoutenabled', true),
        rand,
        currentlyDeadList = new java.util.concurrent.CopyOnWriteArrayList();

    /**
     * @function reloadKill
     */
    function reloadKill() {
        killTimeout = $.getIniDbNumber('killSettings', 'killTimeoutTime');
        jailTimeout = $.getIniDbNumber('killSettings', 'jailTimeoutTime');
        minCostInjured = $.getIniDbNumber('killSettings', 'minCostInjured');
        maxCostInjured = $.getIniDbNumber('killSettings', 'maxCostInjured');
        minCostKill = $.getIniDbNumber('killSettings', 'minCostKill');
        maxCostKill = $.getIniDbNumber('killSettings', 'maxCostKill');
        timeoutEnabled = $.getSetIniDbBoolean('killSettings', 'timeoutenabled');
    }

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;
        for (i = 1; $.lang.exists('killcommand.self.' + i); i++) {
            selfMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.attacker.' + i); i++) {
            attackerMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.injured.' + i); i++) {
            injuredMessageCount++;
        }
        for (i = 1; $.lang.exists('killcommand.victim.' + i); i++) {
            victimMessageCount++;
        }
        $.consoleDebug($.lang.get('killcommand.console.loaded', selfMessageCount, attackerMessageCount, injuredMessageCount, victimMessageCount));
    }

    /**
     * @function toggleTimeoutEnabled
     */
    function toggleTimeoutEnabled() {
        timeoutEnabled = !timeoutEnabled;
        $.setIniDbBoolean('killsettings', 'timeoutenabled', timeoutEnabled);
    }

    /**
     * @function setKilltimeout
     * @param {int} seconds
     */
    function setKilltimeout(seconds) {
        killTimeout = seconds;
        $.setIniDbNumber('killsettings', 'killTimeoutTime', killTimeout);
    }

    /**
     * @function setJailtimeout
     * @param {int} seconds
     */
    function setJailtimeout(seconds) {
        jailTimeout = seconds;
        $.setIniDbNumber('killsettings', 'jailTimeoutTime', jailTimeout);
    }

    /**
     * @function setMinCostKill
     * @param {int} cost
     */
    function setMinCostKill(cost) {
        minCostKill = cost;
        $.setIniDbNumber('killsettings', 'minCostKill', minCostKill);
    }

    /**
     * @function setMaxCostKill
     * @param {int} cost
     */
    function setMaxCostKill(cost) {
        maxCostKill = cost;
        $.setIniDbNumber('killsettings', 'maxCostKill', maxCostKill);
    }

    /**
     * @function setMinCostInjured
     * @param {int} cost
     */
    function setMinCostInjured(cost) {
        minCostInjured = cost;
        $.setIniDbNumber('killsettings', 'minCostInjured', minCostInjured);
    }

    /**
     * @function setMaxCostInjured
     * @param {int} cost
     */
    function setMaxCostInjured(cost) {
        maxCostInjured = cost;
        $.setIniDbNumber('killsettings', 'maxCostInjured', maxCostInjured);
    }

    /**
     * @function getKillResult
     * @return {killType}
     */
    function getKillResult() {
        var randomNumber = $.randRange(1, 100);
        if (randomNumber > 0 && randomNumber <= 40) {
            return killType.ATTACKER;
        } else if (randomNumber > 40 && randomNumber <= 60) {
            return killType.INJURED;
        } else {
            return killType.VICTIM;
        }
    }

    /**
     * @function selfKill
     * @param {string} sender
     */
    function selfKill(sender) {
        do {
            rand = $.randRange(1, selfMessageCount);
        } while (rand === lastSelfRand);
        $.say($.lang.get('killcommand.self.' + rand, $.username.resolve(sender)));
        if (!$.isMod(sender) && killTimeout > 0) {
            doTimeout(sender, killTimeout);
        }
        lastSelfRand = rand;
    }

    /**
     * @function checkTimeout
     * @param {string} sender
     * @param {string} target
     * @returns {boolean}
     */
    function checkTimeout(sender, target) {
        return !$.isMod(sender) && !$.isMod(target) && killTimeout > 0;
    }

    /**
     * @function doTimeout
     * @param {string} user
     * @param {int} timeout
     */
    function doTimeout(user, timeout) {
        if (timeoutEnabled) {
            // enable timeout
            setTimeout(function() {
                currentlyDeadList.add(user.toLowerCase());
                $.say($.lang.get('killcommand.muteinfo', $.username.resolve(user), timeout));
            }, 2000);

            // disable timeout
            setTimeout(function() {
                currentlyDeadList.remove(user.toLowerCase());
                $.say($.lang.get('killcommand.respawned', $.username.resolve(user)));
            }, timeout * 1000);
        }
    }

    /**
     * @function doPenalty
     * @param {string} user
     * @param {int} penalty
     */
    function doPenalty(user, penalty) {
        var userPoints = $.getUserPoints(user),
            lang;
        // attacker does not have enough points for the penalty
        if (userPoints < penalty) {
            $.setIniDbNumber('points', user.toLowerCase(), 0);
            if (!$.isMod(user)) {
                doTimeout(user, jailTimeout);
                lang = $.lang.get('killcommand.nopoints.jail', $.username.resolve(user), $.getPointsString(penalty), jailTimeout);
            } else {
                lang = $.lang.get('killcommand.nopoints.jailmod', $.username.resolve(user), $.getPointsString(penalty));
            }
        } else {
            $.inidb.decr('points', user.toLowerCase(), penalty);
            lang = $.lang.get('killcommand.penalty', $.username.resolve(user), $.getPointsString(penalty));
        }
        setTimeout(function() {
            $.say(lang);
        }, 1000);
    }

    /**
     * @function processAttacker
     * @param {string} sender
     * @param {string} target
     */
    function processAttacker(sender, target) {
        var tries = 0;
        do {
            tries++;
            rand = $.randRange(1, attackerMessageCount);
        } while (rand === lastAttackerRand && tries < 5);
        $.say($.lang.get('killcommand.attacker.' + rand, $.username.resolve(sender), $.username.resolve(target)));
        // Keine Zahlung
        if (checkTimeout(sender, target)) {
            doTimeout(sender, killTimeout);
        }
        lastAttackerRand = rand;
    }

    /**
     * @function processInjured
     * @param {string} sender
     * @param {string} target
     */
    function processInjured(sender, target) {
        var tries = 0,
            penalty = $.randRange(minCostInjured, maxCostInjured);
        do {
            tries++;
            rand = $.randRange(1, injuredMessageCount);
        } while (rand === lastInjuredRand && tries < 5);
        $.say($.lang.get('killcommand.injured.' + rand, $.username.resolve(sender), $.username.resolve(target)));
        doPenalty(sender, penalty);
        // sender has to pay
        lastInjuredRand = rand;
    }

    /**
     * @function processVictim
     * @param {string} sender
     * @param {string} target
     */
    function processVictim(sender, target) {
        var tries = 0,
            penalty = $.randRange(minCostKill, maxCostKill);
        do {
            tries++;
            rand = $.randRange(1, victimMessageCount);
        } while (rand === lastVictimRand && tries < 5);
        $.say($.lang.get('killcommand.victim.' + rand, $.username.resolve(sender), $.username.resolve(target)));
        doPenalty(sender, penalty);
        if (checkTimeout(sender, target)) {
            doTimeout(target, killTimeout);
        }
        lastVictimRand = rand;
    }

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        // channel not online?
        if (!$.isOnline($.channelName)) {
            return;
        }
        if (!timeoutEnabled) {
            return;
        }

        // check message
        var username = event.getSender().toLowerCase(),
            tags = event.getTags();

        if (currentlyDeadList.contains(username)) {
            // delete message
            Packages.tv.phantombot.PhantomBot.instance().getSession().sayNow('.delete ' + tags.get('id'));
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

        /**
         * @commandpath kill [username] - Kill a fellow viewer (not for real!), omit the username to kill yourself
         */
        if (command.equalsIgnoreCase('kill')) {
            var target;

            if (subcommand != null) {
                target = subcommand.toLowerCase().replace("@", "");
            } else {
                target = "";
            }

            // given user does not exist
            if (!$.userExists(target)) {
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.nouser', $.username.resolve(target)));
                return;
            }
            // user is already dead
            if (currentlyDeadList.contains(target)) {
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.alreadydead', $.username.resolve(target)));
                return;
            }
            // sender == target
            if (target.equalsIgnoreCase(sender)) {
                selfKill(sender);
                return;
            }

            // not enough points
            if ($.getUserPoints(sender) < 10) {
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.nopoints'));
                return;
            }

            // process kill
            var typeOfKill = getKillResult();
            switch (typeOfKill) {
                case killType.ATTACKER:
                    processAttacker(sender, target);
                    break;
                case killType.INJURED:
                    processInjured(sender, target);
                    break;
                case killType.VICTIM:
                    processVictim(sender, target);
                    break;
            }
        }

        /**
         * @commandpath killset [subcommand] [value] - Change kill settings
         */
        if (command.equalsIgnoreCase('killset')) {
            if (subcommand == null) {
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.usage'));
                return;
            }
            if (subcommand.equalsIgnoreCase("toggletimeout")) {
                toggleTimeoutEnabled();
                $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.updated', 'timeoutenabled', timeoutEnabled));
                return;
            }

            var value = args[1];
            if (subcommand.equalsIgnoreCase("killtimeout")) {
                if (!isNaN(value)) {
                    setKilltimeout(value);
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.updated', 'killtimeout', killTimeout));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.nonumber', 'killtimeout', killTimeout));
                }
                return;
            }
            if (subcommand.equalsIgnoreCase("jailtimeout")) {
                if (!isNaN(value)) {
                    setJailtimeout(value);
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.updated', 'jailtimeout', jailTimeout));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.nonumber', 'jailtimeout', jailTimeout));
                }
                return;
            }
            if (subcommand.equalsIgnoreCase("mincostkill")) {
                if (!isNaN(value)) {
                    setMinCostKill(value);
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.updated', 'mincostkill', $.getPointsString(minCostKill)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.nonumber', 'mincostkill', $.getPointsString(minCostKill)));
                }
                return;
            }
            if (subcommand.equalsIgnoreCase("maxcostkill")) {
                if (!isNaN(value)) {
                    setMaxCostKill(value);
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.updated', 'maxcostkill', $.getPointsString(maxCostKill)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.nonumber', 'maxcostkill', $.getPointsString(maxCostKill)));
                }
                return;
            }
            if (subcommand.equalsIgnoreCase("mincostinjured")) {
                if (!isNaN(value)) {
                    setMinCostInjured(value);
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.updated', 'mincostinjured', $.getPointsString(minCostInjured)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.nonumber', 'mincostinjured', $.getPointsString(minCostInjured)));
                }
                return;
            }
            if (subcommand.equalsIgnoreCase("maxcostinjured")) {
                if (!isNaN(value)) {
                    setMaxCostInjured(value);
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.updated', 'maxcostinjured', $.getPointsString(maxCostInjured)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.nonumber', 'maxcostinjured', $.getPointsString(maxCostInjured)));
                }
                return;
            }
            $.say($.whisperPrefix(sender) + $.lang.get('killcommand.set.usage'));
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if (selfMessageCount === 0 && attackerMessageCount === 0 && injuredMessageCount === 0 && victimMessageCount === 0) {
            loadResponses();
        }
        $.registerChatCommand('./games/killCommand.js', 'kill', 7);
        $.registerChatCommand('./games/killCommand.js', 'killset', 1);
        $.registerChatSubcommand('killset', 'toggletimeout', 1);
        $.registerChatSubcommand('killset', 'killtimeout', 1);
        $.registerChatSubcommand('killset', 'jailtimeout', 1);
        $.registerChatSubcommand('killset', 'mincostkill', 1);
        $.registerChatSubcommand('killset', 'maxcostkill', 1);
        $.registerChatSubcommand('killset', 'mincostinjured', 1);
        $.registerChatSubcommand('killset', 'maxcostinjured', 1);
    });

    $.reloadKill = reloadKill;
})();
