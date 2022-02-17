/*
 * by IceFlom
 */

(function() {
    var payout = $.getSetIniDbNumber('discordDailyCommandSettings', 'payout', 100),
        intervalHours = $.getSetIniDbNumber('discordDailyCommandSettings', 'intervalhours', 24);

    function reloadDailyCommand() {
        payout = $.getIniDbNumber('discordDailyCommandSettings', 'payout');
        intervalHours = $.getIniDbNumber('discordDailyCommandSettings', 'intervalhours');
    }

    /**
     * Updates the payout setting
     */
    function updatePayout(payoutparam) {
        payout = payoutparam
        $.setIniDbBoolean('discordDailyCommandSettings', 'payout', payout);
    }

    /**
     * Updates the interval in hours setting
     */
    function updateIntervalHours(intervalparam) {
        intervalHours = intervalparam
        $.setIniDbBoolean('discordDailyCommandSettings', 'intervalhours', interval);
    }

    /**
     * @event command
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            subcommand = args[0];

        if (command.equalsIgnoreCase('daily')) {
            var twitchName = $.discord.resolveTwitchName(event.getSenderId());
            // no twitch name linked
            if (twitchName == null) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
                return;
            }
            twitchName = twitchName.toLowerCase();

            // subcommand processing
            if (subcommand !== 'undefined') {
                if (subcommand.equalsIgnoreCase("setpayout")) {
                    var payoutvalue = args[1];
                    if (!isNaN(payoutvalue)) {
                        updatePayout(payoutvalue);
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.payout.updated', $.getPointsString(payout)));
                    } else {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.payout.current', $.getPointsString(payout)));
                    }
                    return;
                } else if (subcommand.equalsIgnoreCase("setinterval")) {
                    var intervalvalue = args[1];
                    if (!isNaN(intervalvalue)) {
                        updateIntervalHours(intervalvalue);
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.interval.updated', intervalHours));
                    } else {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.interval.current', intervalHours));
                    }
                    return;
                } else if (subcommand.equalsIgnoreCase("help")) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.help'));
                    return;
                }
            }

            // no subcommand given
            var userTimestamp = $.getSetIniDbNumber('discordDailyCommandUsers', twitchName, 0),
                currentTime = new Date().getTime(),
                timeGone = currentTime - userTimestamp,
                hoursSinceLast = Math.trunc(timeGone / 1000 / 60 / 60);
            if (hoursSinceLast >= 24) {
                $.setIniDbNumber('discordDailyCommandUsers', twitchName, currentTime);
                $.inidb.incr('points', twitchName, payout);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.success', $.getPointsString(payout)));
            } else {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.daily.wait', $.getFormattedTime(timeGone), intervalHours));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/ice/dailyCommand.js', 'daily', 0);
        $.discord.registerSubCommand('daily', 'setpayout', 1);
        $.discord.registerSubCommand('daily', 'setinterval', 1);
        $.discord.registerSubCommand('daily', 'help', 1);
    });
    $.reloadDailyCommand = reloadDailyCommand;
})();
