/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_service/client/workspace',
    'kb_service/utils'
], function (Promise, Workspace, apiUtils) {
    'use strict';

    // TODO: should the object ref be the input to fetch?
    function factory(config) {
        function start() {
            // nothing to do in default.
        }

        function fetch(input) {
            return Promise.try(function () {
                var workspace = new Workspace(input.config.services.workspace.url, {
                    token: input.authorization.token
                });
                return workspace.get_object_subset([{
                        ref: input.objectRef,
                        included: ['contigs/[*]/id', 'contigs/[*]/length', 'id',
                            'name', 'source', 'source_id', 'type']
                    }])
                    .then(function (data) {
                        return {
                            contigSet: data[0].data,
                            objectInfo: apiUtils.objectInfoToObject(data[0].info)
                        };
                    });
            });
        }

        function stop() {
            // nothing to do in default.
        }

        return {
            start: start,
            fetch: fetch,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});