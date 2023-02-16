const terminal = require('terminal-kit').terminal
const fs = require('fs')
const glob = require("glob").sync
const path = require("path")
const JSONC = require("jsonc").safe

const {insertVariablesInJSON} = require("./utils")

terminal.on("key", function (name) {
    if (name === "CTRL_C") terminal.processExit(0)
})

const menu = (...args) => {
    return new Promise((resolve, reject) => {
        terminal.singleColumnMenu(...args, (err, data) => {
            if (err) return reject(err)
            resolve(data)
        })
    })
}

const input = (...args) => {
    return new Promise((resolve, reject) => {
        terminal.inputField(...args, (err, data) => {
            if (err) return reject(err)
            resolve(data)
        })
    })
}

async function selectCategory() {
    const categories = require("../categories.json")

    const result = await menu([...categories, "Cancel"])
    if (result.selectedText == "Cancel") {
        terminal.processExit(0)
    }

    return result.selectedText
}

function getSnippets(forCategory) {
    let snippets = []

    // console.log(snippetFolder)
    const snippetPaths = glob(`snippets/*/`)

    for (const snippetPath of snippetPaths) {
        const info = JSON.parse(fs.readFileSync(snippetPath + "\\snippet_info.json"))

        if (info.categories.includes(forCategory)) {
            snippets.push({
                "path": snippetPath,
                "info": info
            })
        }
    }
    return snippets
}

async function selectSnippet(snippets) {
    const result = await menu([...snippets.map(x => x.info.name), "Cancel"])
    if (result.selectedText == "Cancel") {
        terminal.processExit(0)
    }
    return snippets[result.selectedIndex]
}

async function getSnippetDataInput(snippet) {
    const inputData = snippet.info["input_data"]
    let newData = {}

    for (const [key, value] of Object.entries(inputData)) {
        terminal.defaultColor(`\n${value.display}: `);
        const newValue = await input()

        if (newValue == "") {
            newData[key] = value.default
        } else {
            newData[key] = newValue
        }
    }
    return newData
}

async function importSnippet(snippet, data) {
    const allFiles = glob(`/data/**/*.*`, {
        "root": snippet.path
    })

    const snippetFileDirectory = path.resolve(snippet.path, "./data/")
    const projectFileDirectory = path.resolve("../../../tmp")
 
    for (const filePath of allFiles) {
        const {dir, name, ext} = path.parse(filePath)
        const relativePath = path.relative(snippetFileDirectory, dir)

        const newName = name.replace(/{(.*?)}/g, function (_match, variableName) {
            const variableValue = data[variableName]  
            if (variableValue == undefined) {
                console.error(`Variable ${variableName} has not been given a value`)
                return
            }
            return variableValue
        })

        const newParentDir = path.resolve(projectFileDirectory, relativePath)
        fs.mkdirSync(newParentDir, { "recursive": true })

        if (ext == ".json") {
            const oldData = String(fs.readFileSync(filePath))
            const [parseError, oldJSONData] = JSONC.parse(oldData)
            if (parseError) {
                console.error("[Internal Error] error passing snippet json", parseError)
                return
            }
            
            const newJSONData = insertVariablesInJSON(oldJSONData, data)

            fs.writeFileSync(`${newParentDir}/${newName}${ext}`, JSON.stringify(newJSONData, null, 4))
        } else {
            fs.copyFileSync(filePath, `${newParentDir}/${newName}${ext}`)
        }
    }
}

async function main() {
    terminal.clear()
    terminal.cyan("Choose a category:\n")
    const category = await selectCategory()
    terminal.clear()

    terminal.cyan(`${category}:\n`)
    const snippets = getSnippets(category)

    const snippet = await selectSnippet(snippets)
    terminal.clear()
    
    if (snippet === undefined) return

    terminal.cyan(`${snippet.info.name}:\n- By ${snippet.info.author}\n`)

    const data = await getSnippetDataInput(snippet)

    await importSnippet(snippet, data)

    terminal.processExit(0)
}

main()
