import { ProtractorPlugin, ProtractorBrowser, browser } from 'protractor';

import * as interceptor from './xhr.interceptor';

declare var module: any;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface IRequestExpectedInfo {
  method: HttpMethod;
  url: string;
  statusCode: number;
}

class RequestUtils {
  static resetExpectations = () => (globalThis[PTOR_EXPECTATION_KEY] = []);
  static getExpectations = () => globalThis[PTOR_EXPECTATION_KEY];

  static async getRequest(index?: number) {
    const requests: any[] = await browser.executeScript(interceptor.getRequest, index);
    return requests?.length > 0
      ? requests.map(RequestUtils.transform)
      : [];
  };

  static async assertRequests() {
    const expectations: IRequestExpectedInfo[] = RequestUtils.getExpectations();
    const requests = await RequestUtils.getRequest();
    const reqCopy = [...requests];
    const failed: string[] = [];
    for (const ex of expectations) {
      const index = reqCopy.findIndex(
        (req: any) => req?.method === ex.method && req.url.includes(ex.url) && req.response.statusCode === ex.statusCode);
      if (index !== -1) {
        delete reqCopy[index];
        continue;
      }
      failed.push(`Expected request(${JSON.stringify(ex)}) was not found!`);
    }
    expect(failed)
      .toEqual([]);
  }

  static expectRequest = (method: HttpMethod, url: string, statusCode: number) => {
    globalThis[PTOR_EXPECTATION_KEY]
      .push({
        method: method.toUpperCase(),
        url,
        statusCode
      } as IRequestExpectedInfo);
  };

  private static transform(req) {
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

const PTOR_EXPECTATION_KEY = '_ptorXhrExpectations';

let xhrInterceptorPlugin: ProtractorPlugin = {
  onPrepare() {
    RequestUtils.resetExpectations();
  },
  postTest() {
    RequestUtils.resetExpectations();
  },
  setup() {
    ProtractorBrowser.prototype.addInterceptor = () => browser.executeAsyncScript(interceptor.setup);
    ProtractorBrowser.prototype.clear = () => browser.executeScript(interceptor.clear);
    ProtractorBrowser.prototype.expectRequest = RequestUtils.expectRequest.bind(this);
    ProtractorBrowser.prototype.getRequest = RequestUtils.getRequest.bind(this);
    ProtractorBrowser.prototype.resetExpectations = RequestUtils.resetExpectations.bind(this);
    ProtractorBrowser.prototype.getExpectations = RequestUtils.getExpectations.bind(this);
    ProtractorBrowser.prototype.assertRequests = RequestUtils.assertRequests.bind(this);
  }
};

module.exports = xhrInterceptorPlugin;
