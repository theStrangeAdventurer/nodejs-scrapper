import cherio from 'cherio';
import chalk from 'chalk';

import saveData from './saver';
import { formatPrice, formatPeriod } from '../helpers/common';
import { taskQueue, p } from '../index';

const task = async initialData => {
  try {
    console.log(chalk.green(`Getting data from: `) + chalk.green.bold(initialData.url));
    const detailContent = await p.getPageContent(initialData.url);
    const $ = cherio.load(detailContent);

    let period = $('.catalog-generation-summary__desc_period')
      .clone()
      .children()
      .remove()
      .end()
      .text();

    const priceNewStr = $(
      '.catalog-generation-summary__info .catalog-generation-summary__desc:nth-of-type(2)'
    ).text();

    const priceWithMileageStr = $(
      '.catalog-generation-summary__info .catalog-generation-summary__desc:nth-of-type(3)'
    ).text();

    let priceNew = priceNewStr ? formatPrice(priceNewStr) : null;
    let priceWithMileage = priceWithMileageStr ? formatPrice(priceWithMileageStr) : null;
    period = formatPeriod(period);

    if (!priceWithMileage && priceNew) {
      priceWithMileage = priceNew;
      priceNew = null;
    }

    await saveData({
      ...initialData,
      priceNew,
      priceWithMileage,
      period
    });
  } catch (err) {
    throw err;
  }
};
export default function listItemsHandler(data) {
  data.forEach(initialData => {
    taskQueue.push(
      () => task(initialData),
      err => {
        if (err) {
          console.log(err);
          throw new Error('Error getting data from url[ ' + initialData.url + ' ]');
        }
        console.log(chalk.green.bold(`Success getting data from: \n${initialData.url}\n`));
      }
    );
  });
}
