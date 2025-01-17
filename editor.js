// Configure Monaco loader
let editor;
let currentFile = '';
const editorFiles = {};

// Initialize Monaco Editor
require(['vs/editor/editor.main'], function () {
    // Register custom JavaScript tokens
    monaco.languages.setMonarchTokensProvider('javascript', {
        tokenizer: {
            root: [
                // Control flow keywords in purple (must come before function detection)
                [/\b(if|else|for|while|do|switch|case|break|continue|return)\b/, 'keyword.control'],
                
                // Declaration keywords in blue
                [/\b(const|let|var|function|class)\b/, 'keyword'],
                
                // Function calls - match identifier followed by (, but not if it's a control keyword
                [/[a-zA-Z_$][\w$]*(?=\s*\()/, {
                    cases: {
                        'if|for|while|switch': 'keyword.control',
                        '@default': 'function'
                    }
                }],
                
                // Variables and other identifiers
                [/[a-zA-Z_$][\w$]*/, 'variable'],
                
                // Numbers
                [/\d+/, 'number'],
                
                // Strings
                [/"[^"]*"/, 'string'],
                [/'[^']*'/, 'string'],
                
                // Comments
                [/\/\/.*$/, 'comment'],
                [/\/\*/, 'comment', '@comment'],
            ],
            comment: [
                [/[^/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[/*]/, 'comment']
            ],
        }
    });

    // Define custom VSCode Dark Modern theme
    monaco.editor.defineTheme('vscode-dark-modern', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // Keywords
            { token: 'keyword', foreground: '569CD6' },  // blue for declaration keywords
            { token: 'keyword.control', foreground: 'C586C0' },  // purple for control flow
            
            // Variables and Functions
            { token: 'variable', foreground: '9CDCFE' }, // light blue for variables
            { token: 'function', foreground: 'DCDCAA' }, // yellow for functions
            
            // Literals
            { token: 'number', foreground: 'B5CEA8' },
            { token: 'string', foreground: 'CE9178' },
            { token: 'comment', foreground: '6A9955' }
        ],
        colors: {
            'editor.foreground': '#D4D4D4',
            'editor.background': '#1E1E1E',
            'editor.lineHighlightBackground': '#2F333D',
            'editorCursor.foreground': '#FFFFFF',
            'editor.selectionBackground': '#264F78',
            'editor.inactiveSelectionBackground': '#3A3D41',
            'editorLineNumber.foreground': '#858585',
            'editorLineNumber.activeForeground': '#C6C6C6'
        }
    });

    // Configure JavaScript language features
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: true,
        strict: true
    });

    // Enable semantic highlighting
    monaco.languages.typescript.javascriptDefaults.setModeConfiguration({
        completionItems: true,
        hovers: true,
        documentSymbols: true,
        tokens: true,
        colors: true,
        foldingRanges: true,
        diagnostics: true,
        selectionRanges: true,
        semanticHighlighting: true
    });

    // Create editor with enhanced VSCode-like settings
    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: '',
        language: 'javascript',
        theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'vs' : 'vscode-dark-modern', // Use our custom theme
        fontSize: 16,
        fontFamily: "'Fira Code', 'Consolas', monospace",
        minimap: { enabled: true },
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        bracketPairColorization: { enabled: true },
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        snippetSuggestions: 'inline',
        suggest: {
            showKeywords: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true,
            showModules: true,
        },
        semanticHighlighting: { enabled: true },
        hover: { enabled: true },
        links: { enabled: true },
        contextmenu: true,
        quickSuggestions: {
            other: true,
            comments: false,
            strings: false
        },
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: 'on',
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always'
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Digit7, function() {
        editor.trigger('keyboard', 'editor.action.commentLine', null);
    });

    // Disable validation squiggles
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true
    });

    // Enable some language features
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    
    // Add basic JavaScript types
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
        declare function forward(distance: number): void;
        declare function right(angle: number): void;
        declare function left(angle: number): void;
        declare function width(w: number): void;
        declare function goto(x: number, y: number): void;
        declare function setSize(width: number, height: number): void;
    `, 'ts:turtle.d.ts');

    // Handle theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'vs' : 'vscode-dark-modern';
                monaco.editor.setTheme(theme);
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Load initial file if exists
    const scriptFileName = document.getElementById('script-file-name').dataset.filename;
    if (scriptFileName) {
        loadFile(scriptFileName);
    }

    // Set up event listeners
    setupEventListeners();
});

// File handling functions
function createNewFile() {
    const fileName = prompt('Enter file name (e.g., myScript.js):');
    if (!fileName) return;

    if (editorFiles[fileName]) {
        alert('File already exists!');
        return;
    }

    editorFiles[fileName] = '';
    currentFile = fileName;
    editor.setValue('');
    updateFileSelector();
    selectFile(fileName);
}

function loadFile(fileName) {
    if (!editorFiles[fileName]) {
        let content = selectedExecutionScriptContent || '';
        editorFiles[fileName] = content;
    }
    currentFile = fileName;
    editor.setValue(editorFiles[fileName]);
    updateFileSelector();
}

function updateFileSelector() {
    const selector = document.getElementById('fileSelector');
    selector.innerHTML = '<option value="" disabled>Select File</option>';
    
    Object.keys(editorFiles).forEach(fileName => {
        const option = document.createElement('option');
        option.value = fileName;
        option.textContent = fileName;
        option.selected = fileName === currentFile;
        selector.appendChild(option);
    });
}

function selectFile(fileName) {
    const selector = document.getElementById('fileSelector');
    selector.value = fileName;
}

function setupEventListeners() {
    document.getElementById('newFileBtn').addEventListener('click', createNewFile);

    document.getElementById('fileSelector').addEventListener('change', (e) => {
        const fileName = e.target.value;
        if (fileName) {
            loadFile(fileName);
        }
    });

    // Auto-save functionality
    editor.getModel()?.onDidChangeContent(() => {
        if (currentFile) {
            editorFiles[currentFile] = editor.getValue();
        }
    });
}
