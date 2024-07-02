const chalk = require('chalk');
const log = console.log;

//DEBUG
function debLogs(logText) {
    return process.env.NODE_ENV === 'debug' ? log(chalk.red(logText)) : 'null';
  }

function matchSymbolCheck(testContent, resultsArray, resumenArray) {
    const openSymbols = ['¡', '¿', '('];
    const returnArray = []

    for (const openSymbol of openSymbols) {
        const closeSymbol = getCloseSymbol(openSymbol);
        const regex = new RegExp(`\\${openSymbol}[^\\${closeSymbol}]+\\${openSymbol}.*?\n`, 'g')
        // const pattern = /\¡[^!]+¡.*?\n/g;
        const amountCompare = countPairs(testContent, openSymbol, closeSymbol);
        
        if (amountCompare.length > 0) {
            n = closeOpenSymbols(testContent, openSymbol, closeSymbol, amountCompare, returnArray);
            if (n === 0){
                returnArray.push(findMatches(testContent, `Símbolo ${openSymbol} sin cerrar`, regex));
            }
            resumenArray.push(`## Símbolo ${openSymbol} mal cerrado: *Consultar resultados.md*`)
        }
    }
    resultsArray.push(returnArray.join("\n"));
}

function findMatches(text, tag, pattern) {
    const matches = text.match(pattern);
    if (matches) {
      log(chalk.hex('#4ecdc4')(`${tag}:`), chalk.hex('#e69052').italic(`${matches.length} resultados.`))
      return matches;
    } else {
      log(chalk.dim(`${tag}: 0 resultados.`));
      return [];
    }
  }

function countPairs(text, openSymbol, closeSymbol) {
    //1. Count amount of open symbols and close symbols.
    const openReg = new RegExp(`\\${openSymbol}`, 'g');
    const closeReg = new RegExp(`\\${closeSymbol}`, 'g');
    const countOpen = text.match(openReg, 'g');
    const countClose = text.match(closeReg, 'g');
    const result = [];
    
    if (countOpen && countClose && countOpen.length != countClose.length) {
        result.push(countOpen.length);
        result.push(countClose.length);
    } else if ((countOpen && countClose) === null){
        console.log(`${openSymbol}, ${closeSymbol}: 0 apariciones`);
    } else {
        log(chalk.dim(`Misma cantidad de ${openSymbol} y de ${closeSymbol}`));
    }
    return result;
}

function closeOpenSymbols(text, openSymbol, closeSymbol, countAmount, arr) {
    const maxChunkLength = 600;
    let lastIndex = 0;
    let result =  0;

    if (countAmount[0] > countAmount[1]){
        debLogs(`Hay más ${openSymbol}: ${countAmount.join(', ')}`);
        log(chalk.hex('#4ecdc4')(`${openSymbol} sin cierre`));
    } else {
        debLogs(`Hay más ${closeSymbol}: ${countAmount.join(', ')}\nFunción pendiente de desarrollar.`)
    }
    while (lastIndex !== -1) {
        lastIndex = text.indexOf(openSymbol, lastIndex);
        if (lastIndex !== -1) {
            const chunk = text.substring(lastIndex, lastIndex + maxChunkLength);
            const closeIndex = chunk.indexOf(closeSymbol);
            if (closeIndex !== -1) {
                // Matching closeSymbol found, update lastIndex to search for next openSymbol
                lastIndex += closeIndex + 1;
            } else if (chunk.length === maxChunkLength) {
                // Maximum chunk length reached, check for another openSymbol
                const nextOpenIndex = text.indexOf(openSymbol, lastIndex + maxChunkLength);
                if (nextOpenIndex !== -1 && nextOpenIndex < lastIndex + maxChunkLength) {
                    // console.log(`Found another ${openSymbol} in chunk of 600 chars:\n-------\n`, chunk, `\n--------\n`);
                    arr.push(`Hay dos ${openSymbol} en 600 caracteres`, chunk, `\n--------\n`);
                    result++;
                } else {
                    // console.log(`Missing closure in 600 chars.\n-------\n`, chunk, `\n--------\n`);
                    arr.push(`Falta cierre en 600 caracteres`, chunk, `\n--------\n`);
                    result++;
                }
                lastIndex += maxChunkLength;
            } else {
                // console.log(`Missing closure\n-------\n`, chunk, `\n--------\n`);
                arr.push(`Falta cierre`, chunk, `\n--------\n`);
                lastIndex += chunk.length;
                result++;
            }
        }
    }
    return result;
}

function getCloseSymbol(openSymbol) {
    switch (openSymbol) {
        case '¡':
            return '!';
        case '¿':
            return '?';
        case '\(':
            return '\)';
        default:
            return '';
    }
}

module.exports = { matchSymbolCheck };