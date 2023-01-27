const { exec } = require("child_process");

const FILTER_DIR = process.env.FILTER_DIR
const path = `${FILTER_DIR}/../main.js`

exec('cmd.exe' + ['/c', 'start', 'node', path, FILTER_DIR].join(" "), () => {
    console.log("Complete!")
})