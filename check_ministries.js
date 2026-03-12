import { getAllMinistries } from './src/services/ministryService.js';

async function run() {
    try {
        const ministries = await getAllMinistries();
        console.log(JSON.stringify(ministries, null, 2));
    } catch (error) {
        console.error(error);
    }
}

run();
