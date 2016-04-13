/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'utils'
], function (Promise, utils) {
    'use strict';
    function factory(config) {
        var container = config.node;

        function start(params) {
            // A request is a send/on pair, in which the "on" handler only 
            // dispatches if it receives a message with the same message name and id.
//            runtime.config('services.workspace.url')
//                .then(function (value) {
//                    container.innerHTML = 'Got workspace url: ' + value;
//                });

//            runtime.request('config', {
//                property: 'services.workspace.url'
//            })
//                .then(function (data) {
//                    container.innerHTML = 'Got workspace url: ' + data.value;
//                });

            config.runtime.requests([
                ['config', {property: 'services.workspace.url'}],
                ['config', {property: 'services.user_profile.urlx', defaultValue: 'huh?'}]
            ])
                .spread(function (config1, config2) {
                    container.innerHTML = 'Got configs: ' + config1.value + ', ' + config2.value;
                })
                .catch(function (err) {
                    console.error(err);
                });
        }
        
        // After we have reported that we are ready, at some point the host
        // may ask us to start. Then we go.
        config.runtime.on('start', function (data) {
            start(data.params);
            container.innerHTML = 'The new way!';
        });

        // Tell the host that we are ready to roll.
        config.runtime.send('ready');
    }
    return {
        make: function (config) {
            return factory(config);
        }
    };
});