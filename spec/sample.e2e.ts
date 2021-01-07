import { browser, by, element, ExpectedConditions } from "protractor";

describe('XHR Interceptor Sample', () => {
  const timeout = 5000;

  beforeEach(async () => {
    await browser.get(`https://angular.io`);
    await browser.addInterceptor();
  });

  afterAll(async () => await browser.clear());

  it('should allow to intercept requests', async () => {
    const getStartedLink = element(by.xpath('//a[contains(.,"Get Started")]'));
    const getStartedSection = element(by.xpath('//section[contains(.,"Get Started")]'));
    const tryAngularHeader = element(by.xpath('//header[contains(.,"Try Angular without local setup")]'));

    await getStartedLink.click();

    await browser.wait(ExpectedConditions.presenceOf(getStartedSection), timeout);
    await getStartedSection.click();

    await browser.wait(ExpectedConditions.presenceOf(tryAngularHeader), timeout);

    const reqs = await browser.getRequest();
    expect(reqs.map(req => req.url))
      .toEqual([
        "generated/docs/docs.json",
        "generated/docs/guide/setup-local.json"
      ]);
  });

  it('should allow to add requests expectations', async () => {
    await browser.expectRequest('GET', 'generated/docs/docs.json', 200);
    await browser.expectRequest('GET', 'generated/docs/guide/setup-local.json', 200);

    const expectations = await browser.getExpectations();
    expect(expectations.length).toEqual(2);

    const getStartedLink = element(by.xpath('//a[contains(.,"Get Started")]'));
    const getStartedSection = element(by.xpath('//section[contains(.,"Get Started")]'));
    const tryAngularHeader = element(by.xpath('//header[contains(.,"Try Angular without local setup")]'));

    await getStartedLink.click();

    await browser.wait(ExpectedConditions.presenceOf(getStartedSection), timeout);
    await getStartedSection.click();
    await browser.wait(ExpectedConditions.presenceOf(tryAngularHeader), timeout);

    await browser.assertRequests();
  });

  it('should fail if no expected request was found', async () => {
    await browser.expectRequest('GET', 'generated/docs/docs.json', 200);
    await browser.expectRequest('GET', 'generated/docs/guide/setup-local.json', 200);

    const getStartedLink = element(by.xpath('//a[contains(.,"Get Started")]'));
    await getStartedLink.click();

    await browser.assertRequests();
  });
});
