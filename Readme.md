# Extract Css Names

Extract all CSS class and id names to generate (replace with) random names (a-z0-9). 
This module returns all matches. You can use it, to replace matches inside different files.

# How it works

Read data from the provided key "data". Extract all names and generate minified class names. 
The result (for each file) are stored inside 2 files:

    outputCss
    outputJs

For each file the output are written to the provided file ouput path, in the next iteration the current files output/content readed to avoid dupplicate names. 

# Example how to use it with gulp

    const ExtractCssNames = require('extract-css-names');
    const through = require('through2');
    const fs = require("fs");

    gulp.task('extract:css', (done) => 
    {
        /**
         * Storage
         */
        const outputCss = `${__dirname}/extracted-names-for-css`;
        const outputJs = `${__dirname}/extracted-names-for-js`;
        /**
         * Remove old matches
         */
        if (fs.existsSync(outputCss)) { fs.unlinkSync(outputCss); }
        if (fs.existsSync(outputJs)) { fs.unlinkSync(outputJs); }

        return gulp
            .src(
                [
                    `public/css/packages.css`,
                    `public/css/app.css`,
                ]
            )
            .pipe(
                /**
                * Loop trought each file and extract names
                */
                through.obj(async (cssFileBuffer, enc, cb) => 
                {
                    await new ExtractCssNames(
                        {
                            path: cssFileBuffer.path,
                            outputCss,
                            outputJs,
                            data: cssFileBuffer.contents.toString(),
                            restModulo: 10000, 
                            restTime: 200,
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
                                '.ContainerCompact',
                            ],
                        }
                    );

                    cb(null, cssFileBuffer);
                })
            );
    });

    gulp.task('obfuscate:css',
        gulp.series(
            [
                'extract:css'
            ]
        )
    );

## Example how to use it with node js

    const ExtractCssNames = require('extract-css-names');
    const fs = require("fs");

    /**
    * Matches storage
    */
    const outputCss = `${__dirname}/extracted-names-for-css`;
    const outputJs = `${__dirname}/extracted-names-for-js`;
    /**
    * Remove old matches
    */
    if (fs.existsSync(outputCss)) { fs.unlinkSync(outputCss); }
    if (fs.existsSync(outputJs)) { fs.unlinkSync(outputJs); }

    const files = [
        `public/css/packages.css`,
        `public/css/app.css`,
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
                restModulo: 10000,
                restTime: 200,
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
                    '.ContainerCompact'
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

# Example file content of outputCss

    [
        {
            "find": ".rc-calendar-year-panel-decade-select-arrow",
            "replace": ".c",
            "type": "class"
        },
        {
            "find": ".rc-calendar-decade-panel-last-century-cell",
            "replace": ".d",
            "type": "class"
        },
        {
            "find": ".rc-calendar-decade-panel-next-century-cell",
            "replace": ".e",
            "type": "class"
        },
        {
            "find": ".rc-calendar-picker-slide-up-appear-active",
            "replace": ".f",
            "type": "class"
        }
    ]

## Example file content of outputJs

    [
        {
            "find":"rc-calendar-year-panel-decade-select-arrow",
            "replace":"c",
            "type":"class"
        },
        {
            "find":"rc-calendar-decade-panel-last-century-cell",
            "replace":"d",
            "type":"class"
        },
        {
            "find":"rc-calendar-decade-panel-next-century-cell",
            "replace":"e",
            "type":"class"
        },
        {
            "find":"rc-calendar-picker-slide-up-appear-active",
            "replace":"f",
            "type":"class"
        }
    ]

# ExtractCssNames options 

| Option          | type    | Description   
| --------------- | ------- | ------------- |
| `path`          | string  | Path of the current file
| `outputCss`     | string  | Path to store/write current matches for replacement in CSS files
| `outputJs`      | string  | Path to store/write current matches for replacement in JS files
| `data`          | string  | Path to file or (css) data as string. If is file (fs.existsSync), the file content are readed.
| `encoding`      | string  | Read/Write file with this encoding standard. Default 'UTF-8'.
| `restModulo`    | number  | Each number of lines should be made a break
| `restTime`      | number  | Duration of the break in ms
| `displayResult` | boolean | Display the match result in the terminal
| `ignore`        | array   | Ignore names to extract (with provided type: '.' for class and '#' for id), [ '.classNameToIgnore', '#idToIgnore' ]
| `logger`        | object  | Logger options
    
# ExtractCssNames logger options 

| Option              | type    | Description   
| ------------------- | ------- | ------------- |
| `logging`           | boolean | Display current process 
| `prefix`            | string  | Prefix on the logging line 
| `displayFilename`   | boolean | Display current processed filename (filename extracted from path)
| `displayPercentage` | boolean | Display current percentage value
| `type`              | string  | Process animation type. Available types: 'spinner', 'bar', 'dots', 'dots2', 'arc', 'line'
| `barBg`             | string  | If the animation type is bar, then set the bar's background-color. Background colors are based on the `chalk` module

# Maintainer

[David Janitzek](https://github.com/janitzed/)