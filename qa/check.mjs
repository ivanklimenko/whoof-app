import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({headless:true,executablePath:'/Users/leshaisanov/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const screen=page.getByTestId('native-app');
async function snap(name){await page.mouse.move(30,30);await page.waitForTimeout(550);await screen.screenshot({path:`qa/v1-${name}.png`});}
async function nav(name){await page.getByRole('navigation').getByRole('button',{name,exact:true}).click();}
await page.goto('http://192.168.1.179:4178/');await expect(page.getByRole('heading',{name:'Карта дня'})).toBeVisible();
const box=await screen.boundingBox();if(Math.abs(box.width-390)>1||Math.abs(box.height-844)>1)throw Error('Native viewport mismatch');
await snap('home');
await page.locator('.mobile-scroll').first().evaluate(el=>el.scrollTop=390);await snap('totals');
await nav('Метрики');await snap('metrics');
await page.getByRole('button',{name:'Подробнее: Активность'}).click();await expect(page.getByRole('dialog')).toBeVisible();await snap('metric-detail');await page.getByRole('button',{name:'Закрыть',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
await nav('Прогулки');await snap('walks');
await page.getByRole('button',{name:'Начать прогулку'}).click();await expect(page.getByText('Прогулка записывается')).toBeVisible();await page.getByRole('button',{name:'Пауза',exact:true}).click();await expect(page.getByText('Запись на паузе')).toBeVisible();await page.getByRole('button',{name:'Завершить',exact:true}).click();await expect(page.getByRole('dialog',{name:'Детали прогулки'})).toBeVisible();await page.getByRole('button',{name:'Закрыть',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await snap('walk-history');
await nav('Настройки');await snap('settings');
await page.getByRole('button',{name:/Профиль питомца/}).click();await snap('profile');
await page.getByRole('button',{name:'Изменить данные'}).click();await snap('edit');await page.getByRole('button',{name:'Закрыть',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
await page.getByRole('button',{name:'Открыть медкарту'}).click();await snap('medical');await page.getByRole('button',{name:'Закрыть медкарту'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
await nav('Настройки');await page.getByRole('button',{name:/Доступ к питомцу/}).click();await snap('access');
await page.getByRole('button',{name:'Посмотреть приглашение',exact:true}).click();await snap('invitation');await page.getByRole('button',{name:'Присоединиться',exact:true}).click();await snap('invitation-success');await page.getByRole('button',{name:'Завершить предпросмотр'}).click();
await page.getByRole('button',{name:'Обсудить с AI',exact:true}).click();await snap('ai');
await page.getByRole('button',{name:'Как прошёл день Джеки?',exact:true}).click();await expect(page.locator('.message.assistant')).toBeVisible();await snap('ai-message');

await page.getByRole('button',{name:'Назад',exact:true}).click();await nav('Главная');
await expect(page.locator('.phone-bezel,.device-menu-bar,.keyboard-dock')).toHaveCount(0);
await page.getByRole('button',{name:'Обсудить с AI',exact:true}).click();
const input=page.locator('.chat-composer input');await input.fill('Что с активностью?');await expect(input).toHaveValue('Что с активностью?');
await expect(input).not.toHaveAttribute('inputmode','none');await snap('native-input');
await page.getByRole('button',{name:'Назад',exact:true}).click();await nav('Главная');
for(const width of [360,430]){await page.setViewportSize({width,height:844});await page.waitForTimeout(200);const b=await screen.boundingBox();if(Math.abs(b.width-width)>1)throw Error('Wrong responsive width');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');await snap('native-'+width);}
console.log(JSON.stringify({errors,checks:'native viewport, navigation, sheets, walk recording, QR acceptance, AI input and 360/390/430px widths'}));await browser.close();if(errors.length)throw Error(errors.join('\n'));
