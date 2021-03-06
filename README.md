# protractor-xhr-interceptor-plugin

## Introduction
This plugin was inspired by **wdio-intercept-service** and provide similar functionality but for protractor.
Capture and assert HTTP ajax calls in [protractortest.org](https://www.protractortest.org/#/plugins)

## Installation
```
npm install protractor-xhr-interceptor-plugin -D
```

## Usage
You can download sample project from [sample](https://github.com/artemrudenko/xhr-plugin-usage-example.git)

It should be as easy as adding *protractor-xhr-interceptor-plugin* to your `protractor.conf.js`:

```javascript
exports.config = {
  plugins: [
    package: 'protractor-xhr-interceptor-plugin'
  ]
};
```

Once initialized, some related functions are added to your browser instance.

## Example
```ts
await browser.get(`https://angular.io`);
await browser.addInterceptor();
await browser.expectRequest('GET', 'generated/docs/docs.json', 200);
await element(by.xpath('//a[contains(.,"Get Started")]')).click();
await browser.assertRequests();
```