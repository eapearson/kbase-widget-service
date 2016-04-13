/*global define*/
/*jglint white:true,browser:true */
define([
    'bluebird',
    'kb/common/html',
    './widgetService',
    './messageBus'
], function (Promise, html, WidgetService, MessageBus) {
    'use strict';
    function factory(config) {
        var t = html.tag,
            div = t('div'),
            widgetService = WidgetService.make({
                url: config.widgetServiceUrl, // url for contacting the widget service
                cdn: config.cdnUrl // url for the cdn containing the widget code
            }),
            container = config.node,
            // WIDGETS
            widgetInstances = {};


        function getWidget(localName) {
            var widgetInstance = widgetInstances[localName];
            if (!widgetInstance) {
                throw new Error('Cannot find installed widget named ' + localName);
            }
            return widgetInstance;
        }

        function addWidget(args) {
            var localName = args.name || html.genId(),
                widgetName = args.widget;
            var widgetDef = widgetService.findWidget(widgetName);
            if (!widgetDef) {
                throw new Error('Cannot find widget with name ' + widgetName);
            }
            if (widgetInstances[localName]) {
                throw new Error('A widget is already installed with this name ' + localName);
            }
            var domId = html.genId();
            widgetInstances[localName] = {
                widgetName: widgetName,
                localName: localName,
                domId: domId,
                widgetDef: widgetDef
            };
            if (args.panel) {
                return html.makePanel({
                    title: args.title || localName,
                    content: div({id: domId})
                });
            }
            return div({id: domId});
        }
        function widgetNode(localName) {
            var widgetInstance = getWidget(localName);
            if (!widgetInstance) {
                throw new Error('Cannot find widget installed with name ' + localName);
            }
            var node = document.getElementById(widgetInstance.domId);
            if (!node) {
                throw new Error('Cannot find node for widget named ' + localName);
            }
            return node;
        }

        function getModuleLoader(widgetDef) {
            return widgetService.getModuleLoader(widgetDef);
        }

        function getWidgetInstances() {
            return Object.keys(widgetInstances).map(function (localName) {
                return widgetInstances[localName];
            });
        }

        function loadWidgets(runtime, params) {
            return Promise.all(getWidgetInstances().map(function (widgetInstance) {
                var widgetDef = widgetInstance.widgetDef,
                    widgetDiv = widgetNode(widgetInstance.localName),
                    widgetLoader = getModuleLoader(widgetDef),
                    runtimeComumnicator = makeWidgetComm(runtime, widgetDiv, params);

                // Each widget is a promise. Note that this just creates the widgets,
                // it does not wait for the widget to render, fetch, etc.
                // That only happens after the widget receives the 'start' message.
                return new Promise(function (resolve, reject) {
                    widgetLoader([widgetDef.widget.amdName], function (Widget) {
                        // TODO: store the widget in the widgetInstances...
                        try {
                            var widget = Widget.make(config, runtimeComumnicator);
                            resolve();
                        } catch (ex) {
                            reject(ex);
                        }
                    });
                });
            }));

        }
// Create an runtime communication object. For a widget to communicate with 
        // the environment which invoked it.
        function makeWidgetComm(runtime, node, params) {
            var bus = MessageBus.make();

            bus.subscribe('ready', function (data) {
                bus.publish('start', {
                    node: node,
                    params: params
                });
            });

            bus.subscribe('config', function (data) {
                return {
                    value: runtime.config(data.property, data.defaultValue)
                };
            });

            bus.subscribe('authToken', function (data) {
                return {
                    value: runtime.service('session').getAuthToken()
                };
            });

            var lastId = 0;
            function genId() {
                var nextId = lastId + 1,
                    id = 'message_' + String(nextId);
                lastId = nextId;
                return id;
            }


            // API

            function on(messageName, handler) {
                bus.subscribe(messageName, handler);
            }

            function request(messageName, data) {
                return new Promise(function (resolve, reject) {
                    var id = genId();
                    bus.subscribe(id, function (data) {
                        resolve(data);
                    }, true);
                    bus.publish(messageName, data, {
                        reply: id
                    });
                });
            }

            function requests(messages) {
                return Promise.all(messages.map(function (message) {
                    return request.apply(null, message);
                }));
            }

            function send(message, data) {
                bus.publish(message, data);
            }

            // Common message patterns captured as methods.

            function config(property, defaultValue) {
                return request('config', {
                    property: property,
                    defaultValue: defaultValue
                })
                    .then(function (response) {
                        return response.value;
                    });
            }

            return {
                on: on,
                request: request,
                requests: requests,
                send: send,
                config: config
            };
        }
        return {
            getWidget: getWidget,
            addWidget: addWidget,
            widgetNode: widgetNode,
            getModuleLoader: getModuleLoader,
            getWidgetInstances: getWidgetInstances,
            makeWidgetComm: makeWidgetComm,
            loadWidgets: loadWidgets
        };
    }
    return {
        make: function (config) {
            return factory(config);
        }
    };
});