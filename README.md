# protractor-xhr-interceptor-plugin
This plugin was inspired by **wdio-intercept-service** and provide similar functionality but for protractor.

Capture and assert HTTP ajax calls in [protractortest.org](https://www.protractortest.org/#/plugins)

## Prerequisites

* protractor **>v5.x**.

## Installation

```
npm install protractor-xhr-interceptor-plugin -D
```

## Usage

It should be as easy as adding wdio-intercept-service to your `protractor.conf.js`:

```javascript
exports.config = {
  // ...
  plugins: [
    package: 'protractor-xhr-interceptor-plugin',
  ]
  // ...
};
```

and you're all set.

Once initialized, some related functions are added to your browser command chain.

## Quickstart

Example usage:

```ts
await browser.get(`https://angular.io`);
await browser.addInterceptor();
await browser.expectRequest('GET', 'generated/docs/docs.json', 200);
await element(by.xpath('//a[contains(.,"Get Started")]')).click();
await browser.assertRequests();
```
