import cherio from 'cherio'
import chalk from 'chalk'
import {slugify} from 'transliteration'

import listItemsHandler from './handlers/listItemsHandler'
import {arrayFromLength} from './helpers/common'
import {getPageContent} from './helpers/puppeteer'

const SITE = 'https://auto.ru/catalog/cars/all/?page_num='
const pages = 2;

(async function main() {
    try {
        for(const page of arrayFromLength(pages)) {
            const url = `${SITE}${page}`
            const pageContent = await getPageContent(url)
            const $ = cherio.load(pageContent)
            const carsItems = []

            $('.mosaic__title').each((i, header) => {
                const url = $(header).attr('href')
                const title = $(header).text()

                carsItems.push({
                    title,
                    url,
                    code: slugify(title)
                })
            })
            await listItemsHandler(carsItems)
        }

    } catch (err) {
        console.log(chalk.red('An error has occured \n'));
        console.log(err);
    }
})()
