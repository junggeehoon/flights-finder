const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const axios = require('axios');
const config = require('./config');

const convertToKRW = async (price, unit) => {
  try {
    const country = unit.slice(unit.length - 3);
    const response = await axios.get(`http://earthquake.kr:23490/query/${country}KRW`);
    return Math.round(response.data[`${country}KRW`][0] * price);
  } catch (err) {
    console.log(err);
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.user,
    pass: config.pass
  }
});

const sendMail = price => {
  const mailOptions = {
    from: 'junggeehoon@gmail.com',
    to: 'pscad_jung@naver.com',
    subject: 'Your flight is ready!!',
    text: `The price is: ${price}원`
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

const extractItems = async () => {
  const elements = document.querySelectorAll('td.sibilings.active > label > span.price');
  return [...elements].map(el => el.innerHTML);
}

const extractUnits = async () => {
  const elements = document.querySelectorAll('#depAvail_Area > div.alR.mar_b20 > span');
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
    departure: '샌프란시스코',
    arrival: '인천',
    departureDate: 20190115,
    arrivalDate: 20190526,
    price: 1300000
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
    //#dp15418130152  div.ui-datepicker-group.ui-datepicker-group-last > table > tbody > tr:nth-child(3) > td:nth-child(3)
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


    // Only in case of U.S
    // Disable popup
    await page.click('#expCase > div.layer_pop > div.btn_wrap_ceType2 > button.btn_M.red');
    await page.waitFor(4000);

    // Extract price
    const prices = await page.evaluate(extractItems);
    let price = parseFloat(prices[0].replace(/,/g, ''));

    // Extract unit
    const units = await page.evaluate(extractUnits);
    const unit = units[0];

    // Convert unit to KRW
    if (unit !== '단위 : KRW') {
      price = await convertToKRW(price, unit);
    }
    
    console.log(price);
    if (price < config.price) {
      sendMail(price);
    }

    browser.close();
    return;

  } catch (err) {
    console.log(err);
  }
}
// setInterval(visitHomepage, 60000);
visitHomepage();