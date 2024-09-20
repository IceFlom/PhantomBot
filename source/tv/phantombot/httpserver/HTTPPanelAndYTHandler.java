/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
package tv.phantombot.httpserver;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;

import com.gmt2001.PathValidator;
import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpBasicAuthenticationHandler;
import com.gmt2001.util.Reflect;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import tv.phantombot.CaselessProperties;

/**
 *
 * @author gmt2001
 */
public class HTTPPanelAndYTHandler implements HttpRequestHandler {

    private HttpAuthenticationHandler authHandler;

    public HTTPPanelAndYTHandler() {
        this.authHandler = new HttpBasicAuthenticationHandler("PhantomBot Web Panel", CaselessProperties.instance().getProperty("paneluser", "panel"),
                CaselessProperties.instance().getProperty("panelpassword", "panel"), "/panel/login/", true);
    }

    @Override
    public HttpRequestHandler registerHttp() {
        HttpServerPageHandler.registerHttpHandler("/panel", this);
        HttpServerPageHandler.registerHttpHandler("/ytplayer", this);
        return this;
    }

    public void updateAuth() {
        this.authHandler = new HttpBasicAuthenticationHandler("PhantomBot Web Panel", CaselessProperties.instance().getProperty("paneluser", "panel"),
                CaselessProperties.instance().getProperty("panelpassword", "panel"), "/panel/login/", true);
    }

    @Override
    public HttpAuthenticationHandler getHttpAuthHandler() {
        return authHandler;
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        if (!req.method().equals(HttpMethod.GET) && !req.uri().startsWith("/oauth")) {
            com.gmt2001.Console.debug.println("405 " + req.method().asciiName() + ": " + qsd.path());
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.METHOD_NOT_ALLOWED));
            return;
        }

        if (req.uri().startsWith("/panel/checklogin")) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.preparePreflightResponse(req,
                    List.of(HttpMethod.GET, req.method()),
                    List.of(HttpHeaderNames.AUTHORIZATION.toString(), HttpHeaderNames.CONTENT_TYPE.toString()),
                    Duration.ofMinutes(15)));
            return;
        }

        if (req.method().equals(HttpMethod.OPTIONS)) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.preparePreflightResponse(req,
                    List.of(HttpMethod.GET),
                    List.of(HttpHeaderNames.AUTHORIZATION.toString(), HttpHeaderNames.CONTENT_TYPE.toString()),
                    Duration.ofMinutes(15)));
            return;
        }

        try {
            String path = qsd.path();

            Path p = Paths.get("./web/", path);

            if (path.endsWith("/") || Files.isDirectory(p)) {
                path = path + "/index.html";
                p = Paths.get("./web/", path);
            }

            if (!PathValidator.isValidPathWebAuth(p.toString()) || !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web"))) {
                com.gmt2001.Console.debug.println("403 " + req.method().asciiName() + ": " + p.toString());
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN));
                return;
            }

            if (HttpServerPageHandler.checkFilePermissions(ctx, req, p, false)) {
                com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + p.toString() + " (" + p.getFileName().toString() + " = "
                        + HttpServerPageHandler.detectContentType(p.getFileName().toString()) + ")");
                byte[] data = Files.readAllBytes(p);
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, data, p.getFileName().toString()));
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500 " + req.method().asciiName() + ": " + qsd.path());
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }

}
