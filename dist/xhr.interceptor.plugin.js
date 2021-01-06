"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
const interceptor = __importStar(require("./xhr.interceptor"));
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
    static parseHeaders(stringOrObject) {
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
    static parseBody(str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return str;
        }
    }
}
let xhrInterceptorPlugin = {
    setup() {
        protractor_1.ProtractorBrowser.prototype.addInterceptor = () => protractor_1.browser.executeAsyncScript(interceptor.setup);
        protractor_1.ProtractorBrowser.prototype.clear = () => protractor_1.browser.executeScript(interceptor.clear);
        protractor_1.ProtractorBrowser.prototype.getRequest = (index) => __awaiter(this, void 0, void 0, function* () {
            const requests = yield protractor_1.browser.executeScript(interceptor.getRequest, index);
            return (requests === null || requests === void 0 ? void 0 : requests.length) > 0
                ? requests.map(RequestUtils.transform)
                : [];
        });
    }
};
module.exports = xhrInterceptorPlugin;
