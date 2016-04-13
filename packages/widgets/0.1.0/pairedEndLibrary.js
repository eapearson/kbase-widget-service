/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'utils',
    'kb_service/client/workspace',
    'kb_common/html'
], function (Promise, utils, Workspace, html) {
    'use strict';
    function factory(config) {
        var container = config.node;

        // This is convention -- a render method which takes a data object
        // and returns html as a string.
        function render(dataObject) {
            var t = html.tag,
                table = t('table'), tr = t('tr'), th = t('th'), td = t('td');
            
            return table({class: 'table table-striped'}, [
                tr([
                    th('Left reads source file name'),
                    td((dataObject.data.handle_1 && dataObject.data.handle_1.file_name) ||  'n/a')
                ]),
                tr([
                    th('Right reads source file name'),
                    td((dataObject.data.handle_2 && dataObject.data.handle_2.file_name) || 'n/a')
                ]),
                (function () {
                    if (dataObject.data.insert_size_mean !== undefined) {
                        return tr([
                            th('Insert size (mean)'),
                            td(dataObject.data.insert_size_mean || 'n/a')
                        ]);
                    };
                }),
                (function () {
                    if (dataObject.data.insert_size_mean !== undefined) {
                        return tr([
                            th('Insert size (stdev)'),
                            td(dataObject.data.insert_size_std_dev || 'n/a')
                        ]);
                    };
                })
            ]);
        }
        
        function validateInput(input) {
            return Promise.try(function () {
                if (!input) {
                    throw new Error('No params supplied');
                }
                if (!input.objectRef) {
                    throw new Error('The objectRef param is missing');
                }
                return input;
            });
        }
        
        function start(data) {
            // A "request" is a message emitted to the runtime which automatically
            // subscribes to a response, and returns it as a promise. When the
            // reponse is received, the promise is fulfilled and returned.
            // This presents a consistent promise api for message requests.
            // Requests to the runtime can be combined into a single request.
            return validateInput(data.input)
                .then(function (input) {
                    return config.runtime.requests([
                        ['config', {property: 'services.workspace.url'}],
                        ['authToken']
                    ])
                    .spread(function (workspaceUrl, authToken) {
                        var workspace = new Workspace(workspaceUrl.value, {
                            token: authToken.value
                        });
                        return workspace.get_objects([
                            {ref: input.objectRef}
                        ]);
                    })
                    .then(function (data) {
                        if (data) {
                            utils.showContent(container, render(data[0]));
                        }
                    });
                });
        }
        
        function restart(data) {
            // A "request" is a message emitted to the runtime which automatically
            // subscribes to a response, and returns it as a promise. When the
            // reponse is received, the promise is fulfilled and returned.
            // This presents a consistent promise api for message requests.
            // Requests to the runtime can be combined into a single request.
            return validateInput(data.input)
                .then(function (input) {
                    return config.runtime.requests([
                        ['config', {property: 'services.workspace.url'}],
                        ['authToken']
                    ])
                    .spread(function (workspaceUrl, authToken) {
                        var workspace = new Workspace(workspaceUrl.value, {
                            token: authToken.value
                        });
                        return workspace.get_objects([
                            {ref: input.objectRef}
                        ]);
                    })
                    .then(function (data) {
                        if (data) {
                            utils.showContent(container, render(data[0]));
                        }
                    });
                });
        }

        // Runtime Hooks
        // All interaction with the runtime is via events. "Hooks" are events 
        // we listen for which are emitted by the runtime to this widget.
        // At present, each widget has its own runtime, so all messages are
        // contained to the parent and the widget.
        config.runtime.on('state', function (newState) {
            // Initially show a loading indicator
            utils.showLoading(container, 'Loading new state...');
            
            // Launch the main widget code.
            restart(newState);    
        });
        
        
        // After we have reported that we are ready, at some point the host
        // may ask us to start. Then we go.
        config.runtime.on('start', function (initialState) {
            // Initially show a loading indicator
            utils.showLoading(container, 'Loading initial state...');
            
            // Launch the main widget code.
            start(initialState)
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

        // Tell the host that we are ready to roll.
        config.runtime.send('ready');
    }
    return {
        make: function (config) {
            return factory(config);
        }
    };
});