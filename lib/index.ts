const chalk = require("chalk");
const readline = require('readline');
const ConcatSource = require('webpack-sources').ConcatSource;

module.exports = class WebpackReplaceClassNames {
    private config: { [key: string]: any; };
    private matches: { find: string; replace: string; type: string }[];
    private displayResult: boolean;
    private path: string;
    private restModulo: number;
    private restTime: number;
    private progressBg: string;
    private charsLength: number;
    private matchResult: { find: string; type: string; replace?: string, attribute?: string, message?: string }[];
    private attributes: string[];
    private ignore: string[];
    private finished: boolean;
    private forceReplace: { find: string; type: string }[];
    private logger: {
        logging: boolean;
        prefix: string;
        displayFilename: boolean;
        displayPercentage: boolean;
        type: string;
        barBg: string;
    };
    private logginIsOn: boolean;
    private loggingPrefix: string;
    private loggingDisplayFilename: boolean;
    private loggingDisplayPercentage: boolean;
    private loggingType: string;
    private spinnerCount: number;
    private encoding: string;
    
    constructor(config: { [key: string]: any; }) 
    {
        this.config = this.isObject(config) ? config : {};
        this.matches = this.isArray(this.config.matches) ? this.config.matches : [];
        this.displayResult = this.isBoolean(this.config.displayResult) ? this.config.displayResult : false;
        this.restModulo = this.isNumber(this.config.restModulo) ? this.config.restModulo : 1000;
        this.restTime = this.isNumber(this.config.restTime) ? this.config.restTime : 500;
        this.attributes = this.isArray(this.config.attributes) ? ['className', 'id', ...this.config.attributes] : ['className', 'id'];
        this.forceReplace = this.isArray(this.config.forceReplace) ? this.config.forceReplace : [];
        this.ignore = this.isArray(this.config.ignore) ? this.config.ignore : [];
        this.encoding = this.isString(this.config.encoding) ? this.config.encoding : "UTF-8";
        this.matchResult = [];
        this.path = '';
        this.charsLength = 0;
        this.finished = false;

        this.logger = this.isObject(this.config.logger) ? this.config.logger : {
            logging: true,
            prefix: 'Extract',
            displayFilename: true,
            displayPercentage: true,
            type: 'bar',
            barBg: 'bgWhite'
        };
        this.progressBg = this.isString(this.logger.barBg) ? this.logger.barBg : 'bgWhite';
        this.logginIsOn = this.isBoolean(this.logger.logging) ? this.logger.logging : true;
        this.loggingPrefix = this.isString(this.logger.prefix) ? this.logger.prefix : 'Extract';
        this.loggingDisplayFilename = this.isBoolean(this.logger.displayFilename) ? this.logger.displayFilename : true;
        this.loggingDisplayPercentage = this.isBoolean(this.logger.displayPercentage) ? this.logger.displayPercentage : true;
        this.loggingType = this.isString(this.logger.type) ? this.logger.type : 'bar';
        this.spinnerCount = 0;
    }

    hasClassOrId(line: string): boolean {
        return new RegExp(/^[\.]{1}[a-zA-Z0-9_-]/gi).test(line) || new RegExp(/^[\#]{1}[a-zA-Z0-9_-]+/gi).test(line);
    }

    isValidClassNameValue(v: string): number | boolean {
        /**
         * value: bsdvsd fdfds fsdf sdfdsf",das
         *      match: bsdvsd fdfds fsdf sdfdsf
         *      ignore: ",das
         */
        return v.length && new RegExp(/^[a-zA-Z0-9_\- ]+/gi).test(v);
    }

    alphabet(charA: string, charZ: string, repeat: number = 0): string[] {
        const x = [];
        let i = charA.charCodeAt(0);
        let j = charZ.charCodeAt(0);

        for (; i <= j; ++i) {
            let f = '';

            for (let l = 0; l <= repeat; l++) {
                f += String.fromCharCode(i);
            }

            x.push(f);
        }

        return x;
    }

    isObject(a: any): boolean {
        return '[object Object]' === Object.prototype.toString.call(a);
    }

    isArray(a: any): boolean {
        return '[object Array]' === Object.prototype.toString.call(a);
    }

    isString(a: any): boolean {
        return '[object String]' === Object.prototype.toString.call(a);
    }

    isBoolean(a: any): boolean {
        return '[object Boolean]' === Object.prototype.toString.call(a);
    }

    isNumber(a: any): boolean {
        return '[object Number]' === Object.prototype.toString.call(a);
    }

    log(count: number) {
        if (!this.logginIsOn) {
            return;
        }

        switch (this.loggingType) {
            case 'spinner':
            case 'dots':
            case 'dots2':
            case 'arc':
                {
                    return this.logLoader(this.loggingType, count);
                }
            case 'line':
                {
                    return this.logLine(count);
                }
            case 'bar':
            default:
                {
                    return this.logProgress(count);
                }
        }
    }

    getBackgroundColor(): any {
        if (undefined !== chalk[this.progressBg]) {
            return chalk[this.progressBg];
        }

        return chalk.bgWhite;
    }

    getFilename() {
        const path = this.path.split('/')[this.path.split('/').length - 1];
        return path.substring(0, path.length);
    }

    xCalc(count: number) {
        /**
         * X calculation for current percentage
         * 
         * 6893 = 100%
         *  234 = x
         * 
         * x = ((234*100)/6893)%
         */
        const current = (count * 100) / this.charsLength;
        const percentage_progress = (current).toFixed(2);

        return {
            current,
            percentage_progress
        }
    }

    logLoader(type: string, count: number) {
        let loadingItems = [
            '|',
            '/',
            '-',
            '\\'
        ];

        if ('arc' === type) {
            loadingItems = [
                "◜",
                "◠",
                "◝",
                "◞",
                "◡",
                "◟"
            ];
        }

        if ('dots' === type) {
            loadingItems = [
                "⠋",
                "⠙",
                "⠹",
                "⠸",
                "⠼",
                "⠴",
                "⠦",
                "⠧",
                "⠇",
                "⠏"
            ];
        }

        if ('dots2' === type) {
            loadingItems = [
                "⣾",
                "⣽",
                "⣻",
                "⢿",
                "⡿",
                "⣟",
                "⣯",
                "⣷"
            ];
        }

        const path = this.getFilename();
        const { percentage_progress } = this.xCalc(count);

        let filename = '';

        if (this.loggingDisplayFilename) {
            filename = `${this.loggingPrefix}${'' !== this.loggingPrefix ? ' ' : ''}${path} `;
        }

        let prc = '';

        if (this.loggingDisplayPercentage) {
            prc = ` ${percentage_progress} %`;
        }

        this.spinnerCount = (this.spinnerCount > loadingItems.length - 1) ? 0 : this.spinnerCount;
        const spinner = loadingItems[this.spinnerCount];
        const minus = `${filename}${prc} ${spinner} `.length;

        const maxWidth = process.stdout.columns - minus;
        const empty_bar_length = maxWidth;
        const filled_bar = spinner;
        const empty_bar = this.get_bar(empty_bar_length, " ");

        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${filename}${filled_bar}${empty_bar}${prc}`);
        this.spinnerCount += 1;
    }

    logProgress(count: number) {
        const path = this.getFilename();
        const { current, percentage_progress } = this.xCalc(count);

        let filename = '';

        if (this.loggingDisplayFilename) {
            filename = `${this.loggingPrefix}${'' !== this.loggingPrefix ? ' ' : ''}${path} `;
        }

        let prc = '';

        if (this.loggingDisplayPercentage) {
            prc = ` ${percentage_progress} %`;
        }

        const minus = `${filename}${prc}`.length;

        const maxWidth = process.stdout.columns - minus;
        const filled = maxWidth * (current / 100);
        const filled_bar_length = (filled).toFixed(0);
        const empty_bar_length = maxWidth - parseInt(filled_bar_length);
        const filled_bar = this.get_bar(parseInt(filled_bar_length), " ", this.getBackgroundColor());
        const empty_bar = this.get_bar(empty_bar_length, " ");

        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${filename}${filled_bar}${empty_bar}${prc}`);
    }

    logLine(count: number) {
        const path = this.getFilename();
        const { current, percentage_progress } = this.xCalc(count);

        let filename = '';

        if (this.loggingDisplayFilename) {
            filename = `${this.loggingPrefix}${'' !== this.loggingPrefix ? ' ' : ''}${path} `;
        }

        let prc = '';

        if (this.loggingDisplayPercentage) {
            prc = ` ${percentage_progress} %`;
        }

        const minus = `${filename}${prc}>`.length;

        const maxWidth = process.stdout.columns - minus;
        const filled = maxWidth * (current / 100);
        const filled_bar_length = (filled).toFixed(0);
        const empty_bar_length = maxWidth - parseInt(filled_bar_length);
        const filled_bar = this.get_bar(parseInt(filled_bar_length), "=");
        const empty_bar = this.get_bar(empty_bar_length, " ");

        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${filename}${filled_bar}>${empty_bar}${prc}`);
    }

    get_bar(length: number, char: string, color = (a: any) => a) {
        let str = "";

        for (let i = 0; i < length; i++) {
            str += char;
        }

        return color(str);
    }

    getReplacements(classNames: string, currentAttribute: string): string 
    {
        let m = 0;

        if (0 === this.matches.length || 0 === classNames.length) {
            return classNames;
        }

        let allClassNames: string[] = classNames.split(" ");

        for (let x = 0; x < allClassNames.length; x++) 
        {
            const find = allClassNames[x];

            if (find.length) 
            {
                if (this.ignore.length && this.ignore.filter(string => string === find).length) 
                {
                    this.matchResult.push({
                        find,
                        type: 'class',
                        message: 'Whitelist'
                    });
                }
                else 
                {
                    if (0 !== this.matches.filter(m => m.find === allClassNames[x] && 'class' === m.type).length) 
                    {
                        allClassNames[x] = this.getReplacement(allClassNames[x]);
                        this.matchResult.push({ find, replace: allClassNames[x], type: 'class', attribute: currentAttribute });
                        m += 1;
                    }
                    else 
                    {
                        this.matchResult.push({ find, type: 'class', attribute: currentAttribute });
                    }
                }
            }
        }

        return allClassNames.join(" ");
    }

    getReplacement(match: string) {
        for (let x = 0; x < this.matches.length; x++) {
            if (this.matches[x].find === match && 'class' === this.matches[x].type) {
                match = this.matches[x].replace;
            }
        }

        return match;
    }

    nextChar(c: number, line: string, chars: string[], attributeName: string): Promise<any> {
        return new Promise(nextCharResolve => {
            line += chars[c];

            if ('\"' === chars[c] || !new RegExp(/^[a-zA-Z0-9_\- ]+$/, 'g').test(line)) {
                /**
                 * Empty className
                 */
                if ('\"' === chars[c] && 1 === line.length) {
                    const charsAtEnd = [];

                    for (let i = c; i < chars.length; i++) {
                        charsAtEnd.push(chars[i]);
                    }

                    line = charsAtEnd.join('');
                }
                else {
                    /**
                     * Remove last char
                     */
                    const lastChar = line.charAt(line.length);
                    line = line.substring(0, line.length - 1);

                    const replacement = this.getReplacements(line, attributeName);

                    const charsAtEnd = [];

                    for (let i = c; i < chars.length; i++) {
                        charsAtEnd.push(chars[i]);
                    }

                    line = `${replacement}${lastChar}${charsAtEnd.join('')}`;
                }

                return nextCharResolve(
                    {
                        next: null,
                        lineData: line
                    }
                );
            }

            c += 1;
            nextCharResolve(
                {
                    next: c,
                    lineData: line
                }
            );
        });
    };


    /**
     * Char loop initializator
     */
    charWalker(line: string, attributeName: string): Promise<string> 
    {
        return new Promise(async (charWalkerResolve) => 
        {
            const chars = line.split('');

            const charWalk = (i: number, line: string): Promise<string> => 
            {
                return new Promise(async (charWalkResolve, reject) => 
                {
                    const result: any = await this.nextChar(i, line, chars, attributeName);
                    let l = result.lineData;
                    i = result.next;

                    if (null !== i && undefined !== chars[i]) {
                        l = await charWalk(i, l);
                        return charWalkResolve(l);
                    }

                    return charWalkResolve(l);
                })
            };

            const li = await charWalk(0, '');

            charWalkerResolve(li);
        });
    }

    lineWalk(x: number, lineData: any, attributeName: string): Promise<any> 
    {
        return new Promise(async (lineWalkResolve, reject) => 
        {
            if (0 === x) 
            {
                x += 1;
                return lineWalkResolve(
                    {
                        next: x,
                        line: lineData
                    }
                );
            }

            const line = await this.charWalker(lineData, attributeName);

            x += 1;
            return lineWalkResolve(
                {
                    next: x,
                    line
                }
            );
        });
    };

    attributeWalker(at: number, attributeName: string, source: string): Promise<any> 
    {
        return new Promise(async (attributeWalkerResolve) => 
        {
            const currentAttribute: string = this.attributes[at];
            this.path = attributeName;
            let lines: any = source.split(`${currentAttribute}:"`);
            this.charsLength = lines.length;
            let newCode = '';

            const lineWalker = (n: number): Promise<string> => 
            {
                return new Promise(async (lineWalkerResolve, reject) => 
                {
                    const result: any = await this.lineWalk(n, lines[n], currentAttribute);

                    if (n === 0) 
                    {
                        newCode += result.line;
                    }
                    else {
                        newCode += `${currentAttribute}:"${result.line}`;
                    }

                    n = result.next;
                    this.log(n);
                    let timeout = 0;

                    if (0 === result.next % this.restModulo) 
                    {
                        timeout = this.restTime;
                    }

                    if (undefined !== lines[n]) 
                    {
                        return setTimeout( async () => 
                        {
                            newCode = await lineWalker(n);
                            return lineWalkerResolve(newCode);
                        }, timeout);
                    }

                    return lineWalkerResolve(newCode);
                });
            };

            const d = await lineWalker(0);

            if (this.displayResult && this.matchResult.length) 
            {
                console.log();
                console.table(this.matchResult);
                this.matchResult = [];
            }

            console.log();
            console.log();
            at++;

            attributeWalkerResolve(
                {
                    next: at,
                    code: d
                }
            );
        });
    };

    walkAttributes(assetName: string, source: string): Promise<string> 
    {
        return new Promise(async (walkAttributesResolve) => 
        {
            const walkAttr = (attr: number, source: string): Promise<string> => 
            {
                return new Promise(async (walkAttrResolve, reject) => {
                    const result: any = await this.attributeWalker(attr, assetName, source);
                    source = result.code;
                    attr = result.next;

                    if (undefined !== this.attributes[attr]) {
                        source = await walkAttr(attr, source);
                        return walkAttrResolve(source);
                    }

                    return walkAttrResolve(source);
                });
            }

            const s = await walkAttr(0, source);
            walkAttributesResolve(s);
        })
    }

    processSingleAsset(assetName: string, source: string): Promise<string> {
        const self = this;
        this.matchResult = [];

        return new Promise(async (resolve, reject) => {
            const newData = await this.walkAttributes(assetName, source);
            self.finished = true;
            resolve(newData);
        });
    }

    forceReplacement(source: string, forceReplaceValidated: {find: string; type: string; splitBy: string}[]): Promise<string> 
    {
        return new Promise(async (resolve) => 
        {
            this.charsLength = forceReplaceValidated.length;

            const walkForces = (i: number, str: string): Promise<string> => 
            {
                return new Promise(async (walkForcesResolve) => 
                {
                    str = await this.singleForce(str, forceReplaceValidated[i]);
                    i += 1;

                    this.log(i);

                    if (undefined !== forceReplaceValidated[i]) 
                    {
                        str = await walkForces(i, str);
                        return walkForcesResolve(str);
                    }
                    else {
                        return walkForcesResolve(str);
                    }
                })
            }

            source = await walkForces(0, source);
            resolve(source);
        });
    }

    singleForce(newCode: string, replacement: { find: string, type: string, splitBy: string}): Promise<string> 
    {
        return new Promise(async (resolve) => 
        {
            const { splitBy, find, type } = replacement;
            let lines: any = newCode.split(splitBy);

            /**
             * No match found in current split
             */
            if(1 === lines.length)
            {
                return resolve(newCode);
            }
            else
            {
                let match: any = this.matches.filter( h => h.find === find && h.type === type);

                if(0 !== match.length)
                {
                    const lastChar = splitBy.substring(splitBy.length-1, splitBy.length);
                    const { replace } = match[0];
                    return resolve(lines.join(`${replace}${lastChar}`));
                }
                else
                {
                    return resolve(newCode);
                }
            }
        });
    }

    buildForceReplace(): Promise<{ find: string; type: string; splitBy: string }[]>
    {
        return new Promise( resolve => {
            const valited: { find: string; type: string; splitBy: string }[] = [];

            this.forceReplace.map( o => 
            {
                const { find, type } = o;
    
                if(
                    this.isString(find) 
                    && find.length 
                    && this.isString(type) 
                    && type.length 
                    && 0 !== this.matches.filter( h => h.find === find && h.type === type).length
                )
                {
                    valited.push(
                        {
                            splitBy: `${find}\ `,
                            find,
                            type
                        }
                    );
                    valited.push(
                        {
                            splitBy: `${find}'`,
                            find,
                            type
                        }
                    );
                    valited.push(
                        {
                            splitBy: `${find}"`,
                            find,
                            type
                        }
                    );
                }
            });

            resolve(valited);
        });
    }

    apply(compiler: any) {

        const name = 'WebpackReplaceClassNames';

        // webpack module instance can be accessed from the compiler object,
        // this ensures that correct version of the module is used
        // (do not require/import the webpack or any symbols from it directly).
        const { webpack } = compiler;

        // Compilation object gives us reference to some useful constants.
        const { Compilation, sources } = webpack;

        // RawSource is one of the "sources" classes that should be used
        // to represent asset sources in compilation.
        const { RawSource } = sources;

        // Tapping to the "thisCompilation" hook in order to further tap
        // to the compilation process on an earlier stage.

        compiler.hooks.emit.tapPromise(name, (compilation: any) => {
            const self = this;

            // return a Promise that resolves when we are done...
            return new Promise(async (resolve, reject) => {
                // Explore each chunk (build output):
                compilation.chunks.forEach((chunk: any) => {
                    // Explore each asset filename generated by the chunk:
                    chunk.files.forEach(async (filename: any) => {
                        const asset = compilation.getAsset(filename);  // <- standardized version of asset object
                        const contents = asset.source.source(); // <- standardized way of getting asset source
                        const forceReplaceValidated = await this.buildForceReplace();
                        let newFileContent: string = await this.processSingleAsset(filename, contents);

                        if (forceReplaceValidated.length) 
                        {
                            newFileContent = await this.forceReplacement(newFileContent, forceReplaceValidated);
                        }

                        compilation.updateAsset(
                            filename,
                            new RawSource(newFileContent)
                        );
                    });
                });

                const checkForResolve = setInterval(() => {
                    if (self.finished) {
                        clearInterval(checkForResolve);
                        resolve(true);
                    }
                }, 100);
            });
        });
    }
};