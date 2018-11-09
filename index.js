const puppeteer = require('puppeteer');

const extractItems = async () => {
  const elements = document.querySelectorAll('td.sibilings.active > label > span.price');
  return [...elements].map(el => el.innerHTML);
}

const visitHomepage = async () => {
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();
  page.on('dialog', async dialog => {
    await dialog.dismiss();
  });
  const config = {
    homepage: 'https://flyasiana.com/',
    departure: '인천',
    arrival: '샌프란시스코'
  }
  try {
    await page.setViewport({
      width: 1280,
      height: 720
    });
    await page.goto(config.homepage);


    // Select language to Korean
    await page.waitForSelector('#wrap');
    await page.click('#wrap > div > div.language_wrapper.pc > div > div:nth-child(2) > div.lang_group.first > ul:nth-child(2) > li.default > a');

    // Select departure airport
    await page.waitForSelector('.quick_reservation_wrap');
    await page.waitFor(3000);
    await page.focus('#txtDepartureAirportR');
    await page.waitFor(3000);
    await page.keyboard.type(config.departure);
    await page.waitFor(500);
    await page.keyboard.press('Enter');

    // Select arrival airport
    await page.focus('#txtArrivalAirportR');
    await page.waitFor(3000);
    await page.keyboard.type(config.arrival);
    await page.waitFor(500);
    await page.keyboard.press('Enter');
    await page.waitFor(500);

    // Select departure date
    await page.click('div.ui-datepicker-group.ui-datepicker-group-first > table > tbody > tr:nth-child(3) > td:nth-child(1)');
    await page.waitFor(500);

    // Select arrival date
    await page.click('div.ui-datepicker-group.ui-datepicker-group-last > table > tbody > tr:nth-child(3) > td:nth-child(1)');
    await page.waitFor(500);

    // Next button
    await page.click('div.calendar_layer > div.btn_step_wrap > button');
    await page.waitFor(500);
    await page.click('div.shadow_layer.case2.layer_passenger > div.btn_step_wrap > button');
    await page.waitFor(500);
    await page.click('#seatNext');
    await page.waitFor(500);
    await page.click('#registTravel');
    await page.waitFor(500);

    await page.click('#expCase > div.layer_pop > div.btn_wrap_ceType2 > button.btn_M.red');
    await page.waitFor(3000);

    const results = await page.evaluate(extractItems);

    console.log(results);
    browser.close();
    return;

  } catch (err) {
    console.log(err);
  }
}

visitHomepage();