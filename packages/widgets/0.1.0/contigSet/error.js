/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb_common/html'
], function (html) {
    'use strict';
    
    function factory(config) {
        var root, container, runtime = config.runtime;
        
        function setup(node) {
            root = node;
            container = root.appendChild(document.createElement('div'));
        }
        
        function start() {
            
        }
        
        function update(incoming) {
            var message = incoming.message;
            
            if (incoming.error) {
                message += '<hr>' + incoming.error.message;
            }
            
            container.innerHTML = html.makePanel({
                title: incoming.title,
                content: message
            });
        }
        
        function stop() {
            
        }
        
        function teardown() {
            if (container) {
                root.removeChild(container);
            }
        }
        
        return {
            setup: setup,
            start: start,
            update: update,
            stop: stop,
            teardown: teardown
        };
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});