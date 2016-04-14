/*global define*/
/*jslint white:true,browser:true*/
define([
    './utils',
    './genomeComparison/kbaseGenomeComparison'
], function (utils, Widget) {
    'use strict';
    
    function factory(config) {
        var container = config.node, 
            widget = Widget.make(config);
        
        function start(objectRefs) {
            //console.log('HEREEEEE');
            //console.log('INPUTX', config, data);
            //var input = config.input || data.input;
            //widget.start(container, input);
            // var input = config.objectRefs || objectRefs;
            return widget.start(container, objectRefs);
        }
        
        config.runtime.on('start', function (data) {
            utils.showLoading(container, 'Loading data...');
            start(data.objectRefs)
                .catch(function (err) {
                    var message;
                    if (err.message) {
                        message = err.message;
                    } else if (err.error) {
                        if (err.error.message) {
                            message = err.error.message;
                        } else if (err.error.error) {
                            message = err.error.error;
                        } else {
                            message = 'Unknown service error';
                        }
                    } else {
                        message = 'Unknown error';
                    }
                    
                    config.runtime.send('error', {
                        message: message
                    });
                });
        });
        
        
        config.runtime.send('ready');
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };    
});