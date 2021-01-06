import { ProtractorPlugin, ProtractorBrowser, browser } from 'protractor';

import * as interceptor from './xhr.interceptor';

declare var module: any;

class RequestUtils {
  static transform(req) {
    return req
      ? {
        url: req.url,
        method: req.method && req.method.toUpperCase(),
        body: RequestUtils.parseBody(req.requestBody),
        headers: req.requestHeaders,
        response: {
          headers: RequestUtils.parseHeaders(req.headers),
          body: RequestUtils.parseBody(req.body),
          statusCode: req.statusCode
        }
      }
      : undefined;
  }

  private static parseHeaders(stringOrObject: string | object) {
    if (typeof stringOrObject === 'object') {
      return stringOrObject;
    }
    const headers = {};
    stringOrObject
      .trim()
      .replace(/\r/g, '')
      .split('\n')
      .forEach(header => {
        const match = header.match(/^(.+)?:\s?(.+)$/);
        if (match) {
          headers[match[1].toLowerCase()] = match[2];
        }
      });
    return headers;
  }

  private static parseBody(str: string) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }
}

let xhrInterceptorPlugin: ProtractorPlugin = {
  setup() {
    ProtractorBrowser.prototype.addInterceptor = () => browser.executeAsyncScript(interceptor.setup);
    ProtractorBrowser.prototype.clear = () => browser.executeScript(interceptor.clear);
    ProtractorBrowser.prototype.getRequest = async (index?: number) => {
      const requests: any[] = await browser.executeScript(interceptor.getRequest, index);
      return requests?.length > 0
        ? requests.map(RequestUtils.transform)
        : [];
    };
  }
};

module.exports = xhrInterceptorPlugin;
