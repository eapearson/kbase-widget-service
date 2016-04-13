define([
    'kb_common/html'
], function (html) {
    'use strict';
    function showContent(container, content) {
        container.innerHTML = content;
    }

    function appendContent(container, content) {
        var div = document.createElement('div');
        div.innerHTML = content;
        container.appendElement(div);
    }

    function showError(container, error) {
        var message;
        if (error.message) {
            message = error.message;
        } else if (error.error) {
            message = error.error.message;
        } else if (typeof error === 'string') {
            message = error;
        } else {
            message = 'Unknown error';
        }
        container.innerHTML = html.makePanel({
            title: 'Error',
            content: message
        });
    }
    
    function showLoading(container, message) {
        container.innerHTML = html.loading(message);
    }

    return {
        showContent: showContent,
        appendContent: appendContent,
        showError: showError,
        showLoading: showLoading
    };
});