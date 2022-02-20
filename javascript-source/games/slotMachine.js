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
 * slotMachine.js
 *
 * When the user uses the slots, the bot will generate three random numbers.
 * These numbers represent an emote. Each emote has a value.
 * The amount of points; corresponding to the output, will be added to the user's balance.
 */
(function() {
    var prizes = [],
        emoteList = [],
        cost = $.getSetIniDbNumber('slotmachine', 'cost', 15),
        onlineOnly = $.getSetIniDbBoolean('slotmachine', 'onlineonly', true);

    /* Set default prizes and emotes in the DB for the Panel */
    $.getSetIniDbNumber('slotmachine', 'prizes_0', 75);
    $.getSetIniDbNumber('slotmachine', 'prizes_1', 150);
    $.getSetIniDbNumber('slotmachine', 'prizes_2', 300);
    $.getSetIniDbNumber('slotmachine', 'prizes_3', 450);
    $.getSetIniDbNumber('slotmachine', 'prizes_4', 1000);
    $.getSetIniDbString('slotmachineemotes', 'emote_0', 'Kappa');
    $.getSetIniDbString('slotmachineemotes', 'emote_1', 'KappaPride');
    $.getSetIniDbString('slotmachineemotes', 'emote_2', 'BloodTrail');
    $.getSetIniDbString('slotmachineemotes', 'emote_3', 'ResidentSleeper');
    $.getSetIniDbString('slotmachineemotes', 'emote_4', '4Head');

    /**
     * @function loadEmotes
     */
    function loadEmotes() {
        emoteList[0] = $.getIniDbString('slotmachineemotes', 'emote_0');
        emoteList[1] = $.getIniDbString('slotmachineemotes', 'emote_1');
        emoteList[2] = $.getIniDbString('slotmachineemotes', 'emote_2');
        emoteList[3] = $.getIniDbString('slotmachineemotes', 'emote_3');
        emoteList[4] = $.getIniDbString('slotmachineemotes', 'emote_4');
    }

    /**
     * @function loadPrizes
     */
    function loadPrizes() {
        prizes[0] = $.getIniDbNumber('slotmachine', 'prizes_0');
        prizes[1] = $.getIniDbNumber('slotmachine', 'prizes_1');
        prizes[2] = $.getIniDbNumber('slotmachine', 'prizes_2');
        prizes[3] = $.getIniDbNumber('slotmachine', 'prizes_3');
        prizes[4] = $.getIniDbNumber('slotmachine', 'prizes_4');
    }

    /**
     * @function getEmoteKey
     * @returns {Number}
     */
    function getEmoteKey() {
        var rand = $.randRange(1, 1000);
        loadEmotes();
        if (rand <= 75) {
            return 4;
        }
        if (rand > 75 && rand <= 200) {
            return 3;
        }
        if (rand > 200 && rand <= 450) {
            return 2;
        }
        if (rand > 450 && rand <= 700) {
            return 1;
        }
        if (rand > 700) {
            return 0;
        }
    }

    /**
     * @function toggleOnlineonly
     * @param {string} sender
     */
    function toggleOnlineonly(sender) {
        onlineOnly = !onlineOnly;
        if (onlineOnly) {
            $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.onlineonly.enabled'));
        } else {
            $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.onlineonly.disabled'));
        }
    }

    /**
     * Updates the cost
     * @function updateCost
     * @param {int} costvalue
     */
    function updateCost(costvalue) {
        cost = costvalue
        $.setIniDbBoolean('slotmachine', 'cost', cost);
    }

    /**
     * @function calculateResult
     * @param {string} sender
     */
    function calculateResult(sender) {
        var e1 = getEmoteKey(),
            e2 = getEmoteKey(),
            e3 = getEmoteKey(),
            wonPoints = 0;

        loadPrizes();

        if (e1 == e2 && e2 == e3) {
            wonPoints = prizes[e1];
            $.inidb.incr('points', sender, wonPoints);
            $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.result', cost, emoteList[e1], emoteList[e2], emoteList[e3], wonPoints));
            return;
        }

        if (e1 == e2 || e2 == e3 || e3 == e1) {
            if (e1 == e2) {
                wonPoints = Math.floor(prizes[e1] * 0.3);
            } else {
                wonPoints = Math.floor(prizes[e3] * 0.3);
            }
            $.inidb.incr('points', sender, wonPoints);
            $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.result', cost, emoteList[e1], emoteList[e2], emoteList[e3], wonPoints));
            return;
        }
        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.result', cost, emoteList[e1], emoteList[e2], emoteList[e3], wonPoints));
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var command = (event.getCommand() + '').toLowerCase(),
            sender = event.getSender().toLowerCase(),
            args = event.getArgs();

        /**
         * @commandpath slot - Play the slot machines for some points
         */
        if (command.equalsIgnoreCase('slot')) {
            /**
             * @commandpath slot rewards [val1] [val2] [val3] [val4] [val5] - Set the reward values for the slots.
             */
            if (args[0] !== undefined) {
                if (args[0].equalsIgnoreCase('rewards')) {
                    if (args.length < 6) {
                        loadPrizes();
                        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.rewards.usage', prizes.join(' ')));
                        return;
                    }

                    if (isNaN(args[1]) || isNaN(args[2]) || isNaN(args[3]) || isNaN(args[4]) || isNaN(args[5])) {
                        loadPrizes();
                        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.rewards.usage', prizes.join(' ')));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.rewards.success'));
                    $.inidb.set('slotmachine', 'prizes_0', args[1]);
                    $.inidb.set('slotmachine', 'prizes_1', args[2]);
                    $.inidb.set('slotmachine', 'prizes_2', args[3]);
                    $.inidb.set('slotmachine', 'prizes_3', args[4]);
                    $.inidb.set('slotmachine', 'prizes_4', args[5]);
                    return;
                }

                /**
                 * @commandpath slot emotes [emote1] [emote2] [emote3] [emote4] [emote5] - Set the emotes for the slots.
                 */
                if (args[0].equalsIgnoreCase('emotes')) {
                    if (args.length < 6) {
                        loadEmotes();
                        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.emote.usage', emoteList.join(' ')));
                        return;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.emote.success'));
                    $.inidb.set('slotmachineemotes', 'emote_0', args[1]);
                    $.inidb.set('slotmachineemotes', 'emote_1', args[2]);
                    $.inidb.set('slotmachineemotes', 'emote_2', args[3]);
                    $.inidb.set('slotmachineemotes', 'emote_3', args[4]);
                    $.inidb.set('slotmachineemotes', 'emote_4', args[5]);
                    return;
                }

                /**
                 * @commandpath slot onlineonly - Toggles the onlineonly option.
                 */
                if (args[0].equalsIgnoreCase('onlineonly')) {
                    toggleOnlineonly(sender);
                    return;
                }

                if (args[0].equalsIgnoreCase("cost")) {
                    var costvalue = args[1];
                    if (!isNaN(costvalue)) {
                        updateCost(costvalue);
                        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.cost.updated', $.getPointsString(cost)));
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.cost.current', $.getPointsString(cost)));
                    }
                    return;
                }
            }

            if (onlineOnly && !$.isOnline($.channelName)) {
                $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.onlineonly'));
                return;
            }

            if ($.getUserPoints(sender) < cost) {
                $.say($.whisperPrefix(sender) + $.lang.get('slotmachine.nopoints', $.getPointsString(cost)));
                return;
            }
            $.inidb.decr('points', sender, cost);

            /* Slot machine */
            calculateResult(sender);
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./games/slotMachine.js', 'slot', 7);
        $.registerChatSubcommand('slot', 'rewards', 1);
        $.registerChatSubcommand('slot', 'emotes', 1);
        $.registerChatSubcommand('slot', 'onlineonly', 1);
    });

    $.loadPrizesSlot = loadPrizes;
})();
