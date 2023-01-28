const { exec } = require("child_process")

const FILTER_DIR = process.env.FILTER_DIR

const command = `cd "${FILTER_DIR}" & start /wait npm run main ${FILTER_DIR}`

exec(command, (err, sdo, sdr) => {
    console.log("Complete!")
})