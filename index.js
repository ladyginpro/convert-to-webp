import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { fileURLToPath } from 'url';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import chalk from 'chalk';

const error = chalk.bold.red;
const code = chalk.hex('#D19A60');
const args = yargs(process.argv.slice(2)).argv;
const SETTINGS = {
  sourceDir: `${args.sourceDir || './images/'}${args.subDir || ''}`,
  outputDir: args.outputDir || null,
  quality: +args.quality || 90,
  fileTypes: args.fileTypes || `jpg, png`,
  findDeep: args.findDeep !== undefined ? args.findDeep : true,
};

const WEBP_QUALITY = SETTINGS.quality;
const FILE_TYPES = SETTINGS.fileTypes.replace(/ /g, '').split(',');
const SOURCE_DIR = path.isAbsolute(SETTINGS.sourceDir)
  ? path.normalize(SETTINGS.sourceDir)
  : path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      SETTINGS.sourceDir
    );

const checkFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) return false;

  const dirContents = fs.readdirSync(path.normalize(dirPath));
  const dirContentsLength = dirContents.length;

  for (let i = 0; i < dirContentsLength; i++) {
    if (
      fs.lstatSync(path.resolve(dirPath, dirContents[i])).isFile() &&
      FILE_TYPES.includes(path.extname(dirContents[i]).slice(1))
    ) {
      return true;
    }
  }

  return false;
};

const getDirs = (dirPath) => {
  let result = [];

  if (checkFiles(dirPath)) {
    result.push(dirPath);
  }

  if (SETTINGS.findDeep) {
    const subDirs = fs.readdirSync(path.normalize(dirPath)).filter((item) => {
      return fs.lstatSync(path.resolve(dirPath, item)).isDirectory();
    });

    if (subDirs.length) {
      subDirs.forEach((subDir) => {
        result = result.concat(getDirs(path.resolve(dirPath, subDir)));
      });
    }
  }

  return result;
};

const convertToWebp = async (dirPath) => {
  await imagemin([path.resolve(dirPath, `*.{${FILE_TYPES.join()}}`)], {
    destination: SETTINGS.outputDir || dirPath,
    plugins: [imageminWebp({ quality: WEBP_QUALITY })],
  });

  console.log(
    chalk.bold.greenBright(
      `In folder "${path.basename(dirPath)}" - webp created!`
    )
  );
};

const run = async () => {
  const dirs = getDirs(SOURCE_DIR);

  if (!dirs.length) console.log(error('Files not found!'));

  console.log(``);

  await Promise.all(
    dirs.map(async (dirPath) => {
      await convertToWebp(dirPath);
      return dirPath;
    })
  );

  console.log(code(`Your config = {`));
  console.log(code(`  sourceDir: ${SETTINGS.sourceDir},`));
  console.log(code(`  outputDir: ${SETTINGS.outputDir},`));
  console.log(code(`  subDir: ${SETTINGS.subDir},`));
  console.log(code(`  quality: ${SETTINGS.quality},`));
  console.log(code(`  fileTypes: '${SETTINGS.fileTypes}',`));
  console.log(code(`  findDeep: ${SETTINGS.findDeep ? 'true' : "'ignore'"},`));
  console.log(code(`}`));
};

run();
