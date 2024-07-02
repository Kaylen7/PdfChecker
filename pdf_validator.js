const fs = require("fs");
const path = require("path");
const PDFParser = require("pdf2json");

//Custom modules imports
const { matchSymbolCheck } = require('./utils/matchSymbolCheck.js')

//Chalk imports
const chalk = require('chalk');
const log = console.log;

//DEBUG
function debLogs(logText) {
  return process.env.NODE_ENV === 'debug' ? log(chalk.red(logText)) : 'null';
}

// Initialize PDF parser
const pdfParser = new PDFParser(this, 1);

// Path to PDF file
const dirPath = "./pdfs/";
const resPath = "./results/"
let fileName = ""; //holds name of each pdf.

// Array to store results
const resultados = [`## TOC`, '[nWP]:nWP', '[nBP]:nBP', '[dEOL]:dEOL', '[bdWDS]:bdWDS', '[3CE]:3CE', '[3CS]:3CS', '[3LE]:3LE', '[3LS]:3LS', '\n\n\n'];
const resumen = [];

// Define regex expressions
const numWhitePage = /-{16,}\s*Page \(\d+\) Break\s*-{16,}\n(\d+)\n-{16,}\s*Page \(\d+\) Break\s*-{16,}/g;
const dashEOL = /—\n(.*?)\n/g;
const threeLME = /(\w{3}) \n.*?\1 \n/g;
const singLME = /(\w) \n.*?\1 \n.*?\1 \n/g;
const noNumberedFullPage = /\n.+?\n-+Page \(\d+\) Break-+\n([^0-9]+?)\n/g;
const badWordsStart = /\n(culo|puta).+?\n/g;
const threeLMS = /\n(\w{3}).*?\n\1/g;
const singLMS = /\n(\w).*?\n\1.*?\n\1/g;

// Define function to find matches and log results
function findMatches(text, tag, pattern, tocName) {
  const matches = text.match(pattern);
  if (matches) {
    log(chalk.hex('#4ecdc4')(`${tag}:`), chalk.hex('#e69052').italic(`${matches.length} resultados.`))
    resumen.push(`## ${tag}: *${matches.length} resultados*`);
    if (tag === 'Páginas blancas numeradas') {
      resultados.push(`## ${tag}: *${matches.length} resultados*. [${tocName}]`, `${matches.map((e) => e.match(/\d+/g)[1]).join('\n')}`);
    } else if (tag.startsWith('DEBUG')) {
      return matches;
    } else {
      resultados.push(`## ${tag}: *${matches.length} resultados*. [${tocName}]`, `${matches.join("\n*-------------------------------------------------------------------------------*\n")}`);
    }
    return matches;
  } else {
    !tag.startsWith("DEBUG") ? log(chalk.dim(`${tag}: 0 resultados.`)):'null';
    const iRemove = resultados.indexOf(`[${tocName}]:${tocName}`);
    if (iRemove > -1){
      resultados.splice(iRemove, 1);
    }
    return [];
  }
}

// Define function to write results to file
function writeResultsToFile() {
  try {
    fs.writeFileSync(resPath + "resultados.md", resultados.join("\n"));
    fs.writeFileSync(resPath + "resumen.md", resumen.join("\n"));
  } catch (err) {
    log(chalk.red(err.message));
  }
}

function removeLinesWithPdfName(pdfName, text) {
  const escapedPdfName = pdfName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedPdfName);
  let newText = "";

  const matches = findMatches(text, 'Comprobar nombre pdf', regex);
  if (matches.length != 0) {
    const lines = text.split("\r\n").filter(line => !line.startsWith(pdfName));
    newText = lines.join("\n");
    log(chalk.dim("Archivo reescrito sin pie de página."));
  } else {
    log(chalk.red("Error menor: El nombre del pdf no coincide con el del pie de página"));
    newText = text; 
  }
  fs.writeFileSync("rawTexts/parseResult.txt", newText);
  return newText;
}


function processPDFData(pdfData) {
  debLogs("Filename: " + fileName);
  
  const pdfName = path.basename(fileName, '.pdf');

  fs.writeFile("rawTexts/parseResult.txt", pdfData, (err) => {
    if (err) {
      console.error(err);
    } else {
      const textContent = fs.readFileSync("rawTexts/parseResult.txt", "utf-8");

      const newTextContent = removeLinesWithPdfName(pdfName, textContent);

      // Find matches and log results
      log("--------------------------------\n");
      log(chalk.bold("COMPROBACIONES"));
      findMatches(newTextContent, 'Páginas blancas numeradas', numWhitePage, 'nWP');
      findMatches(newTextContent, 'Páginas con contenido y sin número', noNumberedFullPage, 'nBP');
      findMatches(newTextContent, 'Raya al final de la línea', dashEOL, 'dEOL');
      findMatches(newTextContent, 'Culos, putas y demás...', badWordsStart, 'bdWDS');
      resultados.push('\n\n||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n-------------------------SÍMBOLOS DE APERTURA Y CIERRE-------------------------\n|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n')
      matchSymbolCheck(newTextContent, resultados, resumen);
      resultados.push(`||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n-------------------------OTRAS COMPROBACIONES-------------------------\n|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n\n`)
      log("\n--------------------------------\n");
      log(chalk.bold("Otras comprobaciones"));
      findMatches(newTextContent, 'Conjunto de tres caracteres repetidos final', threeLME, '3CE');
      findMatches(newTextContent, 'Conjunto de tres caracteres repetidos inicio', threeLMS, '3CS');
      findMatches(newTextContent, 'Letras iguales al final de tres líneas', singLME, '3LE');
      findMatches(newTextContent, 'Letras iguales al inicio de tres líneas', singLMS, '3LS');

      writeResultsToFile();
      log("--------------------------------\n");
    }
  });
}

pdfParser.on("pdfParser_dataError", (errData) => {
  console.error(errData.parserError)
});

pdfParser.on("pdfParser_dataReady", () => {
  processPDFData(pdfParser.getRawTextContent());
});


fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf' && !file.startsWith('.'));

  if (pdfFiles.length > 1) {
    log(chalk.blue(`De momento, este programa solo funciona con un pdf.\nAhora hay ${pdfFiles.length}.\nPrueba a añadirlos de uno en uno.`));
  } else {
    pdfFiles.forEach(pdfFile => {
      const filePath = path.join(dirPath, pdfFile);
      console.log("Archivo cargado", filePath);
      fileName = filePath;
      pdfParser.loadPDF(filePath);
    });
  }
});