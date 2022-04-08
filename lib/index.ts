const chalk = require("chalk");
const fs = require("fs");
const readline = require("readline");
const path = require('path');

module.exports = class ExtractCssNames {
    private config: { [key: string]: any; }
    private displayResult: boolean;
    private path: string;
    private outputCss: string;
    private outputJs: string;
    private data: string;
    private restModulo: number;
    private restTime: number;
    private progressBg: string;
    private ignore: string[];
    private matches: { find: string; replace: string; type: string }[];
    private ignored: { find: string; type: string; message?: string; replace?: string }[];
    private charsLength: number;
    private matchResult: { find: string; type: string; message?: string; replace?: string }[];
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

    constructor(configuration: { [key: string]: any; }) {
        this.config = this.isObject(configuration) ? configuration : {};
        this.displayResult = this.isBoolean(this.config.displayResult) ? this.config.displayResult : false;
        this.path = this.isString(this.config.path) ? this.config.path : '';
        this.outputCss = this.isString(this.config.outputCss) ? this.config.outputCss : '/tmp/extract-css-names--css';
        this.outputJs = this.isString(this.config.outputJs) ? this.config.outputJs : '/tmp/extract-css-names--js';
        this.data = this.isString(this.config.data) ? this.config.data : undefined;
        this.restModulo = this.isNumber(this.config.restModulo) ? this.config.restModulo : 1000;
        this.restTime = this.isNumber(this.config.restTime) ? this.config.restTime : 500;
        this.ignore = this.isArray(this.config.ignore) ? this.config.ignore : [];
        this.encoding = this.isString(this.config.encoding) ? this.config.encoding : "UTF-8";
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

        this.matches = [];
        this.ignored = [];
        this.charsLength = 0;
        this.matchResult = [];

        //@ts-ignore
        return this.extract();
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

    /**
     * Hex colors
     * #ddd
     * #3d4456
     */
    hasHex(word: string) {
        return new RegExp(/^[#]{1}[a-zA-Z0-9]{3,6}/g).test(word);
    }

    /**
     * The end of rgba colors
     * .8 // rgb(0,0,0.8);
     */
    hasRgbType1(word: string) {
        return new RegExp(/^[.]{1}[0-9]{1,2}/g).test(word);
    }

    /**
     * The end of rgba colors
     * 0.8 // rgb(0,0,0.8);
     */
    hasRgbType2(word: string) {
        return new RegExp(/^[0-9]{1}[.]{1}[0-9]{1,2}/g).test(word);
    }

    /**
     * End of url
     * .gif" // background-image: url("/url/image.gif");
     * .ttf?22t19m"
     * .woff?22t19m"
     * .woff"
     * .eot"
     * .woff2"
     * .png"
     */
    hasUrl(word: string) {
        return new RegExp(/^[.]{1}[a-zA-Z0-9?&]{1,}["]{1}/g).test(word);
    }

    /**
     * End of url
     * w3.org/2000/svg' // background-image: url("/url/image.gif");
     */
    hasPath(word: string) {
        return new RegExp(/[a-zA-Z0-9?&/]{1,}[']{1}/g).test(word) || new RegExp(/[a-zA-Z0-9?&/]{1,}["]{1}/g).test(word);
    }

    hasQuestionMark(word: string) {
        return new RegExp(/[\?]{1}/g).test(word);
    }

    inIgnoreList(word: string) {
        if (this.ignore.length) {
            if (this.ignore.filter(string => string === word).length) {
                return true;
            }

            for (let x = 0; x < this.ignore.length; x++) {
                const match = "^\\" + this.ignore[x];

                if (new RegExp(match, 'g').test(word)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Has s
     * .2s
     * 0.2s
     */
    hasSecond(word: string) {
        return new RegExp(/^[0-9]{0,1}[.]{1}[0-9]{1,2}[s]{1}/g).test(word);
    }

    /**
     * Has em
     * .22em
     * 0.22em
     * 0.2em
     */
    hasEm(word: string) {
        return new RegExp(/^[0-9]{0,1}[.]{1}[0-9]{1,2}[em]{2}/g).test(word);
    }

    /**
     * Has rem
     * .22rem
     * 0.22rem
     * 0.2rem
     */
    hasRem(word: string) {
        return new RegExp(/^[0-9]{0,1}[.]{1}[0-9]{1,2}[rem]{3}/g).test(word);
    }

    isValid(word: string, type: string): Promise<string> {

        return new Promise(resolve => {
            word = word.trim();

            if (
                !word.length
                || this.inIgnoreList(word)
                || this.hasHex(word)
                || this.hasRgbType1(word)
                || this.hasRgbType2(word)
                || this.hasUrl(word)
                || this.hasPath(word)
                || this.hasQuestionMark(word)
                || this.hasSecond(word)
                || this.hasEm(word)
                || this.hasRem(word)
            ) {
                return resolve('');
            }

            return resolve(type);
        });
    }

    pushWord(word: string, type: string): Promise<boolean> {
        return new Promise(resolve => {
            word = word.trim();

            if (!word.length) {
                return resolve(false);
            }

            if (this.inIgnoreList(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Whitelist'
                });

                return resolve(false);
            }

            if (this.hasSecond(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Time'
                });

                return resolve(false);
            }

            if (this.hasHex(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Hex color'
                });
                return resolve(false);
            }

            if (this.hasRgbType1(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Rgb | Numeric'
                });
                return resolve(false);
            }

            if (this.hasRgbType2(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Rgb | Numeric'
                });
                return resolve(false);
            }

            if (this.hasUrl(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Url|Path'
                });
                return resolve(false);
            }

            if (this.hasPath(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Url|Path'
                });
                return resolve(false);
            }

            if (this.hasQuestionMark(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Question mark'
                });
                return resolve(false);
            }

            if (this.hasEm(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Em'
                });
                return resolve(false);
            }

            if (this.hasRem(word)) {
                this.ignored.push({
                    find: word,
                    type,
                    message: 'Rem'
                });
                return resolve(false);
            }

            if (0 === this.matches.filter(x => x.find === word).length) {
                const d = {
                    find: word,
                    type,
                    replace: ''
                };

                this.matchResult.push(d);
                this.matches.push(d);
            }

            return resolve(true);
        });
    }

    getMatchesFromTmpFile(): Promise<{ find: string, type: string, replace: string }[]> 
    {
        return new Promise((resolve) => 
        {
            let fileContent: any = [];

            if (fs.existsSync(this.outputCss)) 
            {
                fileContent = fs.readFileSync(this.outputCss, this.encoding);

                try {
                    fileContent = JSON.parse(fileContent);
                }
                catch (e) {
                    fileContent = [];
                }
            }

            resolve(fileContent);
        });
    }

    /**
     * Generate and array with the alphabet
     * @param {string} charA 
     * @param {string} charZ 
     * @param {int} repeat 
     * @returns {array}
     */
    alphabet(charA: string, charZ: string, repeat: number = 0) {
        const x = [];
        let i = charA.charCodeAt(0);
        let j = charZ.charCodeAt(0);

        for (; i <= j; ++i) {
            let f = String.fromCharCode(i);

            if (repeat) {
                f = `${f}${repeat}`;
            }

            x.push(f);
        }

        return x;
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

    get_bar(length: number, char: string, color: any = (a: any) => a) {
        let str = "";

        for (let i = 0; i < length; i++) {
            str += char;
        }

        return color(str);
    }

    getMatches() {
        return this.matches;
    }

    setMatches(matches: { find: string; replace: string; type: string }[]) 
    {
        this.matches = matches;
    }

    getDataFromFile() 
    {
        return new Promise((resolve, reject) => 
        {
            if (fs.existsSync(this.data)) 
            {
                this.data = fs.readFileSync(this.data, this.encoding);
            }

            resolve(true);
        });
    }

    lineWalk(line: string, count: number): Promise<number> 
    {
        return new Promise(async (resolve) => 
        {
            line = line.trim();
            let matchClass: string[] | null = null;
            let matchId: string[] | null = null;

            /**
             * Detect class
             */
            if (new RegExp(/[.]{1}[a-zA-Z-_0-9]{1,}/g).test(line)) {
                matchClass = line.match(/[.]{1}[a-zA-Z-_0-9]{1,}/g);
            }

            /**
             * Detect id
             */
            if (new RegExp(/[#]{1}[a-zA-Z-_0-9]{1,}/g).test(line)) {
                matchId = line.match(/[#]{1}[a-zA-Z-_0-9]{1,}/g);
            }

            /**
             * No match in line
             */
            if ((null === matchClass || 0 === matchClass.length) && (null === matchId || 0 === matchId.length)) {
                count += 1;
                return resolve(count);
            }

            /**
             * Extract matches by class name
             */
            if (null !== matchClass && matchClass.length) {
                await this.walkMatch(matchClass);
            }
            /**
             * Extract matches by id
             */
            if (null !== matchId && matchId.length) {
                await this.walkMatch(matchId);
            }

            count += 1;
            return resolve(count);
        });
    }

    walkMatch(lineMatches: string[]): Promise<boolean> {
        return new Promise(async (resolve) => {
            const extractFromFound = (c: number): Promise<number> => {
                return new Promise(async (extractFromFoundResolve) => {
                    const innerLine = lineMatches[c];
                    let type = '';

                    if ('.' === innerLine.charAt(0)) {
                        type = 'class';
                    }

                    if ('#' === innerLine.charAt(0)) {
                        type = 'id';
                    }

                    const t = await this.isValid(innerLine, type);
                    await this.pushWord(innerLine, t);

                    c += 1;
                    extractFromFoundResolve(c);
                });
            }

            const nextFound = (c = 0) => {
                return new Promise(async (nextFoundResolve) => {
                    c = await extractFromFound(c);

                    if (undefined !== lineMatches[c]) {
                        await nextFound(c);
                        return nextFoundResolve(true);
                    }
                    else {
                        return nextFoundResolve(true);
                    }
                });
            };

            await nextFound();
            resolve(true);
        });
    }

    extractClassNames(): Promise<{ css: { find: string; replace: string; type: string; }[], js: { find: string; replace: string; type: string; }[] }> {
        return new Promise(async (resolve, reject) => {
            /**
             * Loop trought css file
             * and get all class names and ids
             */
            const d: string[] = this.data.split('{');
            const dback: string = d.join('\n{');
            const lines: string[] = dback.split('\n');
            this.charsLength = lines.length;

            /**
             * Line loop initializator
             */
            const start = (i: number): Promise<number> => {
                return new Promise(async (resolve) => {
                    i = await this.lineWalk(lines[i], i);
                    this.log(i);

                    let timeout = 0;

                    if (0 === i % this.restModulo) {
                        timeout = this.restTime;
                    }

                    if (undefined !== lines[i]) {
                        return setTimeout(async () => {
                            await start(i);
                            return resolve(i);
                        }, timeout);
                    }
                    else {
                        return resolve(i);
                    }
                });
            }

            await start(0);

            console.log();

            /**
             * Now start to generate matches
             */
            let availableReplacements: string[] = [];
            let repeat = -1;
            let count = 0;
            const CONFIGURATION: {
                css: { find: string; replace: string; type: string; }[],
                js: { find: string; replace: string; type: string; }[],
            } = {
                css: [],
                js: []
            };

            for (let x = 0; x < this.matches.length; x++) {
                if (!['class', 'id'].includes(this.matches[x].type)) {
                    continue;
                }

                const getReplacement = (): string => {
                    /**
                     * Generate array with alhabet for replacements 
                     * availableReplacements = ['a', 'b', 'c' ....]
                     */
                    if (!availableReplacements[count]) {
                        count = 0;
                        repeat += 1;
                        availableReplacements = [
                            ...this.alphabet('a', 'z', repeat),
                        ];

                        return availableReplacements[count];
                    }

                    return availableReplacements[count];
                };

                let replacement: string = getReplacement();

                if ('class' === this.matches[x].type) {
                    replacement = '.' + replacement;
                }

                if ('id' === this.matches[x].type) {
                    replacement = '#' + replacement;
                }

                this.matches[x].replace = replacement;
                count += 1;

                const css: { find: string; replace: string; type: string; } = {
                    find: this.matches[x].find,
                    replace: this.matches[x].replace,
                    type: this.matches[x].type,
                };

                const js: { find: string; replace: string; type: string; } = {
                    find: this.matches[x].find.substring(1, this.matches[x].find.length),
                    replace: this.matches[x].replace.substring(1, this.matches[x].replace.length),
                    type: this.matches[x].type,
                };

                CONFIGURATION.css.push(css);
                CONFIGURATION.js.push(js);
                this.matchResult.push(css);
            }

            const sortDesc = (o: { find: string; replace: string; type: string; }[]) => {
                return o.sort((a, b) => {
                    if (a.find.length > b.find.length) {
                        return -1;
                    }

                    if (a.find.length < b.find.length) {
                        return 1;
                    }

                    return 0;
                });
            }

            CONFIGURATION.css = sortDesc(CONFIGURATION.css);
            CONFIGURATION.js = sortDesc(CONFIGURATION.js);


            if (this.displayResult && this.matchResult.length) {
                console.table('IGNORE');
                console.table(this.ignored);
                console.table('MATCHES');
                console.table(this.matchResult);
                this.matchResult = [];
            }

            resolve(CONFIGURATION);
        });
    };

    extract(): Promise<{ css: { find: string; replace: string; type: string; }[], js: { find: string; replace: string; type: string; }[] }> {
        return new Promise(async (resolve, reject) => {
            if (!this.isString(this.data)) {
                throw new Error(`Expected type string for data, got: ${typeof this.data}.`);
            }

            if (!this.isString(this.outputCss)) {
                throw new Error(`Expected type string for target path, got: ${typeof this.outputCss}.`);
            }

            if (!this.isString(this.outputJs)) {
                throw new Error(`Expected type string for target path, got: ${typeof this.outputJs}.`);
            }

            /**
             * Get data from file or if ile does not exists
             * the data ist main css string
             */
            await this.getDataFromFile();
            /**
             * Get current matches from TMP file
             * to handle multiple files without the same match
             */
            const matchesFromTmpFile = await this.getMatchesFromTmpFile();
            this.setMatches(matchesFromTmpFile);
            /**
             * Extract main css file class names
             * 
             * {
             *  css: [], // matches with . and #
             *  js: [] // matches wihtous . and # prefix
             * }
             */
            const currentMatches: { css: { find: string; replace: string; type: string; }[], js: { find: string; replace: string; type: string; }[] } = await this.extractClassNames();
            /**
             * Write result to files
             */

            const dirnameCss = path.dirname(this.outputCss);
            
            if (!fs.existsSync(dirnameCss)) 
            {
               fs.mkdirSync(dirnameCss);
            }

            const dirnameJs = path.dirname(this.outputJs);
            
            if (!fs.existsSync(dirnameJs)) 
            {
               fs.mkdirSync(dirnameJs);
            }

            fs.writeFileSync(this.outputCss, JSON.stringify(currentMatches.css));
            fs.writeFileSync(this.outputJs, JSON.stringify(currentMatches.js));
            /**
             * Return matches
             */
            resolve(currentMatches);
        });
    }
};
