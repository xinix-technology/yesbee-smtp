/**
 * yesbee-smtp components/smtp
 *
 * MIT LICENSE
 *
 * Copyright (c) 2014 PT Sagara Xinix Solusitama - Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @author     Ganesha <reekoheek@gmail.com>
 * @copyright  2014 PT Sagara Xinix Solusitama
 */
var simplesmtp = require('simplesmtp'),
    url = require('url'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    Q = require('q');

module.exports = function(yesbee) {
    "use strict";

    var logger = yesbee.logger;

    return {
        start: function() {
            if (this.type === 'source') {
                throw new Error('Cannot start smtp source component');
            }

            var parsed = url.parse(this.uri);

            this.host = parsed.hostname || 'localhost';
            this.port = parsed.port || 25;

            // create email transporter
            this.transporter = nodemailer.createTransport(smtpTransport({
                host: this.host,
                port: this.port,
                ignoreTLS: this.options.ignoreTLS || false
            }));

            this.constructor.prototype.start.apply(this, arguments);
        },
        process: function(exchange) {
            var defer = Q.defer();

            if (!exchange.headers['smtp::from']) {
                throw new Error('[SMTP] Invalid from!');
            }

            if (!exchange.headers['smtp::to']) {
                throw new Error('[SMTP] Invalid to!');
            }

            if (!exchange.headers['smtp::subject']) {
                throw new Error('[SMTP] Invalid subject!');
            }

            var data = {
                from: exchange.headers['smtp::from'],
                to: exchange.headers['smtp::to'],
                subject: exchange.headers['smtp::subject']
            };

            switch (exchange.headers['smtp::content-type']) {
                case 'text/html':
                    data.html = exchange.body;
                    break;
                default:
                    data.text = exchange.body;
            }

            // send mail
            if (this.options.mock) {
                for(var i in data) {
                    if (typeof data[i] === 'function') {
                        data[i] = '[f Function]';
                    } else if (typeof data[i] === 'object') {
                        data[i] = '[object Object]';
                    }
                }
                logger.i(this, 'Sending', data);

                defer.resolve();
            } else {
                this.transporter.sendMail(data, function(error, info){
                    if(error){
                        defer.reject(error);
                    }else{
                        defer.resolve();
                    }
                });
            }

            return defer.promise;
        },
    };
};