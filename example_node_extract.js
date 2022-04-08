const ExtractCssNames = require('./ExtractCssNames');
const fs = require("fs");

/**
 * Matches storage
 */
const outputCss = `${__dirname}/extracted-names-for-css`;
const outputJs = `${__dirname}/extracted-names-for-js`;
/**
 * Remove old configuration
 */
if (fs.existsSync(outputCss)) { fs.unlinkSync(outputCss); }
if (fs.existsSync(outputJs)) { fs.unlinkSync(outputJs); }

const files = [
    `dako/public/1.0.0/css/packages.css`,
    `dako/public/1.0.0/css/app.css`,
];

const extract = async (c = 0) =>
{
    const data = fs.readFileSync(files[c], 'UTF-8');

    await new ExtractCssNames(
        {
            path: files[c],
            outputCss,
            outputJs,
            data,
            restModulo: 10000, // Each 10000 lines
            restTime: 200, // make a coffee break for 200ms
            logger: {
                logging: true,
                prefix: 'Extract',
                displayFilename: true,
                displayPercentage: true,
                type: 'bar', // spinner | bar | dots | dots2 | arc | line
                barBg: 'bgCyan'
            },
            displayResult: true,
            ignore: [
                'ContainerCompact'
            ],
        }
    );

    c++;

    if(undefined !== files[c])
    {
        await extract(c);
    }
}

extract();
