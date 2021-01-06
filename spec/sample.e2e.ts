import { browser, by, element, ExpectedConditions } from "protractor";

describe('XHR Interceptor Sample', () => {
  const timeout = 5000;

  beforeEach(async () => {
    await browser.get(`https://angular.io`);
    await browser.addInterceptor();
  });

  it('intercept requests and store them', async () => {
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
});
