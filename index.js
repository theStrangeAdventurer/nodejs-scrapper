import cherio from 'cherio';
import chalk from 'chalk';
import { slugify } from 'transliteration';

import listItemsHandler from './handlers/listItemsHandler';
import { arrayFromLength } from './helpers/common';
import { PuppeteerHandler } from './helpers/puppeteer';
import queue from 'async/queue';

const SITE = 'https://auto.ru/catalog/cars/all/?page_num=';
const pages = 4;
const concurrency = 10;
const startTime = new Date();

export const p = new PuppeteerHandler();
export const taskQueue = queue(async (task, done) => {
  try {
    await task();
    console.log(chalk.bold.magenta('Task completed, tasks left: ' + taskQueue.length() + '\n'));
    done();
  } catch (err) {
    throw err;
  }
}, concurrency);

taskQueue.drain(function() {
  const endTime = new Date();
  console.log(chalk.green.bold(`🎉  All items completed [${(endTime - startTime) / 1000}s]\n`));
  p.closeBrowser();
  process.exit();
});

(function main() {
  arrayFromLength(pages).forEach(page => {
    taskQueue.push(
      () => listPageHandle(`${SITE}${page}`),
      err => {
        if (err) {
          console.log(err);
          throw new Error('🚫 Error getting data from page#' + page);
        }
        console.log(chalk.green.bold(`Completed getting data from page#${page}\n`));
      }
    );
  });
})();

async function listPageHandle(url) {
  try {
    const pageContent = await p.getPageContent(url);
    const $ = cherio.load(pageContent);
    const carsItems = [];

    $('.mosaic__title').each((i, header) => {
      const url = $(header).attr('href');
      const title = $(header).text();

      carsItems.push({
        title,
        url,
        code: slugify(title)
      });
    });
    listItemsHandler(carsItems);
  } catch (err) {
    console.log(chalk.red('An error has occured \n'));
    console.log(err);
  }
}
