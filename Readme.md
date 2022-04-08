# Webpack Replace Class Names

Replace all CSS class name's and id's based on given match array. 

# Example how to use it in webpack

    const WebpackReplaceClassNames = require('webpack-replace-class-names');
    const matchesFile = `${__dirname}/extracted-names-for-js`;

    if(!fs.existsSync(matchesFile))
    {
        throw new Error(`The required file cannot be found: ${matchesFile}`);
    }

    let matches = [];
    try{
        matches = fs.readFileSync(matchesFile, 'UTF-8');
        matches = JSON.parse(matches);
    }
    catch(e)
    {
        throw new Error(e);
    }

    const config = {
        resolve: {
            extensions: ['.ts', '.js', '.tsx'],
        },
        cache: ....,
        entry: ...,
        output: ....,
        module: {
            rules: [
                ....
            ]
        },
        externals: {....},
        plugins: [
            ....
            new WebpackReplaceClassNames(
                {
                    matches,
                    restModulo: 10000,
                    restTime: 200, 
                    displayResult: false,
                    ignore: [],
                    attributes: [],
                    forceReplace: [
                        {
                            find: '_App',
                            type: 'id'
                        },
                        {
                            find: '_Diet',
                            type: 'id'
                        }
                    ],
                    logger: {
                        logging: true,
                        prefix: 'Replace',
                        displayFilename: true,
                        displayPercentage: true,
                        type: 'bar',
                        barBg: 'bgCyan'
                    },
                }
            )
        ]
    };

# Example of HTML file content before replacement

    <div class="px-1">
        <div class="row">
            <div class="col-6 col-lg-3 flex">
                <div class="card box-shadow-transparent w-100 bg-transparent">
                    <div class="card-header">
                        <h1 class="card-title text-green font-xl">service</h1>
                    </div>
                    <div class="card-body table-responsive p-0">
                        <table class="table table-hover text-nowrap w-100">
                            <tbody>
                                <tr>
                                    <td class="border-none py-0"></td>
                                </tr>
                                <tr>
                                    <td class="border-none py-0"></td>
                                </tr>
                                <tr>
                                    <td class="border-none py-0"></td>
                                </tr>
                                <tr>
                                    <td class="border-none py-0"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

# Example of HTML file content after replacement 

    <div class="k189">
        <div class="j191">
            <div class="y182 d141 w185">
                <div class="c186 w195 w-100 d67">
                    <div class="f103">
                        <h1 class="g118 m122 i198">service</h1>
                    </div>
                    <div class="s129 o49 f192">
                        <table class="c183 s102 b104 w-100">
                            <tbody>
                                <tr>
                                    <td class="m199 c189"></td>
                                </tr>
                                <tr>
                                    <td class="m199 c189"></td>
                                </tr>
                                <tr>
                                    <td class="m199 c189"></td>
                                </tr>
                                <tr>
                                    <td class="m199 c189"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

# Limitations

Only Modules there are generated from the base path (not node_modules) are replaced. Modules imported from node_modules are not replaced. External module names has to be in the "ignore" list.

# This module are based on the 2 other modules

Extract class and id names from css file

[extract-css-names](https://www.npmjs.com/package/extract-css-names)

Replace class and id names in css files based on the "extract-css-names" module.

[replace-css-names](https://www.npmjs.com/package/replace-css-names)

# WebpackReplaceClassNames options 

| Option          | type    | Description   
| --------------- | ------- | ------------- |
| `matches`       | array   | Array of objects: [ { find: string; replace: string; type: string;}, ... ]
| `attributes`    | array   | Array of strings/atrribute names to replace. Default [ 'className', 'id' ]
| `forceReplace`  | array   | Array of strings. If sensitive match, does not replace a class or id, you can force it ( the forced name has to be availbale in the matches array). Structure [ { find: string; type: string } ]
| `restModulo`    | number  | Each number of lines should be made a break
| `restTime`      | number  | Duration of the break in ms
| `displayResult` | boolean | Display the replace result in the terminal
| `ignore`        | array   | Ignore names to replace
| `logger`        | object  | Logger options

# WebpackReplaceClassNames logger options 

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