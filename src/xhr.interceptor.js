'use strict'

// this needs to be js code since we pass it to browser.executeScript (https://www.protractortest.org/#/api?view=webdriver.WebDriver.prototype.executeScript)
const Interceptor = {
  setup: function (done) {
    NAMESPACE = '__ptorinterceptor';
    const _OriginalXHR = window.XMLHttpRequest;
    // Clear storage before proceed
    window[NAMESPACE] = { requests: [] };
    if (window.sessionStorage && window.sessionStorage.removeItem) {
      window.sessionStorage.removeItem(NAMESPACE);
    }
    // If fetch supported, patch it
    if (typeof window.fetch == 'function') {
      replaceFetch();
    }
    // Patch XMLHttpRequest
    window.XMLHttpRequest = function () {
      // Save copy of originals to restore
      const _xhr = new _OriginalXHR();
      const _originalOpen = _xhr.open;
      const _originalSend = _xhr.send;
      const _originalSetRequestHeader = _xhr.setRequestHeader;

      let lastMethod;
      let lastURL;
      let lastRequestBody;
      let lastRequestHeader = {};

      // Wrap open
      _xhr.open = function () {
        lastMethod = arguments[0];
        lastURL = arguments[1];

        _originalOpen.apply(_xhr, arguments);
      };

      // Wrap send
      _xhr.send = function () {
        lastRequestBody = parsePayload(arguments[0]);

        _originalSend.apply(_xhr, arguments);
      };

      // Wrap set headers
      _xhr.setRequestHeader = function () {
        lastRequestHeader[arguments[0]] = arguments[1];

        _originalSetRequestHeader.apply(_xhr, arguments);
      };

      // Listen to 'load' event
      _xhr.addEventListener('load', function () {
        addRequest({
          url: lastURL,
          method: lastMethod.toUpperCase(),
          headers: _xhr.getAllResponseHeaders(),
          requestHeaders: lastRequestHeader,
          // IE9 comp: need xhr.responseText
          body: _xhr.response || _xhr.responseText,
          statusCode: _xhr.status,
          requestBody: lastRequestBody
        });
      });

      return _xhr;
    }

    done(window[NAMESPACE]);

    function replaceFetch() {
      const _fetch = window.fetch;

      window.fetch = function (input, init) {
        // Default values if not overwritten
        let request = {
          method: 'GET',
          requestHeaders: {},
          headers: {}
        };

        if (typeof input == 'string') {
          request.url = input;
        } else {
          // Request object
          const clonedRequest = input.clone();

          request.requestBody = input instanceof Request
            ? clonedRequest.text()
            : input.body;

          request.url = clonedRequest.url;
          request.requestHeaders = parseHeaders(clonedRequest.headers);
          request.method = clonedRequest.method;
        }

        if (init) {
          request.requestBody = init.body ? init.body : request.requestBody;
          request.method = init.method ? init.method : request.method;
          request.requestHeaders = parseHeaders(init.headers);
        }

        return _fetch.apply(window, arguments)
          .then(function (response) {
            // TODO: We could clone it multiple times and check for all type variations of body
            let clonedResponse = response.clone();
            let responsePromise = clonedResponse.text();

            Promise.all([request.requestBody, responsePromise])
              .then(function (results) {
                request.requestBody = results[0];
                request.body = results[1];
                request.statusCode = clonedResponse.status;
                request.headers = parseHeaders(clonedResponse.headers);

                // Save request
                addRequest(request);
              });
            return response;
          });
      };
    };

    function parseHeaders(headers) {
      if (headers instanceof Headers) {
        let result = {};
        let headersEntries = headers.entries();
        let header = headersEntries.next();
        while (!header.done) {
          result[header.value[0]] = header.value[1];
          header = headersEntries.next();
        }
        return result;
      }
      return headers || {};
    };

    /*
     * Parse payload
     * Required data: payload - string or data to be parsed
     * Optional data: none
     */
    function parsePayload(payload) {
      let parsed;
      if (typeof payload == 'string') {
        parsed = payload;
      } else if (payload instanceof FormData) {
        parsed = {};
        const entries = payload.entries();
        let item;
        while (((item = entries.next()), !item.done)) {
          parsed[item.value[0]] = item.value.slice(1);
        }
        parsed = JSON.stringify(parsed);
      } else if (payload instanceof ArrayBuffer) {
        parsed = String.fromCharCode.apply(null, payload);
      } else {
        // Just try to convert it to a string, whatever it might be
        try {
          parsed = JSON.stringify(payload);
        } catch (e) {
          parsed = '';
        }
      }
      return parsed;
    };

    /*
     * Put intercepted request to the session storage
     * Required data: request to store
     * Optional data: none
     */
    function addRequest(request) {
      window[NAMESPACE].requests.push(request);
      // If session storage isn't supported exit
      if (!window.sessionStorage || !window.sessionStorage.setItem) {
        return;
      }
      let parsed = [];
      let rawData = window.sessionStorage.getItem(NAMESPACE);
      if (rawData) {
        try {
          parsed = JSON.parse(rawData);
        } catch (e) {
          throw new Error('Could not parse sessionStorage data: ' + e.message);
        }
      }
      parsed.push(request);
      // Save
      window.sessionStorage
        .setItem(NAMESPACE, JSON.stringify(parsed));
    };
  },

  /*
   * Read requests data from the session storage
   * Required data: none
   * Optional data: index - if not specified returns all recorded requests, otherwise will return trequest with the specified index
   */
  getRequest: function getRequest(index) {
    NAMESPACE = '__ptorinterceptor';

    let requests = [];
    if (!window.sessionStorage || !window.sessionStorage.getItem) {
      requests = window[NAMESPACE].requests;
    }

    const rawData = window.sessionStorage.getItem(NAMESPACE);
    if (rawData) {
      try {
        requests = JSON.parse(rawData);
      } catch (e) {
        throw new Error('Could not parse sessionStorage data: ' + e.message);
      }
    }
    return index == null ? requests : [requests[index]];
  },

  /*
   * Clear session storage
   * Required data: none
   * Optional data: none
   */
  clear: function clear() {
    NAMESPACE = '__ptorinterceptor';
    window[NAMESPACE] = { requests: [] };

    if (window.sessionStorage && window.sessionStorage.removeItem) {
      window.sessionStorage.removeItem(NAMESPACE);
    }
  }
}

module.exports = Interceptor;
