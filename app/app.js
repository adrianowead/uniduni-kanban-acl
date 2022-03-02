const { app, BrowserWindow } = require("electron");

// resolução de caminhos dentro da aplicação
const path = require("path");

// constante para abertura e gerenciamento da janela
const createWindow = () => {
    const win = new BrowserWindow({
        backgroundColor: "#fff",
        icon: path.join(__dirname, "assets", "img", "logo.png"),// customizando o ícone da janela
        webPreferences: {
            preload: path.join(__dirname, "preload.js"), // resolvendo caminho do preload
        },
    });

    // carregando arquivo inicial da aplicação
    // o mesmo que simplesmente abrir no navegador
    win.loadFile(path.join(__dirname, "index.html"));

    // remover o menu da janela, já que toda a navegação está no html
    win.removeMenu();
};

// assim que a aplicação estiver pronta para executar
app.whenReady().then(() => {
    // iniciando a janela
    createWindow();

    // dependendo do sitema operacional, como macOS, é preciso solicitar
    // a abertura da janela após a situação de 'activate'
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// quando todas as janelas estiverem fechadas,
// garantir o encerramento do procesos, especialmente no macOS (darwin)
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
