/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
package tv.phantombot.twitch.pubsub.processors;

import org.json.JSONObject;

import tv.phantombot.PhantomBot;
import tv.phantombot.cache.TwitchCache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.pubsub.videoplayback.PubSubStreamDownEvent;
import tv.phantombot.event.pubsub.videoplayback.PubSubStreamUpEvent;
import tv.phantombot.event.pubsub.videoplayback.PubSubViewCountEvent;

/**
 * A processor for stream up/down/viewer events from PubSub
 *
 * @author gmt2001
 * @deprecated Stream up/down is now handeled by EventSub. Viewer counts are updated reasonably frequently by Helix
 */
@Deprecated(since = "3.8.0.0", forRemoval = true)
public class PubSubStreamUpDownProcessor extends AbstractPubSubProcessor {

    private final int channelId;
    private final boolean isCaster;

    public PubSubStreamUpDownProcessor() {
        this(PhantomBot.instance().getPubSub().channelId());
    }

    public PubSubStreamUpDownProcessor(int channelId) {
        super("video-playback-by-id." + channelId);
        this.channelId = channelId;
        this.isCaster = this.channelId == PhantomBot.instance().getPubSub().channelId();
    }

    @Override
    protected void onOpen() {
        super.onOpen();
        com.gmt2001.Console.out.println("Requesting Twitch Stream " + (this.isCaster ? "View Count" : "Up/Down") + " Data Feed for " + this.channelId);
    }

    @Override
    protected void onSubscribeSuccess() {
        com.gmt2001.Console.out.println("Connected to Twitch Stream " + (this.isCaster ? "View Count" : "Up/Down") + " Data Feed for " + this.channelId);
    }

    @Override
    protected void onSubscribeFailure(String error) {
        com.gmt2001.Console.out.println("PubSub Rejected Twitch Stream " + (this.isCaster ? "View Count" : "Up/Down") + " Data Feed for " + this.channelId + " with Error: " + error);
    }

    @Override
    protected void onEvent(JSONObject body) {
        float srvtime = body.optFloat("server_time");
        switch (body.getString("type")) {
            case "stream-up":
                EventBus.instance().postAsync(new PubSubStreamUpEvent(this.channelId, srvtime, body.getInt("play_delay")));
                break;
            case "stream-down":
                EventBus.instance().postAsync(new PubSubStreamDownEvent(this.channelId, srvtime));
                break;
            case "viewcount":
                if (this.isCaster) {
                    TwitchCache.instance().updateViewerCount(body.getInt("viewers"));
                }
                EventBus.instance().postAsync(new PubSubViewCountEvent(this.channelId, srvtime, body.getInt("viewers")));
                break;
        }
    }
}
