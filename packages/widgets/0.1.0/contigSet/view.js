/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'numeral',
    'kb_common/html',
    'datatables_bootstrap'
], function ($, numeral, html) {
    'use strict';

    function overviewTable(input) {
        var table = {
            columns: ['KBase ID', 'Name', 'Object ID', 'Source', 'Source ID', 'Type'],
            rows: [
                [
                    input.data.contigSet.id, 
                    input.data.contigSet.name, 
                    input.data.objectInfo.id,
                    input.data.contigSet.source, 
                    input.data.contigSet.source_id, 
                    input.data.contigSet.type
                ]
            ],
            classes: ['table', 'table-striped', 'table-bordered']
        };
        return html.makeTableRotated(table);
    }

    function contigsTable(input) {
        var contigsData = input.data.contigSet.contigs.map(function (contig) {
            return [
                contig.id, contig.length
            ];
        }),
            table = {
                columns: ['Contig name', 'Length'],
                rows: contigsData,
                classes: ['table', 'table-striped', 'table-bordered']
            };
        return html.makeTable(table);
    }

    function render(container, input) {
        var tabId = html.genId(),
            tabSet = {
                id: tabId,
                tabs: [
                    {
                        label: 'Overview',
                        name: 'overview',
                        content: overviewTable(input)
                    },
                    {
                        label: 'Contigs',
                        name: 'contigs',
                        content: contigsTable(input)
                    }
                ]
            };
        container.innerHTML = html.makeTabs(tabSet);
        
        (function () {
            var tableConfig = {
                sPaginationType: 'full_numbers',
                iDisplayLength: 10,
                columnDefs: [
                    {width: '80%', targets: 0},
                    {width: '20%', targets: 1},
                    {render: function (data, type, row) {
                            return numeral(data).format('0,0');
                        }, targets: 1},
                    {class: 'text-right', targets: 1}
                ],
                initComplete: function () {
                    var api = this.api(),
                        rowCount = api.data().length,
                        pageSize = api.page.len(),
                        wrapper = api.settings()[0].nTableWrapper;
                    if (rowCount <= pageSize) {
                        $(wrapper).find('.dataTables_length').hide();
                        $(wrapper).find('.dataTables_filter').hide();
                        $(wrapper).find('.dataTables_paginate').hide();
                        $(wrapper).find('.dataTables_info').hide();
                    }
                },
                oLanguage: {
                    sSearch: 'Search contig:',
                    sEmptyTable: 'No contigs found.'
                }
            },
            $node = $('#' + tabId + ' .tab-content [data-name="contigs"] table');
            $node.dataTable(tableConfig);
        }());
    }
    
    function renderWaiting(container) {
        container.innerHTML = html.loading('Loading contigset data');
    }

    // view interface

    function factory(config) {
        var root, container,
            input = {};

        /*
         * Set the view widget.
         * Attach to the provided node, set up any permanent layout.
         */
        function setup(node) {
            container = node;
            // container = root.appendChild(document.createElement('div'));
            renderWaiting(container);
        }

        /*
         * Start the view widget, putting it into an active data.
         * Install dom listeners, event listeners
         */
        function start(params) {
            input.params = params;
        }

        /*
         * Update the widget with incoming data.
         * This is the essential data injection to the widget and may be
         * repeated whenever there is a data update, including the initial
         * data state.
         */
        function update(data) {
            input.data = data;
            render(container, input);
        }

        /*
         * Stop the view widget activity.
         * Uninstall any event handlers.
         */
        function stop(params) {

        }

        /*
         * Tear down the widget dom presence.
         * Mostly just here to allow the removal of the top level dom
         * node for this widget.
         */
        function teardown() {
            root.removeChild(container);
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