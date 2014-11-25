module.exports = function() {
    "use strict";

    this.from('http://0.0.0.0:3000?exchangePattern=inOut')
        .to(function(exchange) {
            exchange.headers['smtp::from'] = 'reekoheek@gmail.com';
            exchange.headers['smtp::to'] = 'reeko_fingers@yahoo.com';
            exchange.headers['smtp::subject'] = 'Hello world';
            exchange.body = new Date() + '';
        })
        .to('smtp://localhost?ignoreTLS=true&mock=true');

    // this.trace = true;

    var template = this.createProducerTemplate();

    setImmediate(function() {
        try {
            var data = 'one ' + new Date();
            template.send('http://0.0.0.0:3000', data).then(function(exchange) {
                console.log('err?', exchange.error);
            });
        } catch(e) {
            console.log(e.stack);
        }
    });
};