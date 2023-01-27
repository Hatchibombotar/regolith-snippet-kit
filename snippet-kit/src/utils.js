const isObject = (value) =>  Object.prototype.toString.call(value) === "[object Object]"

function insertVariablesInJSON(json, variables) {
    let result = {}

    for (let prop in json) {
        if (prop in json) {
            // if the property is a nested object call function on it and continue
            // Modify the name of the property.
            // get the new value for the property name. Replace variables with their (STRING) values.
            const newPropertyName = prop.replace(/{(.*?)}/g, function (_match, variableName) {
                const variableValue = variables[variableName]
                if (variableValue == undefined) {
                    console.error(`Variable ${variableName} has not been given a value`)
                    return
                }
                if (typeof variableValue != "string") {
                    console.error(`Variable "${variableName}" located inside of JSON key must be a string.`)
                    return
                }
                return variableValue
            })

            if (isObject(json[prop])) {
                result[newPropertyName] = insertVariablesInJSON(json[prop], variables)
                continue
            }

            if (typeof json[prop] != "string") {
                result[newPropertyName] = json[prop]
                continue
            }

            // Modify the value of the property.			
            const propValueMatches = json[prop].match(/{.*?}/g)

            if (propValueMatches) {
                if (propValueMatches.length == 1 && json[prop].slice(0, 1) == "{" && json[prop].slice(-1) == "}") {
                    // Replace strings with one variable with the value of the variable
                    const variableName = propValueMatches[0].slice(2, -1)
                    const variableValue = variables[variableName]
                    if (variableValue == undefined) {
                        console.error(`Variable "${variableName}" has not been given a value`)
                        continue
                    }
                    result[newPropertyName] = variableValue
                } else {
                    // Replace variable references in strings with their (STRING) value
                    result[newPropertyName] = json[prop].replace(/{(.*?)}/g, function (_match, variableName) {
                        const variableValue = variables[variableName]
                        if (variableValue == undefined) {
                            console.error(`Variable "${variableName}" has not been given a value`)
                            return
                        }
                        if (typeof variableValue != "string") {
                            console.error(`Variable "${variableName}" must be a string if being concatenated.`)
                            return
                        }
                        return variableValue
                    })
                }
            } else {
                // if the value is not modifed, just set the result value with the property name.
                result[newPropertyName] = json[prop]
            }

        }
    }

    return result
}

module.exports = {
    insertVariablesInJSON
}