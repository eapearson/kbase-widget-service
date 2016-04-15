/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'contigSet/data',
    'contigSet/view',
    'contigSet/error',
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
        
        function validateInput(objectRefs, options) {
            return Promise.try(function () {
                if (!objectRefs) {
                    throw new Error('No input supplied');
                }
                if (!objectRefs.objectRef) {
                    console.error(objectRefs, options);
                    throw new Error('The objectRef input object is missing');
                }
                return [objectRefs, options];
            });
        }
        
        function start(objectRefs, options) {
            // The input is either the dynamic input from data.input,
            // or the constructor input, from config.input
            return validateInput(objectRefs, options)
                .then(function () {
                    // Set up our components.
                    viewComponent.setup(container);
                    viewComponent.start(objectRefs);
                    dataComponent.start(objectRefs);
                 })
                .then(function () {
                    return config.runtime.requests([
                        ['config', {property: 'services.workspace.url'}],
                        ['authToken']
                    ]);
                })
                .spread(function (workspaceUrl, authToken) {
                    // In this widget model, the data component is always fed
                    // a strict diet of data. It never gets data from the 
                    // environment. That is the job of this front end widget
                    // controller.
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
                        objectRef: objectRefs.objectRef
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
            start(initialState.objectRefs, initialState.options)
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