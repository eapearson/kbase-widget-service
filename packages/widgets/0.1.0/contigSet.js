/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'contigset/data',
    'contigset/view',
    'contigset/error',
    'utils',
    'datatables_bootstrap',
    'css!genomeComparison/styles'
], function (Promise, dataWidgetFactory, viewWidgetFactory, errorWidgetFactory, utils) {
    'use strict';

    function factory(config) {
        var // runtime = config.runtime,
            container = config.node,
            dataComponent = dataWidgetFactory.make(config),
            viewComponent = viewWidgetFactory.make(config),
            error;
        
        function validateParams(params) {
            return Promise.try(function () {
                if (!params) {
                    throw new Error('No params supplied');
                }
                if (!params.objectRef) {
                    throw new Error('The objectRef param is missing');
                }
                return params;
            });
        }
        
        function start(data) {
            // The input is either the dynamic input from data.input,
            // or the constructor input, from config.input
            console.log('INPUT', config, data);
            var input = config.input || data.input;
            return validateParams(input)
                .then(function () {
                    // Set up our components.
                    viewComponent.setup(container);
                    viewComponent.start(input);
                    dataComponent.start(input);
                 })
                .then(function () {
                    return config.runtime.requests([
                        ['config', {property: 'services.workspace.url'}],
                        ['authToken']
                    ]);
                })
                .spread(function (workspaceUrl, authToken) {
                    console.log('object ref ', input);
                    return dataComponent.fetch({
                        config: {
                            services: {
                                workspace: {
                                    url: workspaceUrl.value
                                }
                            }
                        },
                        authorization: {
                            token: authToken.value
                        },
                        objectRef: input.objectRef
                    });
                })
                .then(function (data) {
                    return viewComponent.update(data);
                });
        }

        config.runtime.on('start', function (initialState) {
            // Initially show a loading indicator
            utils.showLoading(container, 'Loading data...');

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
        config.runtime.send('ready');
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});